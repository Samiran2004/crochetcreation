from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/customers", tags=["customers"])

class CustomerStatsResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    mobile: str
    orders_count: int
    total_spent: float
    status: str = "Active"  # fallback

@router.get("/", response_model=List[CustomerStatsResponse])
async def get_customers(
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        # Fetch non-admin users
        cursor = db["users"].find({"is_admin": {"$ne": True}})
        users = await cursor.to_list(length=500)
        
        customers_list = []
        for user in users:
            email = user.get("email")
            
            # Aggregate order stats for this user by email
            # We count all orders placed by this customer email
            user_orders_cursor = db["orders"].find({"customer_email": email})
            user_orders = await user_orders_cursor.to_list(length=1000)
            
            orders_count = len(user_orders)
            # Only sum non-cancelled orders towards total spent
            total_spent = sum(order.get("total_amount", 0.0) for order in user_orders if order.get("status") != "Cancelled")
            
            customers_list.append(
                CustomerStatsResponse(
                    id=str(user.get("_id")),
                    first_name=user.get("first_name", ""),
                    last_name=user.get("last_name", ""),
                    email=email,
                    mobile=user.get("mobile", ""),
                    orders_count=orders_count,
                    total_spent=total_spent
                )
            )
            
        return customers_list

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch customers: {str(e)}"
        )
