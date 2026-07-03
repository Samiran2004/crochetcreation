from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from typing import List, Optional
from app.models.order import OrderCreate, OrderResponse, ManualOrderCreate, ManualOrderResponse
from app.core.db import get_database
from app.api.deps import get_current_admin_user, get_current_user
from app.models.user import UserInDB
from bson import ObjectId
from datetime import datetime
from app.services.email_service import queue_order_confirmation, queue_order_status_update, queue_manual_order_emails
from app.utils.email_sender import send_order_email

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
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
        order_dict["status"] = "Pending"
        order_dict["created_at"] = datetime.utcnow()
        # Explicitly attach the user_id as a BSON ObjectId
        order_dict["user_id"] = ObjectId(current_user.id) if current_user.id else None

        result = await db["orders"].insert_one(order_dict)

        # Retrieve and return the created order
        inserted_order = await db["orders"].find_one({"_id": result.inserted_id})
        
        # Trigger Brevo HTTP REST API email in background
        if inserted_order:
            to_email = inserted_order.get("customer_email")
            name = inserted_order.get("customer_name")
            order_data = inserted_order
            background_tasks.add_task(send_order_email, to_email, name, order_data)
        
        # Send order confirmation emails via Resend
        try:
            queue_order_confirmation(background_tasks, inserted_order)
        except Exception as email_err:
            print(f"Error queueing order confirmation email: {email_err}")

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

@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: str,  # "Pending", "Processing", "Delivered", "Cancelled"
    background_tasks: BackgroundTasks,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    
    if status_update not in ["Pending", "Processing", "Delivered", "Cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order status."
        )
        
    try:
        existing_order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        if not existing_order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        await db["orders"].update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status_update}}
        )

        updated_order = await db["orders"].find_one({"_id": ObjectId(order_id)})
        
        # Send order status update email
        try:
            queue_order_status_update(background_tasks, updated_order)
        except Exception as email_err:
            print(f"Error queueing order status update email: {email_err}")

        return updated_order

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}"
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
        order_dict["status"] = "Pending"
        order_dict["created_at"] = datetime.utcnow()
        order_dict["is_manual"] = True

        # Link to existing user if customer_email matches a registered account
        linked_user_id = None
        if order_in.customer_email:
            existing_user = await db["users"].find_one({"email": order_in.customer_email})
            if existing_user:
                linked_user_id = existing_user["_id"]

        order_dict["user_id"] = linked_user_id  # ObjectId or None

        result = await db["orders"].insert_one(order_dict)
        inserted_order = await db["orders"].find_one({"_id": result.inserted_id})

        # Queue emails in background (non-blocking)
        email_sent = False
        try:
            email_sent = queue_manual_order_emails(background_tasks, inserted_order)
        except Exception as email_err:
            print(f"Error queueing manual order emails: {email_err}")

        return ManualOrderResponse(order=inserted_order, email_sent=email_sent)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create manual order: {str(e)}"
        )
