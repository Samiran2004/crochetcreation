import base64
import binascii
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_current_admin_user
from app.core.db import get_database
from app.models.design import (
    DesignAssetResponse,
    DesignCreate,
    DesignResponse,
    DesignSummary,
    DesignUpdate,
    PaginatedDesignsResponse,
    RenderUploadRequest,
)
from app.models.user import UserInDB
from app.services.cloudinary_upload import (
    delete_image_from_cloudinary,
    upload_bytes_to_cloudinary,
    upload_image_and_get_details,
)

logger = logging.getLogger("app.designs")

router = APIRouter(prefix="/api/admin/designs", tags=["designs"])

DESIGNS = "designs"
ASSETS = "design_assets"

# A fabric scene is JSON, so it is cheap until someone drops a base64 image
# into it. Images belong in Cloudinary; this ceiling keeps a runaway document
# from hitting MongoDB's own 16MB limit and failing the save opaquely.
MAX_CANVAS_JSON_BYTES = 4 * 1024 * 1024
MAX_RENDER_BYTES = 12 * 1024 * 1024
MAX_ASSET_BYTES = 12 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
}

_DATA_URL_RE = re.compile(r"^data:image/(png|jpeg|jpg|webp);base64,(.+)$", re.DOTALL)


def _db():
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized.",
        )
    return db


def _object_id(raw: str) -> ObjectId:
    try:
        return ObjectId(raw)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That design id is not valid.",
        )


def _validate_canvas_json(canvas_json: Optional[Dict[str, Any]]) -> None:
    """
    Reject scenes that are too large, or that carry inline base64 images.

    Inline images are the one thing that reliably blows the document size up,
    and the editor always has a Cloudinary URL available instead, so refusing
    them here keeps every saved design small and cacheable.
    """
    if canvas_json is None:
        return

    try:
        encoded = json.dumps(canvas_json)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The design data could not be serialized.",
        )

    if len(encoded.encode("utf-8")) > MAX_CANVAS_JSON_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="This design is too large to save. Try removing some elements.",
        )

    if '"src": "data:image' in encoded or '"src":"data:image' in encoded:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Images must be uploaded to the media library before saving.",
        )


def _decode_data_url(data_url: str, limit: int) -> bytes:
    match = _DATA_URL_RE.match((data_url or "").strip())
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expected a PNG, JPEG or WebP data URL.",
        )
    try:
        payload = base64.b64decode(match.group(2), validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The image data could not be decoded.",
        )
    if len(payload) > limit:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="That image is too large to upload.",
        )
    return payload


def _summary(doc: Dict[str, Any]) -> DesignSummary:
    return DesignSummary(
        _id=str(doc.get("_id")),
        name=doc.get("name", "Untitled design"),
        width=int(doc.get("width", 1080)),
        height=int(doc.get("height", 1080)),
        preset_key=doc.get("preset_key"),
        thumbnail_url=doc.get("thumbnail_url"),
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
        updated_at=doc.get("updated_at") or doc.get("created_at") or datetime.now(timezone.utc),
    )


def _full(doc: Dict[str, Any]) -> DesignResponse:
    return DesignResponse(
        _id=str(doc.get("_id")),
        name=doc.get("name", "Untitled design"),
        width=int(doc.get("width", 1080)),
        height=int(doc.get("height", 1080)),
        preset_key=doc.get("preset_key"),
        thumbnail_url=doc.get("thumbnail_url"),
        canvas_json=doc.get("canvas_json"),
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
        updated_at=doc.get("updated_at") or doc.get("created_at") or datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------- designs


@router.get("", response_model=PaginatedDesignsResponse)
@router.get("/", response_model=PaginatedDesignsResponse, include_in_schema=False)
async def list_designs(
    skip: int = Query(0, ge=0),
    limit: int = Query(60, ge=1, le=200),
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    try:
        total = await db[DESIGNS].count_documents({})
        cursor = db[DESIGNS].find({}).sort([("updated_at", -1)]).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return PaginatedDesignsResponse(items=[_summary(d) for d in docs], total=total)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to list designs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load your designs. Please try again.",
        )


@router.post("", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
@router.post(
    "/",
    response_model=DesignResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
async def create_design(
    payload: DesignCreate,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    _validate_canvas_json(payload.canvas_json)

    now = datetime.now(timezone.utc)
    doc = {
        "name": payload.name,
        "width": payload.width,
        "height": payload.height,
        "preset_key": payload.preset_key,
        "canvas_json": payload.canvas_json,
        "thumbnail_url": payload.thumbnail_url,
        "thumbnail_public_id": None,
        "created_by": str(current_admin.email),
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db[DESIGNS].insert_one(doc)
        doc["_id"] = result.inserted_id
        return _full(doc)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to create design")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the design. Please try again.",
        )


@router.get("/{design_id}", response_model=DesignResponse)
async def get_design(
    design_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(design_id)
    try:
        doc = await db[DESIGNS].find_one({"_id": oid})
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to fetch design %s", design_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not open that design. Please try again.",
        )

    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That design no longer exists.",
        )
    return _full(doc)


@router.put("/{design_id}", response_model=DesignResponse)
async def update_design(
    design_id: str,
    payload: DesignUpdate,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(design_id)
    _validate_canvas_json(payload.canvas_json)

    existing = await db[DESIGNS].find_one({"_id": oid})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That design no longer exists.",
        )

    update: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.name is not None:
        update["name"] = payload.name
    if payload.width is not None:
        update["width"] = payload.width
    if payload.height is not None:
        update["height"] = payload.height
    if payload.preset_key is not None:
        update["preset_key"] = payload.preset_key
    if payload.canvas_json is not None:
        update["canvas_json"] = payload.canvas_json

    # The thumbnail is overwritten in place under a stable public_id so the
    # gallery keeps one Cloudinary asset per design instead of one per save.
    if payload.thumbnail_data_url:
        raw = _decode_data_url(payload.thumbnail_data_url, MAX_RENDER_BYTES)
        try:
            uploaded = await upload_bytes_to_cloudinary(
                raw,
                folder="crochetcreation/designs/thumbnails",
                public_id=f"design_{design_id}",
                overwrite=True,
            )
            update["thumbnail_url"] = uploaded["url"]
            update["thumbnail_public_id"] = uploaded["public_id"]
        except Exception:
            # A failed preview must never cost the admin their actual edits.
            logger.exception("Thumbnail upload failed for design %s", design_id)

    try:
        await db[DESIGNS].update_one({"_id": oid}, {"$set": update})
        doc = await db[DESIGNS].find_one({"_id": oid})
        return _full(doc or {**existing, **update})
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to update design %s", design_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the design. Please try again.",
        )


@router.post("/{design_id}/duplicate", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_design(
    design_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(design_id)

    source = await db[DESIGNS].find_one({"_id": oid})
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That design no longer exists.",
        )

    now = datetime.now(timezone.utc)
    doc = {
        "name": f"{source.get('name', 'Untitled design')} (copy)"[:140],
        "width": source.get("width", 1080),
        "height": source.get("height", 1080),
        "preset_key": source.get("preset_key"),
        "canvas_json": source.get("canvas_json"),
        # The copy shares the original's rendered preview until it is saved,
        # which keeps duplication instant and costs no extra Cloudinary asset.
        "thumbnail_url": source.get("thumbnail_url"),
        "thumbnail_public_id": None,
        "created_by": str(current_admin.email),
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db[DESIGNS].insert_one(doc)
        doc["_id"] = result.inserted_id
        return _full(doc)
    except Exception:
        logger.exception("Failed to duplicate design %s", design_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not duplicate the design. Please try again.",
        )


@router.delete("/{design_id}", status_code=status.HTTP_200_OK)
async def delete_design(
    design_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(design_id)

    doc = await db[DESIGNS].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That design no longer exists.",
        )

    try:
        await db[DESIGNS].delete_one({"_id": oid})
    except Exception:
        logger.exception("Failed to delete design %s", design_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete the design. Please try again.",
        )

    # Only drop the preview this design owns — a duplicate may still point at
    # the original's thumbnail, which has a different public_id.
    thumb_id = doc.get("thumbnail_public_id")
    if thumb_id:
        await delete_image_from_cloudinary(thumb_id)

    return {"detail": "Design deleted.", "id": design_id}


# ----------------------------------------------------------- media library


@router.get("/assets/library", response_model=List[DesignAssetResponse])
async def list_design_assets(
    limit: int = Query(120, ge=1, le=300),
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    try:
        cursor = db[ASSETS].find({}).sort([("created_at", -1)]).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [
            DesignAssetResponse(
                _id=str(d.get("_id")),
                url=d.get("url", ""),
                public_id=d.get("public_id", ""),
                width=d.get("width"),
                height=d.get("height"),
                filename=d.get("filename"),
                created_at=d.get("created_at") or datetime.now(timezone.utc),
            )
            for d in docs
            if d.get("url")
        ]
    except Exception:
        logger.exception("Failed to list design assets")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load your uploads. Please try again.",
        )


@router.post(
    "/assets/upload",
    response_model=DesignAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_design_asset(
    file: UploadFile = File(...),
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPEG, WebP, GIF or SVG images can be uploaded.",
        )

    probe = await file.read()
    if len(probe) > MAX_ASSET_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="That image is larger than 12MB. Please compress it first.",
        )
    await file.seek(0)

    try:
        details = await upload_image_and_get_details(
            file, folder="crochetcreation/designs/assets"
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to upload design asset")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not upload that image. Please try again.",
        )

    doc = {
        "url": details["url"],
        "public_id": details["public_id"],
        "width": details.get("width"),
        "height": details.get("height"),
        "filename": (file.filename or "upload")[:140],
        "created_by": str(current_admin.email),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[ASSETS].insert_one(doc)
    doc["_id"] = result.inserted_id

    return DesignAssetResponse(
        _id=str(doc["_id"]),
        url=doc["url"],
        public_id=doc["public_id"],
        width=doc.get("width"),
        height=doc.get("height"),
        filename=doc.get("filename"),
        created_at=doc["created_at"],
    )


@router.delete("/assets/{asset_id}", status_code=status.HTTP_200_OK)
async def delete_design_asset(
    asset_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(asset_id)

    doc = await db[ASSETS].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That upload no longer exists.",
        )

    await db[ASSETS].delete_one({"_id": oid})
    if doc.get("public_id"):
        await delete_image_from_cloudinary(doc["public_id"])

    return {"detail": "Upload deleted.", "id": asset_id}


@router.post(
    "/assets/render",
    response_model=DesignAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_rendered_design(
    payload: RenderUploadRequest,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """
    Publish an exported artboard into the media library so it can be reused as
    a product image, a homepage slot, or anywhere else a URL is expected.
    """
    db = _db()
    raw = _decode_data_url(payload.data_url, MAX_RENDER_BYTES)

    try:
        uploaded = await upload_bytes_to_cloudinary(
            raw, folder="crochetcreation/designs/renders"
        )
    except Exception:
        logger.exception("Failed to upload a rendered design")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not publish that image. Please try again.",
        )

    doc = {
        "url": uploaded["url"],
        "public_id": uploaded["public_id"],
        "width": uploaded.get("width"),
        "height": uploaded.get("height"),
        "filename": (payload.filename or "design-export.png")[:140],
        "created_by": str(current_admin.email),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[ASSETS].insert_one(doc)
    doc["_id"] = result.inserted_id

    return DesignAssetResponse(
        _id=str(doc["_id"]),
        url=doc["url"],
        public_id=doc["public_id"],
        width=doc.get("width"),
        height=doc.get("height"),
        filename=doc.get("filename"),
        created_at=doc["created_at"],
    )
