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

async def upload_image_and_get_details(file: UploadFile, folder: str = "crochetcreation") -> dict:
    """
    Reads upload file stream and uploads it to Cloudinary.
    Returns a dict with 'url' and 'public_id'.
    """
    content = await file.read()
    result = cloudinary.uploader.upload(
        content,
        folder=folder,
        resource_type="auto"
    )
    await file.seek(0)
    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id")
    }

async def delete_image_from_cloudinary(public_id: str):
    """
    Deletes an image from Cloudinary using its public_id.
    """
    try:
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"Failed to delete Cloudinary image {public_id}: {e}")

async def delete_image_by_url(url: str):
    """
    Parses the public_id from the Cloudinary URL and deletes it.
    """
    if not url:
        return
    try:
        if "/image/upload/" not in url:
            return
        parts = url.split("/image/upload/")
        subparts = parts[1].split("/")
        if subparts[0].startswith("v") and subparts[0][1:].isdigit():
            path_without_version = "/".join(subparts[1:])
        else:
            path_without_version = "/".join(subparts)
        
        if "." in path_without_version:
            public_id = ".".join(path_without_version.split(".")[:-1])
        else:
            public_id = path_without_version
            
        cloudinary.uploader.destroy(public_id)
    except Exception as e:
        print(f"Failed to delete Cloudinary image from URL {url}: {e}")

