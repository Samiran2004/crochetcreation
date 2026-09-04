from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
from typing import Annotated, List, Optional
from datetime import datetime, timezone
import re
from bson import ObjectId

from app.core.db import get_database
from app.api.deps import get_current_user, get_current_admin_user
from app.models.user import UserInDB

router = APIRouter(prefix="/api/videos", tags=["videos"])

PyObjectId = Annotated[str, BeforeValidator(str)]

class VideoCreate(BaseModel):
    youtube_url: str
    title: str
    video_type: str = Field(..., description='"long" or "shorts"')

class VideoResponse(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    youtube_url: str
    title: str
    video_type: str
    video_id: str
    thumbnail_url: str
    created_at: datetime
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

def extract_video_id(url: str) -> str:
    pattern = r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})"
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    raise ValueError("Invalid YouTube URL")

@router.get("/", response_model=List[VideoResponse])
async def get_videos(video_type: Optional[str] = Query(None, description='"long" or "shorts"')):
    db = get_database()
    query = {}
    if video_type in ["long", "shorts"]:
        query["video_type"] = video_type
        
    videos_cursor = db["videos"].find(query).sort("created_at", -1)
    videos = await videos_cursor.to_list(length=100)
    return videos

@router.post("/", response_model=VideoResponse)
async def create_video(video: VideoCreate, current_user: UserInDB = Depends(get_current_admin_user)):
    if video.video_type not in ["long", "shorts"]:
        raise HTTPException(status_code=400, detail="video_type must be 'long' or 'shorts'")
        
    try:
        video_id = extract_video_id(video.youtube_url)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
    if video.video_type == "long":
        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    else:
        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        
    new_video = {
        "youtube_url": video.youtube_url,
        "title": video.title,
        "video_type": video.video_type,
        "video_id": video_id,
        "thumbnail_url": thumbnail_url,
        "created_at": datetime.now(timezone.utc)
    }
    
    db = get_database()
    result = await db["videos"].insert_one(new_video)
    
    created_video = await db["videos"].find_one({"_id": result.inserted_id})
    return created_video

@router.delete("/{video_id}")
async def delete_video(video_id: str, current_user: UserInDB = Depends(get_current_admin_user)):
    db = get_database()
    try:
        obj_id = ObjectId(video_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid video ID format")
        
    result = await db["videos"].delete_one({"_id": obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
        
    return {"message": "Video deleted successfully"}
