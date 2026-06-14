import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.core.config import settings

# Configure Cloudinary credentials
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "crochetcreation") -> str:
    """
    Reads upload file stream and uploads it to Cloudinary under the specified folder.
    Returns the secure HTTPS URL.
    """
    # Read binary content from the FastAPI UploadFile stream
    content = await file.read()
    
    # Upload to Cloudinary
    result = cloudinary.uploader.upload(
        content,
        folder=folder,
        resource_type="auto"
    )
    
    # Reset file cursor position in case the stream is reused
    await file.seek(0)
    
    return result.get("secure_url")
