from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import List
from app.models.product import ProductModel
from app.services.cloudinary_upload import upload_image_to_cloudinary
from app.core.db import get_database

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("/", response_model=ProductModel, status_code=status.HTTP_201_CREATED)
async def create_product(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        # Upload image to Cloudinary
        image_url = await upload_image_to_cloudinary(image)
        
        # Prepare product data for insertion
        product_data = {
            "title": title,
            "description": description,
            "price": price,
            "category": category,
            "image_url": image_url
        }
        
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection is not initialized."
            )
            
        # Insert document into the MongoDB collection
        result = await db["products"].insert_one(product_data)
        
        # Retrieve the newly created product using the inserted ID
        inserted_product = await db["products"].find_one({"_id": result.inserted_id})
        return inserted_product
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create product: {str(e)}"
        )

@router.get("/", response_model=List[ProductModel])
async def get_products():
    try:
        db = get_database()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_530_SERVICE_UNAVAILABLE,
                detail="Database connection is not initialized."
            )
            
        cursor = db["products"].find()
        products = await cursor.to_list(length=100)
        return products
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch products: {str(e)}"
        )
