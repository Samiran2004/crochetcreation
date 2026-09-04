import logging
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List, Optional
from app.models.order import OrderCreate, OrderResponse, ManualOrderCreate, ManualOrderResponse, OrderStatus, StatusUpdateRequest
from app.core.db import get_database
from app.api.deps import get_current_admin_user, get_current_user, get_optional_current_user
from app.models.user import UserInDB
from bson import ObjectId
from datetime import datetime, timezone
from app.utils.email_sender import send_order_email, generate_and_send_invoice_task
from app.utils.websocket import manager

logger = logging.getLogger("app.orders")

router = APIRouter(prefix="/api/orders", tags=["orders"])

# Every order on the storefront is prepaid by UPI and verified by an admin
# against a payment screenshot, so the client never chooses a payment method.
PAYMENT_METHOD = "UPI"

# Hard ceiling per line. The storefront caps the stepper at 10; this is the
# same limit enforced where it counts, and it also bounds products whose stock
# level was never recorded.
MAX_QUANTITY_PER_ITEM = 10


def _product_query(product_id: str):
    try:
        return {"_id": ObjectId(product_id)}
    except Exception:
        return {"_id": product_id}


async def _price_items_from_catalog(db, raw_items):
    """
    Rebuild the order lines from the product catalog.

    Titles, prices and the order total that arrive in the request body are
    treated as display hints only — a client that posts price: 1 for a ₹499
    item would otherwise be charged ₹1. Everything that touches money is read
    back from the database here.

    Returns (items, total). Raises HTTPException on an unknown product, a
    non-positive quantity, or insufficient stock.
    """
    if not raw_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your basket is empty."
        )

    priced_items = []
    total = 0.0

    for line in raw_items:
        if not line.product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{line.title}' is no longer available. Please remove it and try again."
            )

        quantity = int(line.quantity or 0)
        if quantity < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Choose at least 1 of '{line.title}'."
            )
        if quantity > MAX_QUANTITY_PER_ITEM:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"You can order at most {MAX_QUANTITY_PER_ITEM} of '{line.title}' at a time. "
                    "Message us on WhatsApp for a bulk order."
                )
            )

        product = await db["products"].find_one(_product_query(line.product_id))
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{line.title}' is no longer available. Please remove it and try again."
            )

        available = product.get("stock_quantity")
        if available is None:
            available = product.get("stock_count")
        if product.get("in_stock") is False or (available is not None and available < quantity):
            in_stock_count = available if available is not None else 0
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Only {in_stock_count} left of '{product.get('title')}'. "
                    "Please reduce the quantity."
                ) if in_stock_count else f"'{product.get('title')}' has just sold out."
            )

        unit_price = product.get("sellingPrice")
        if unit_price is None:
            unit_price = product.get("price")
        unit_price = float(unit_price or 0)

        priced_items.append({
            "product_id": str(product.get("_id")),
            "title": product.get("title", line.title),
            "price": unit_price,
            "quantity": quantity,
            # Size is the buyer's choice, not a catalog value, so it is the one
            # field carried straight through from the request.
            "size": line.size,
        })
        total += unit_price * quantity

    return priced_items, round(total, 2)


async def _adjust_stock(db, items, delta):
    """
    Move stock by `delta` per unit ordered (-1 to reserve, +1 to release).
    Runs when an admin confirms or cancels an order, never at checkout, since
    an unpaid order should not hold inventory.
    """
    for item in items or []:
        product_id = item.get("product_id")
        if not product_id:
            continue
        try:
            product = await db["products"].find_one(_product_query(product_id))
            if not product:
                continue
            current = product.get("stock_quantity")
            if current is None:
                current = product.get("stock_count")
            if current is None:
                continue
            new_count = max(0, int(current) + delta * int(item.get("quantity", 0)))
            await db["products"].update_one(
                _product_query(product_id),
                {"$set": {
                    "stock_quantity": new_count,
                    "stock_count": new_count,
                    "in_stock": new_count > 0,
                }}
            )
        except Exception:
            # Stock drift must never block confirming an order the customer
            # has already paid for; it is logged for manual reconciliation.
            logger.exception("Could not adjust stock for product %s", product_id)

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: Optional[UserInDB] = Depends(get_optional_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        order_dict = order_in.model_dump()

        # Money is never taken from the request body — re-price from the catalog.
        items, total = await _price_items_from_catalog(db, order_in.items)
        order_dict["items"] = items
        order_dict["total_amount"] = total
        order_dict["payment_method"] = PAYMENT_METHOD

        order_dict["status"] = OrderStatus.PENDING_VALIDATION.value
        order_dict["created_at"] = datetime.now(timezone.utc)
        order_dict["email_sent"] = False
        # Explicitly attach the user_id as a BSON ObjectId if logged in
        order_dict["user_id"] = ObjectId(current_user.id) if (current_user and current_user.id) else None

        result = await db["orders"].insert_one(order_dict)

        # Retrieve and return the created order
        inserted_order = await db["orders"].find_one({"_id": result.inserted_id})

        # Notify admins, and the customer who placed it — never anyone else.
        try:
            order_response = OrderResponse(**inserted_order)
            await manager.send_order_event(
                "order_created",
                order_response.model_dump(by_alias=True),
                inserted_order.get("user_id"),
            )
        except Exception:
            logger.exception("Error sending order_created event")

        # Do NOT trigger the Brevo email here. It is triggered only upon confirmation/validation.
        return inserted_order

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to place order")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="We couldn't place your order just now. Please try again."
        )

@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        # Strict relational match using user_id BSON ObjectId
        cursor = db["orders"].find({"user_id": ObjectId(current_user.id)}).sort("created_at", -1)
        orders = await cursor.to_list(length=200)
        return orders
    except Exception:
        logger.exception("Failed to fetch orders for user %s", current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load your orders. Please try again."
        )

@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    status_filter: Optional[str] = None,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        query = {}
        if status_filter:
            query["status"] = status_filter

        cursor = db["orders"].find(query).sort("created_at", -1)
        orders = await cursor.to_list(length=200)
        return orders

    except Exception:
        logger.exception("Failed to fetch orders")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load orders. Please try again."
        )

# Invoice background task is imported from app.utils.email_sender

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: StatusUpdateRequest,
    background_tasks: BackgroundTasks,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    
    # Validation is handled by Pydantic model StatusUpdateRequest
    try:
        existing_order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        if not existing_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        previous_status = existing_order.get("status")
        new_status = status_update.status.value

        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": new_status}}
        )

        # Release reserved stock when a live order is cancelled.
        was_reserved = previous_status in (
            OrderStatus.CONFIRMED.value,
            OrderStatus.PROCESSING.value,
            OrderStatus.DELIVERED.value,
        )
        if new_status == OrderStatus.CANCELLED.value and was_reserved:
            await _adjust_stock(db, existing_order.get("items"), +1)

        updated_order = await db["orders"].find_one({"_id": ObjectId(order_id)})

        try:
            order_response = OrderResponse(**updated_order)
            await manager.send_order_event(
                "order_updated",
                order_response.model_dump(by_alias=True),
                updated_order.get("user_id"),
            )
        except Exception:
            logger.exception("Error sending order_updated event")

        # If payment is verified & confirmed (order status changed to Processing), send Brevo confirmation with invoice
        if new_status == OrderStatus.PROCESSING.value:
            to_email = updated_order.get("customer_email")
            name = updated_order.get("customer_name")
            if to_email:
                background_tasks.add_task(generate_and_send_invoice_task, to_email, name, updated_order)

        return updated_order

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to update order status for %s", order_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not update the order status. Please try again."
        )

@router.put("/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(
    order_id: str,
    background_tasks: BackgroundTasks,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """
    Admin endpoint to validate and confirm a pending order.
    Sets status to 'Confirmed' and queues in-memory PDF invoice generation and email sending.
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        existing_order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        if not existing_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        if existing_order.get("status") == OrderStatus.CONFIRMED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This order is already confirmed."
            )

        # Step 1: Await the PDF byte generation BEFORE triggering the Brevo background task.
        from app.utils.pdf_generator import generate_invoice_pdf
        pdf_bytes = await generate_invoice_pdf(existing_order)

        # Step 2: Update the MongoDB document to set status: "Confirmed".
        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "status": OrderStatus.CONFIRMED.value,
                "payment_verified_at": datetime.now(timezone.utc),
            }}
        )

        # Confirmation is the point the payment has been verified, so this is
        # where the stock is actually committed.
        await _adjust_stock(db, existing_order.get("items"), -1)

        updated_order = await db["orders"].find_one({"_id": ObjectId(order_id)})

        try:
            order_response = OrderResponse(**updated_order)
            await manager.send_order_event(
                "order_updated",
                order_response.model_dump(by_alias=True),
                updated_order.get("user_id"),
            )
        except Exception:
            logger.exception("Error sending order_updated event")

        # Step 3: Add the Brevo email dispatch to BackgroundTasks, passing the generated bytes.
        to_email = updated_order.get("customer_email")
        name = updated_order.get("customer_name")
        if to_email:
            background_tasks.add_task(send_order_email, to_email, name, updated_order, pdf_bytes)

        return updated_order

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to confirm order %s", order_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not confirm the order. Please try again."
        )

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        result = await db["orders"].delete_one({"_id": ObjectId(order_id)})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        return
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to delete order %s", order_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete the order. Please try again."
        )

@router.post("/manual", response_model=ManualOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_order(
    order_in: ManualOrderCreate,
    background_tasks: BackgroundTasks,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    """Admin endpoint to create manual/DM orders (WhatsApp, Instagram, custom)."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        order_dict = order_in.model_dump()
        order_dict["status"] = OrderStatus.PENDING_VALIDATION.value
        order_dict["created_at"] = datetime.now(timezone.utc)
        order_dict["is_manual"] = True
        order_dict["email_sent"] = False

        # Link to existing user if customer_email matches a registered account
        linked_user_id = None
        if order_in.customer_email:
            existing_user = await db["users"].find_one({"email": order_in.customer_email})
            if existing_user:
                linked_user_id = existing_user["_id"]

        order_dict["user_id"] = linked_user_id  # ObjectId or None

        result = await db["orders"].insert_one(order_dict)
        inserted_order = await db["orders"].find_one({"_id": result.inserted_id})

        try:
            order_response = OrderResponse(**inserted_order)
            await manager.send_order_event(
                "order_created",
                order_response.model_dump(by_alias=True),
                inserted_order.get("user_id"),
            )
        except Exception:
            logger.exception("Error sending order_created event")

        # Whether the customer has a registered account is irrelevant to email
        # delivery — a WhatsApp buyer who gave an address should still hear back.
        email_sent = False
        if inserted_order.get("customer_email"):
            try:
                background_tasks.add_task(
                    send_order_email,
                    inserted_order.get("customer_email"),
                    inserted_order.get("customer_name", "Valued Customer"),
                    inserted_order
                )
                email_sent = True
            except Exception:
                logger.exception("Error queueing manual order confirmation email")

        return ManualOrderResponse(order=inserted_order, email_sent=email_sent)

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to create manual order")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the manual order. Please try again."
        )

@router.get("/{order_id}/invoice")
async def download_invoice(
    order_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Generate and stream the PDF invoice on-the-fly for a confirmed order.
    Accessible by the order owner or any admin.
    """
    from fastapi import Response
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        # Fetch the order document
        order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # Access check: user must be the order owner OR an admin
        is_owner = str(order.get("user_id")) == str(current_user.id)
        is_admin = getattr(current_user, "is_admin", False)
        
        if not (is_owner or is_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Status check: order must be Confirmed
        if order.get("status") != OrderStatus.CONFIRMED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoices can only be downloaded for Confirmed orders."
            )

        # Generate PDF bytes in memory
        from app.utils.pdf_generator import generate_invoice_pdf
        pdf_bytes = await generate_invoice_pdf(order)

        # Return response
        headers = {
            "Content-Disposition": f'attachment; filename="Invoice_CrochetCreation_{order_id}.pdf"'
        }
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers=headers
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to generate invoice for order %s", order_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate the invoice. Please try again."
        )
