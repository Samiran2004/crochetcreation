from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from typing import List, Optional
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
    originalPrice: Optional[float] = Form(None),
    sellingPrice: Optional[float] = Form(None),
    size: str = Form(""),
    materials: str = Form(""),
    care_instructions: str = Form(""),
    in_stock: bool = Form(True),
    delivery_time: Optional[str] = Form("5-7 working days"),
    image: UploadFile = File(None),
    images: List[UploadFile] = File(None),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    try:
        uploaded_urls = []
        width = None
        height = None
        if images:
            for img in images:
                if img.filename:
                    upload_res = await upload_image_to_cloudinary(img)
                    uploaded_urls.append(upload_res["url"])
                    if not width:
                        width = upload_res["width"]
                        height = upload_res["height"]
        
        if not uploaded_urls and image and image.filename:
            upload_res = await upload_image_to_cloudinary(image)
            uploaded_urls.append(upload_res["url"])
            width = upload_res["width"]
            height = upload_res["height"]
            
        if not uploaded_urls:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one product image is required."
            )
            
        image_url = uploaded_urls[0]
        
        # Ensure sellingPrice defaults to originalPrice if not provided
        orig_price = originalPrice if originalPrice is not None else price
        sell_price = sellingPrice if sellingPrice is not None else orig_price

        # Prepare product data for insertion
        product_data = {
            "title": title,
            "description": description,
            "price": sell_price,
            "originalPrice": orig_price,
            "sellingPrice": sell_price,
            "category": category,
            "image_url": image_url,
            "image_urls": uploaded_urls,
            "size": size,
            "materials": materials,
            "care_instructions": care_instructions,
            "in_stock": in_stock,
            "delivery_time": delivery_time,
            "width": width,
            "height": height
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
    originalPrice: Optional[float] = Form(None),
    sellingPrice: Optional[float] = Form(None),
    size: str = Form(None),
    materials: str = Form(None),
    care_instructions: str = Form(None),
    in_stock: bool = Form(None),
    delivery_time: Optional[str] = Form(None),
    image: UploadFile = File(None),
    images: List[UploadFile] = File(None),
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
        if originalPrice is not None:
            update_data["originalPrice"] = originalPrice
        if sellingPrice is not None:
            update_data["sellingPrice"] = sellingPrice
            
        # Ensure sellingPrice defaults to originalPrice if not provided and sync with price
        final_original = originalPrice if originalPrice is not None else existing_product.get("originalPrice")
        final_selling = sellingPrice if sellingPrice is not None else existing_product.get("sellingPrice")
        
        if final_original is not None and final_selling is None:
            final_selling = final_original
            update_data["sellingPrice"] = final_selling
        elif final_selling is not None and final_original is None:
            final_original = final_selling
            update_data["originalPrice"] = final_original
            
        if final_selling is not None:
            update_data["price"] = final_selling
        elif price is not None:
            update_data["price"] = price

        if category is not None:
            update_data["category"] = category
        if size is not None:
            update_data["size"] = size
        if materials is not None:
            update_data["materials"] = materials
        if care_instructions is not None:
            update_data["care_instructions"] = care_instructions
        if in_stock is not None:
            update_data["in_stock"] = in_stock
        if delivery_time is not None:
            update_data["delivery_time"] = delivery_time
            
        uploaded_urls = []
        width = None
        height = None
        if images:
            for img in images:
                if img.filename:
                    upload_res = await upload_image_to_cloudinary(img)
                    uploaded_urls.append(upload_res["url"])
                    if not width:
                        width = upload_res["width"]
                        height = upload_res["height"]
                    
        if not uploaded_urls and image and image.filename:
            upload_res = await upload_image_to_cloudinary(image)
            uploaded_urls.append(upload_res["url"])
            width = upload_res["width"]
            height = upload_res["height"]
            
        if uploaded_urls:
            # Delete old images from Cloudinary if they exist
            old_image_urls = existing_product.get("image_urls") or []
            old_image_url = existing_product.get("image_url")
            all_old_urls = set(old_image_urls)
            if old_image_url:
                all_old_urls.add(old_image_url)
                
            for old_url in all_old_urls:
                await delete_image_by_url(old_url)
                
            update_data["image_url"] = uploaded_urls[0]
            update_data["image_urls"] = uploaded_urls
            update_data["width"] = width
            update_data["height"] = height
            
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
            
        # Delete from Cloudinary if image_url or image_urls exist
        old_image_urls = existing_product.get("image_urls") or []
        old_image_url = existing_product.get("image_url")
        all_old_urls = set(old_image_urls)
        if old_image_url:
            all_old_urls.add(old_image_url)
            
        for old_url in all_old_urls:
            await delete_image_by_url(old_url)
            
        # Delete from DB
        await db["products"].delete_one({"_id": ObjectId(product_id)})
        return
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )
