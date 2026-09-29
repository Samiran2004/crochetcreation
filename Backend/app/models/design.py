from pydantic import BaseModel, Field, BeforeValidator, field_validator
from typing import Annotated, Optional, List, Dict, Any
from datetime import datetime, timezone

PyObjectId = Annotated[str, BeforeValidator(str)]

# A design is one editable artboard. `canvas_json` is the fabric.js
# serialization; everything else is metadata the gallery can list without
# pulling the (potentially large) scene graph over the wire.

MAX_CANVAS_SIDE = 8000
MIN_CANVAS_SIDE = 16


class DesignCreate(BaseModel):
    name: str = Field(default="Untitled design", max_length=140)
    width: int = Field(default=1080, ge=MIN_CANVAS_SIDE, le=MAX_CANVAS_SIDE)
    height: int = Field(default=1080, ge=MIN_CANVAS_SIDE, le=MAX_CANVAS_SIDE)
    preset_key: Optional[str] = Field(default=None, max_length=64)
    canvas_json: Optional[Dict[str, Any]] = None
    thumbnail_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = (v or "").strip()
        return v or "Untitled design"


class DesignUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=140)
    width: Optional[int] = Field(default=None, ge=MIN_CANVAS_SIDE, le=MAX_CANVAS_SIDE)
    height: Optional[int] = Field(default=None, ge=MIN_CANVAS_SIDE, le=MAX_CANVAS_SIDE)
    preset_key: Optional[str] = Field(default=None, max_length=64)
    canvas_json: Optional[Dict[str, Any]] = None
    # Base64 data URL of the freshly rendered artboard. Uploaded to Cloudinary
    # by the route so the gallery never has to rasterize anything itself.
    thumbnail_data_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or "Untitled design"


class DesignSummary(BaseModel):
    """What the gallery grid needs — deliberately without `canvas_json`."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    width: int
    height: int
    preset_key: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class DesignResponse(DesignSummary):
    canvas_json: Optional[Dict[str, Any]] = None


class PaginatedDesignsResponse(BaseModel):
    items: List[DesignSummary]
    total: int


class DesignAssetResponse(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    url: str
    public_id: str
    width: Optional[int] = None
    height: Optional[int] = None
    filename: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class RenderUploadRequest(BaseModel):
    """Push a rendered artboard into the Cloudinary media library."""
    data_url: str = Field(..., description="data:image/png;base64,... payload")
    filename: Optional[str] = Field(default=None, max_length=140)


class UrlImportRequest(BaseModel):
    """Pull an icon or image in from another site (Icons8, Flaticon, a CDN…)."""
    url: str = Field(..., max_length=2048)
    filename: Optional[str] = Field(default=None, max_length=140)


class UrlImportResponse(BaseModel):
    """
    SVG comes back as markup so the editor can turn it into real, recolourable
    vector objects; a raster arrives as an ordinary media-library asset.
    """
    kind: str  # "svg" | "image"
    svg: Optional[str] = None
    asset: Optional[DesignAssetResponse] = None
