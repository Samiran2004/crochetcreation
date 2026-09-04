import logging
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger("app.customers")

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

        # Roll up every customer's order stats in one aggregation rather than
        # one query per customer, which was O(customers) round trips.
        stats_by_email = {}
        try:
            agg_cursor = db["orders"].aggregate([
                {"$match": {"customer_email": {"$ne": None}}},
                {"$group": {
                    "_id": "$customer_email",
                    "orders_count": {"$sum": 1},
                    "total_spent": {
                        "$sum": {
                            "$cond": [
                                {"$ne": ["$status", "Cancelled"]},
                                {"$ifNull": ["$total_amount", 0.0]},
                                0.0
                            ]
                        }
                    }
                }}
            ])
            for row in await agg_cursor.to_list(length=5000):
                stats_by_email[row["_id"]] = row
        except Exception:
            # The in-memory fallback DB has no aggregate(); customers still
            # list, just with zeroed totals.
            logger.warning("Order aggregation unavailable; returning zeroed customer stats")

        customers_list = []
        for user in users:
            email = user.get("email")
            stats = stats_by_email.get(email, {})

            customers_list.append(
                CustomerStatsResponse(
                    id=str(user.get("_id")),
                    first_name=user.get("first_name", ""),
                    last_name=user.get("last_name", ""),
                    email=email,
                    mobile=user.get("mobile", ""),
                    orders_count=stats.get("orders_count", 0),
                    total_spent=float(stats.get("total_spent", 0.0))
                )
            )

        return customers_list

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to fetch customers")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load customers. Please try again."
        )
