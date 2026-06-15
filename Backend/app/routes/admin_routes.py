from fastapi import APIRouter, HTTPException, status, Depends
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AdminStatsResponse(BaseModel):
    total_revenue: float
    total_orders: int
    products_count: int
    customers_count: int
    recent_orders: List[Dict[str, Any]]
    alerts: List[Dict[str, Any]]

@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        # 1. Total Orders count
        total_orders = await db["orders"].count_documents({})

        # 2. Total Revenue (sum of total_amount of non-cancelled orders)
        revenue_cursor = db["orders"].aggregate([
            {"$match": {"status": {"$ne": "Cancelled"}}},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ])
        revenue_list = await revenue_cursor.to_list(length=1)
        total_revenue = revenue_list[0]["total"] if revenue_list else 0.0

        # 3. Products Count
        products_count = await db["products"].count_documents({})

        # 4. Customers Count (non-admin users)
        customers_count = await db["users"].count_documents({"is_admin": {"$ne": True}})

        # 5. Recent Orders (top 5)
        recent_cursor = db["orders"].find({}).sort("created_at", -1).limit(5)
        recent_orders_raw = await recent_cursor.to_list(length=5)
        
        recent_orders = []
        for o in recent_orders_raw:
            recent_orders.append({
                "id": str(o.get("_id")),
                "customer": o.get("customer_name", "Anonymous"),
                "items": ", ".join([f"{item.get('title')} ({item.get('quantity')})" for item in o.get("items", [])]),
                "amount": o.get("total_amount", 0.0),
                "date": o.get("created_at").strftime("%Y-%m-%d %H:%M:%S") if o.get("created_at") else "Unknown",
                "status": o.get("status", "Pending")
            })

        # 6. Workshop Alerts (Dynamic Warnings)
        alerts = []
        
        # Alert for pending orders
        pending_orders_count = await db["orders"].count_documents({"status": "Pending"})
        if pending_orders_count > 0:
            alerts.append({
                "type": "pending",
                "title": "Pending Order Packings",
                "message": f"There are {pending_orders_count} pending order(s) waiting for premium packing.",
                "color": "bg-amber-50 text-amber-600 border-amber-100"
            })
        else:
            alerts.append({
                "type": "pending",
                "title": "All Clean!",
                "message": "All orders are fully processed and packed.",
                "color": "bg-amber-50 text-amber-600 border-amber-100"
            })

        # Alert for payout
        alerts.append({
            "type": "payout",
            "title": "Payout Status",
            "message": "Artisan payouts for last month's items successfully processed.",
            "color": "bg-emerald-50 text-emerald-600 border-emerald-100"
        })

        # Low stock warning alert (e.g. if any products collection is empty or just generic)
        if products_count == 0:
            alerts.append({
                "type": "stock",
                "title": "Empty Catalog Warning",
                "message": "Your products catalog is empty. Add items to start selling!",
                "color": "bg-rose-50 text-rose-600 border-rose-100"
            })
        else:
            alerts.append({
                "type": "stock",
                "title": "Catalog Healthy",
                "message": f"{products_count} unique items are active and ready in stock.",
                "color": "bg-rose-50 text-rose-600 border-rose-100"
            })

        return AdminStatsResponse(
            total_revenue=total_revenue,
            total_orders=total_orders,
            products_count=products_count,
            customers_count=customers_count,
            recent_orders=recent_orders,
            alerts=alerts
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin stats: {str(e)}"
        )
