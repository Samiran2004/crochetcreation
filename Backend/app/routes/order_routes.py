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

router = APIRouter(prefix="/api/orders", tags=["orders"])

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
        # Save order document to MongoDB
        order_dict = order_in.model_dump()
        order_dict["status"] = OrderStatus.PENDING_VALIDATION.value
        order_dict["created_at"] = datetime.now(timezone.utc)
        order_dict["email_sent"] = False
        # Explicitly attach the user_id as a BSON ObjectId if logged in
        order_dict["user_id"] = ObjectId(current_user.id) if (current_user and current_user.id) else None

        result = await db["orders"].insert_one(order_dict)

        # Retrieve and return the created order
        inserted_order = await db["orders"].find_one({"_id": result.inserted_id})
        
        # Broadcast to all websocket connections
        try:
            order_response = OrderResponse(**inserted_order)
            await manager.broadcast({
                "action": "order_created",
                "data": order_response.model_dump(by_alias=True)
            })
        except Exception as ws_err:
            print(f"Error broadcasting order_created: {ws_err}")

        # Do NOT trigger the Brevo email here. It is triggered only upon confirmation/validation.
        return inserted_order

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to place order: {str(e)}"
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch my orders: {str(e)}"
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

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
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

        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status_update.status.value}}
        )

        updated_order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        
        # Broadcast to all websocket connections
        try:
            order_response = OrderResponse(**updated_order)
            await manager.broadcast({
                "action": "order_updated",
                "data": order_response.model_dump(by_alias=True)
            })
        except Exception as ws_err:
            print(f"Error broadcasting order_updated: {ws_err}")

        # If payment is verified & confirmed (order status changed to Processing), send Brevo confirmation with invoice
        if status_update.status.value == OrderStatus.PROCESSING.value:
            to_email = updated_order.get("customer_email")
            name = updated_order.get("customer_name")
            if to_email:
                background_tasks.add_task(generate_and_send_invoice_task, to_email, name, updated_order)

        return updated_order

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}"
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

        # Step 1: Await the PDF byte generation BEFORE triggering the Brevo background task.
        from app.utils.pdf_generator import generate_invoice_pdf
        pdf_bytes = await generate_invoice_pdf(existing_order)

        # Step 2: Update the MongoDB document to set status: "Confirmed".
        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {
                "status": OrderStatus.CONFIRMED.value
            }}
        )

        updated_order = await db["orders"].find_one({"_id": ObjectId(order_id)})

        # Broadcast to all websocket connections
        try:
            order_response = OrderResponse(**updated_order)
            await manager.broadcast({
                "action": "order_updated",
                "data": order_response.model_dump(by_alias=True)
            })
        except Exception as ws_err:
            print(f"Error broadcasting order_updated: {ws_err}")

        # Step 3: Add the Brevo email dispatch to BackgroundTasks, passing the generated bytes.
        to_email = updated_order.get("customer_email")
        name = updated_order.get("customer_name")
        if to_email:
            background_tasks.add_task(send_order_email, to_email, name, updated_order, pdf_bytes)

        return updated_order

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm order: {str(e)}"
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete order: {str(e)}"
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

        # Broadcast to all websocket connections
        try:
            order_response = OrderResponse(**inserted_order)
            await manager.broadcast({
                "action": "order_created",
                "data": order_response.model_dump(by_alias=True)
            })
        except Exception as ws_err:
            print(f"Error broadcasting order_created: {ws_err}")

        # Queue emails in background (non-blocking) via Brevo REST API
        email_sent = False
        if inserted_order.get("customer_email") and inserted_order.get("user_id"):
            try:
                background_tasks.add_task(
                    send_order_email, 
                    inserted_order.get("customer_email"), 
                    inserted_order.get("customer_name", "Valued Customer"), 
                    inserted_order
                )
                email_sent = True
            except Exception as email_err:
                print(f"Error queueing manual order confirmation email: {email_err}")

        return ManualOrderResponse(order=inserted_order, email_sent=email_sent)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create manual order: {str(e)}"
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate invoice: {str(e)}"
        )
