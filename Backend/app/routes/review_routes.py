from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated

from app.core.db import get_database
from app.api.deps import get_current_user
from app.models.user import UserInDB
from app.models.order import OrderStatus
from app.utils.email_sender import send_review_thank_you_email

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

PyObjectId = Annotated[str, BeforeValidator(str)]

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=2, max_length=1000)

class ReviewResponse(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    user_name: str
    product_id: str
    rating: int
    comment: str
    created_at: datetime

    class Config:
        populate_by_name = True

class ProductReviewsSummary(BaseModel):
    reviews: List[ReviewResponse]
    average_rating: float
    total_reviews: int

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    background_tasks: BackgroundTasks,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    
    product_id = review_in.product_id
    user_id = str(current_user.id)
    
    # 1. Verify if product exists
    try:
        product = await db["products"].find_one({"_id": ObjectId(product_id)})
    except Exception:
        product = await db["products"].find_one({"_id": product_id})
        
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )
        
    # 2. Check if user has purchased the product and it is delivered
    try:
        user_obj_id = ObjectId(current_user.id)
    except Exception:
        user_obj_id = current_user.id

    order_query = {
        "$or": [
            {"user_id": user_obj_id},
            {"user_id": str(current_user.id)}
        ],
        "status": OrderStatus.DELIVERED.value,
        "items.product_id": product_id
    }
    
    order = await db["orders"].find_one(order_query)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review products you have purchased and that have been delivered."
        )
        
    # 3. Check if user already reviewed this product
    existing_review = await db["reviews"].find_one({
        "user_id": user_id,
        "product_id": product_id
    })
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product."
        )
        
    # 4. Create the review
    review_dict = {
        "user_id": user_id,
        "user_name": f"{current_user.first_name} {current_user.last_name}",
        "product_id": product_id,
        "rating": review_in.rating,
        "comment": review_in.comment,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db["reviews"].insert_one(review_dict)
    
    # Fetch inserted review to return
    inserted_review = await db["reviews"].find_one({"_id": result.inserted_id})
    
    # 5. Trigger Background Task for email
    product_title = product.get("title", "your handmade item")
    background_tasks.add_task(
        send_review_thank_you_email,
        current_user.email,
        current_user.first_name,
        product_title
    )
    
    return inserted_review

@router.get("/product/{product_id}", response_model=ProductReviewsSummary)
async def get_product_reviews(product_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
        
    # Fetch all reviews for specific product sorted by newest first
    cursor = db["reviews"].find({"product_id": product_id}).sort("created_at", -1)
    reviews = await cursor.to_list(length=500)
    
    # Calculate average rating and total reviews
    total_reviews = len(reviews)
    average_rating = 0.0
    if total_reviews > 0:
        average_rating = sum(r["rating"] for r in reviews) / total_reviews
        
    return {
        "reviews": reviews,
        "average_rating": round(average_rating, 2),
        "total_reviews": total_reviews
    }

@router.get("/product/{product_id}/eligible", response_model=dict)
async def check_review_eligibility(
    product_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
        
    user_id = str(current_user.id)
    
    # Check if user already reviewed
    existing_review = await db["reviews"].find_one({
        "user_id": user_id,
        "product_id": product_id
    })
    
    if existing_review:
        return {"eligible": False, "reason": "already_reviewed"}
        
    # Check if user purchased and it is delivered
    try:
        user_obj_id = ObjectId(current_user.id)
    except Exception:
        user_obj_id = current_user.id

    order_query = {
        "$or": [
            {"user_id": user_obj_id},
            {"user_id": str(current_user.id)}
        ],
        "status": OrderStatus.DELIVERED.value,
        "items.product_id": product_id
    }
    
    order = await db["orders"].find_one(order_query)
    if not order:
        return {"eligible": False, "reason": "not_purchased_or_delivered"}
        
    return {"eligible": True, "reason": "eligible"}
