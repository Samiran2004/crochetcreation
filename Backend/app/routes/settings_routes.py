from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.models.settings import SettingsModel
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB
from app.services.cloudinary_upload import upload_image_and_get_details, delete_image_from_cloudinary

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/", response_model=SettingsModel)
async def get_settings():
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        # We store settings in a document with a fixed ID or find the first one
        settings_doc = await db["settings"].find_one({})
        if not settings_doc:
            # Initialize with default settings if none exists
            default_settings = SettingsModel()
            settings_dict = default_settings.model_dump()
            await db["settings"].insert_one(settings_dict)
            return default_settings
        
        return SettingsModel(**settings_doc)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch settings: {str(e)}"
        )

@router.put("/", response_model=SettingsModel)
async def update_settings(
    settings_in: SettingsModel,
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        settings_dict = settings_in.model_dump()
        
        # Upsert settings (update the first found document or create it)
        result = await db["settings"].find_one_and_update(
            {},
            {"$set": settings_dict},
            upsert=True,
            return_document=True
        )
        return SettingsModel(**result)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )

VALID_SECTIONS = {"heroYarn", "craftingTools", "stackedSweaters", "womanKnitting", "knitTexture", "customerAlice", "logo"}

@router.get("/homepage-images")
async def get_homepage_images():
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
    try:
        doc = await db["homepage_images"].find_one({"_id": "homepage_images"})
        if not doc:
            return {s: None for s in VALID_SECTIONS}
        
        result = {}
        for s in VALID_SECTIONS:
            result[s] = doc.get("images", {}).get(s, None)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch homepage images: {str(e)}"
        )

@router.post("/homepage-images/upload")
async def upload_homepage_image(
    section: str = Form(...),
    file: UploadFile = File(...),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    if section not in VALID_SECTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid section name. Must be one of: {', '.join(VALID_SECTIONS)}"
        )
        
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
        
    try:
        doc = await db["homepage_images"].find_one({"_id": "homepage_images"})
        old_image = None
        if doc and "images" in doc and section in doc["images"]:
            old_image = doc["images"][section]
            
        details = await upload_image_and_get_details(file, folder="crochetcreation/homepage")
        
        if old_image and isinstance(old_image, dict) and old_image.get("public_id"):
            await delete_image_from_cloudinary(old_image["public_id"])
            
        update_query = {
            f"images.{section}": {
                "url": details["url"],
                "public_id": details["public_id"]
            }
        }
        
        await db["homepage_images"].update_one(
            {"_id": "homepage_images"},
            {"$set": update_query},
            upsert=True
        )
        
        updated_doc = await db["homepage_images"].find_one({"_id": "homepage_images"})
        result = {}
        for s in VALID_SECTIONS:
            result[s] = updated_doc.get("images", {}).get(s, None) if updated_doc else None
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload homepage image: {str(e)}"
        )

@router.post("/homepage-images/reset")
async def reset_homepage_image(
    section: str = Form(...),
    current_admin: UserInDB = Depends(get_current_admin_user)
):
    if section not in VALID_SECTIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid section name. Must be one of: {', '.join(VALID_SECTIONS)}"
        )
        
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )
        
    try:
        doc = await db["homepage_images"].find_one({"_id": "homepage_images"})
        if not doc or "images" not in doc or section not in doc["images"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No customized image set for section: {section}"
            )
            
        old_image = doc["images"][section]
        
        if old_image and isinstance(old_image, dict) and old_image.get("public_id"):
            await delete_image_from_cloudinary(old_image["public_id"])
            
        await db["homepage_images"].update_one(
            {"_id": "homepage_images"},
            {"$unset": {f"images.{section}": ""}}
        )
        
        updated_doc = await db["homepage_images"].find_one({"_id": "homepage_images"})
        result = {}
        for s in VALID_SECTIONS:
            result[s] = updated_doc.get("images", {}).get(s, None) if updated_doc else None
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset homepage image: {str(e)}"
        )
