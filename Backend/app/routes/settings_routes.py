from fastapi import APIRouter, HTTPException, status, Depends
from app.models.settings import SettingsModel
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB

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
