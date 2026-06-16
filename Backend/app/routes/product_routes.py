from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from typing import List
from app.models.product import ProductModel
from app.services.cloudinary_upload import upload_image_to_cloudinary, delete_image_by_url
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB
from bson import ObjectId

router = APIRouter(prefix="/api/products", tags=["products"])

@router.post("/", response_model=ProductModel, status_code=status.HTTP_201_CREATED)
async def create_product(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    current_admin: UserInDB = Depends(get_current_admin_user)
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
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
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

@router.get("/{product_id}", response_model=ProductModel)
async def get_product(product_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        # Check if ObjectId format is valid, otherwise use raw string ID
        query = {}
        try:
            query = {"_id": ObjectId(product_id)}
        except Exception:
            query = {"_id": product_id}
            
        product = await db["products"].find_one(query)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch product: {str(e)}"
        )

@router.put("/{product_id}", response_model=ProductModel)
async def update_product(
    product_id: str,
    title: str = Form(None),
    description: str = Form(None),
    price: float = Form(None),
    category: str = Form(None),
    image: UploadFile = File(None),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
        
    try:
        # Check if product exists
        existing_product = await db["products"].find_one({"_id": ObjectId(product_id)})
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
            
        update_data = {}
        if title is not None:
            update_data["title"] = title
        if description is not None:
            update_data["description"] = description
        if price is not None:
            update_data["price"] = price
        if category is not None:
            update_data["category"] = category
        if image is not None:
            # Delete old image from Cloudinary if it exists
            old_image_url = existing_product.get("image_url")
            if old_image_url:
                await delete_image_by_url(old_image_url)
            image_url = await upload_image_to_cloudinary(image)
            update_data["image_url"] = image_url
            
        if update_data:
            await db["products"].update_one({"_id": ObjectId(product_id)}, {"$set": update_data})
            
        updated_product = await db["products"].find_one({"_id": ObjectId(product_id)})
        return updated_product
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update product: {str(e)}"
        )

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
        
    try:
        # Check if product exists first
        existing_product = await db["products"].find_one({"_id": ObjectId(product_id)})
        if not existing_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
            
        # Delete from Cloudinary if image_url exists
        image_url = existing_product.get("image_url")
        if image_url:
            await delete_image_by_url(image_url)
            
        # Delete from DB
        await db["products"].delete_one({"_id": ObjectId(product_id)})
        return
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )
