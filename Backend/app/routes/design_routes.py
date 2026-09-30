import asyncio
import base64
import binascii
import ipaddress
import json
import logging
import re
import socket
from urllib.parse import urlparse
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.api.deps import get_current_admin_user
from app.core.db import get_database
from app.models.design import (
    DesignAssetResponse,
    DesignElementCreate,
    DesignElementResponse,
    DesignElementSummary,
    UrlImportRequest,
    UrlImportResponse,
    DesignCreate,
    DesignResponse,
    DesignSummary,
    DesignUpdate,
    PaginatedDesignsResponse,
    RenderUploadRequest,
)
from app.models.user import UserInDB
from app.services.cloudinary_upload import (
    delete_image_by_url,
    delete_image_from_cloudinary,
    upload_bytes_to_cloudinary,
    upload_image_and_get_details,
)

logger = logging.getLogger("app.designs")

router = APIRouter(prefix="/api/admin/designs", tags=["designs"])

DESIGNS = "designs"
ASSETS = "design_assets"
ELEMENTS = "design_elements"

# A fabric scene is JSON, so it is cheap until someone drops a base64 image
# into it. Images belong in Cloudinary; this ceiling keeps a runaway document
# from hitting MongoDB's own 16MB limit and failing the save opaquely.
MAX_CANVAS_JSON_BYTES = 4 * 1024 * 1024
MAX_RENDER_BYTES = 12 * 1024 * 1024
MAX_ASSET_BYTES = 12 * 1024 * 1024
# Markup and animation JSON are stored whole, well inside MongoDB's ceiling.
MAX_ELEMENT_CONTENT_BYTES = 3 * 1024 * 1024

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


# ------------------------------------------------------- third-party import

MAX_IMPORT_BYTES = 8 * 1024 * 1024
IMPORT_TIMEOUT_SECONDS = 12
MAX_IMPORT_REDIRECTS = 3

# Only markup that renders. Anything that can execute, embed HTML, or reach
# back out to the network is stripped before the SVG is handed to the editor.
_SVG_SCRIPT_RE = re.compile(r"<\s*(script|foreignObject|iframe|object|embed)\b.*?<\s*/\s*\1\s*>", re.IGNORECASE | re.DOTALL)
_SVG_SELF_CLOSING_RE = re.compile(r"<\s*(script|foreignObject|iframe|object|embed|use)\b[^>]*/\s*>", re.IGNORECASE)
_SVG_EVENT_ATTR_RE = re.compile(r"\son[a-z]+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", re.IGNORECASE)
_SVG_JS_URL_RE = re.compile(r"(href|xlink:href|src)\s*=\s*(\"|')\s*(javascript:|data:text/html)[^\"']*(\"|')", re.IGNORECASE)
_SVG_EXTERNAL_REF_RE = re.compile(r"\s(xlink:href|href)\s*=\s*(\"|')\s*https?://[^\"']*(\"|')", re.IGNORECASE)


def _sanitize_svg(markup: str) -> str:
    cleaned = _SVG_SCRIPT_RE.sub("", markup)
    cleaned = _SVG_SELF_CLOSING_RE.sub("", cleaned)
    cleaned = _SVG_EVENT_ATTR_RE.sub("", cleaned)
    cleaned = _SVG_JS_URL_RE.sub("", cleaned)
    cleaned = _SVG_EXTERNAL_REF_RE.sub("", cleaned)
    if "<svg" not in cleaned.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That link did not contain a usable SVG.",
        )
    return cleaned


_OG_IMAGE_RE = re.compile(
    r"<meta[^>]+(?:property|name)\s*=\s*[\"'](?:og:image(?::secure_url)?|twitter:image)[\"'][^>]*>",
    re.IGNORECASE,
)
_CONTENT_RE = re.compile(r"content\s*=\s*[\"']([^\"']+)[\"']", re.IGNORECASE)


def _extract_preview_image(html: str, base_url: str) -> Optional[str]:
    """
    Pull a page's social-preview image out of its HTML.

    Lets someone paste an ordinary article or gallery link instead of hunting
    for the direct file URL. It only works for sites that render their meta
    tags on the server; single-page apps that inject them in the browser
    (Canva among them) hand back an empty shell, and the caller reports that
    rather than guessing.
    """
    for tag in _OG_IMAGE_RE.findall(html[:400_000]):
        found = _CONTENT_RE.search(tag)
        if not found:
            continue
        candidate = found.group(1).strip()
        if not candidate:
            continue
        if candidate.startswith("//"):
            candidate = f"https:{candidate}"
        elif candidate.startswith("/"):
            parsed = urlparse(base_url)
            candidate = f"{parsed.scheme}://{parsed.netloc}{candidate}"
        if candidate.startswith(("http://", "https://")):
            return candidate
    return None


def _resolve_public_ips(host: str) -> None:
    """
    Refuse anything that resolves inside the network this server sits in.

    Without it, "import from URL" is a request forwarder: an admin URL could
    be pointed at the metadata service or an internal admin port and the
    response handed straight back.
    """
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That address could not be resolved.",
        )

    for info in infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            continue
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That address is not allowed.",
            )


async def _validate_import_url(raw: str) -> str:
    parsed = urlparse((raw or "").strip())
    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only http and https links can be imported.",
        )
    if not parsed.hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That does not look like a valid link.",
        )
    await asyncio.get_event_loop().run_in_executor(None, _resolve_public_ips, parsed.hostname)
    return parsed.geturl()


# Hosts that render their pages entirely in the browser. Fetching one of
# these server-side returns an empty shell (or a bot-check), so the request
# is turned away with instructions that actually lead somewhere instead of a
# generic "could not be reached".
CLIENT_RENDERED_HOSTS = {
    "canva.com",
    "www.canva.com",
    "figma.com",
    "www.figma.com",
}

CLIENT_RENDERED_DETAIL = (
    "Canva and Figma build their pages in the browser, so a link to one has no image "
    "behind it that a server can read. Download the design instead — SVG keeps the text "
    "and shapes editable — or right-click its preview and choose \"Copy image address\", "
    "which does work here."
)


def _reject_client_rendered(url: str) -> None:
    host = (urlparse(url).hostname or "").lower()
    if host in CLIENT_RENDERED_HOSTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=CLIENT_RENDERED_DETAIL,
        )


async def _download(url: str) -> tuple:
    """
    Fetch a URL, re-validating every redirect hop.

    Returns (final_url, content_type, body). Redirects are followed manually
    because a server-side fetcher that follows them blindly can be walked
    from a public host to an internal one in a single hop.
    """
    import httpx

    try:
        async with httpx.AsyncClient(
            timeout=IMPORT_TIMEOUT_SECONDS,
            follow_redirects=False,
            # Several large image hosts (Wikimedia among them) reject
            # unfamiliar User-Agent strings outright, so the fetch presents
            # itself the way the admin's own browser would.
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html;q=0.8,*/*;q=0.5",
                "Accept-Language": "en-US,en;q=0.9",
            },
        ) as client:
            response = None
            for _ in range(MAX_IMPORT_REDIRECTS + 1):
                response = await client.get(url)
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("location")
                    if not location:
                        break
                    url = await _validate_import_url(str(httpx.URL(url).join(location)))
                    continue
                break
    except HTTPException:
        raise
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That link could not be reached.",
        )

    if response is None or response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That link returned an error.",
        )

    body = response.content
    if len(body) > MAX_IMPORT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="That file is larger than 8MB.",
        )

    content_type = (response.headers.get("content-type") or "").split(";")[0].strip().lower()
    return url, content_type, body


async def _store_imported_image(
    body: bytes, source_url: str, filename: Optional[str], admin_email: str, db
) -> DesignAssetResponse:
    try:
        uploaded = await upload_bytes_to_cloudinary(
            body, folder="crochetcreation/designs/imported"
        )
    except Exception:
        logger.exception("Failed to store an imported image")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not store that image. Please try again.",
        )

    doc = {
        "url": uploaded["url"],
        "public_id": uploaded["public_id"],
        "width": uploaded.get("width"),
        "height": uploaded.get("height"),
        "filename": (filename or urlparse(source_url).path.rsplit("/", 1)[-1] or "imported")[:140],
        "created_by": admin_email,
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



def _looks_like_lottie(content_type: str, body: bytes) -> bool:
    """
    Recognise a Bodymovin animation.

    Checked by shape rather than by file extension, because Lottie is served
    as plain JSON from every host that carries it and the URL often says
    nothing useful about what is behind it.
    """
    if content_type not in {"application/json", "text/json", "text/plain", "application/octet-stream", ""}:
        return False
    head = body[:4096].lstrip()
    if not head.startswith(b"{"):
        return False
    try:
        parsed = json.loads(body.decode("utf-8", errors="replace"))
    except (ValueError, UnicodeDecodeError):
        return False
    return isinstance(parsed, dict) and {"v", "fr", "op", "layers"} <= set(parsed)


def _is_svg(content_type: str, body: bytes) -> bool:
    return content_type == "image/svg+xml" or (
        content_type in {"", "text/plain", "application/octet-stream"}
        and b"<svg" in body[:4096].lower()
    )


@router.post("/assets/import-url", response_model=UrlImportResponse)
async def import_asset_from_url(
    payload: UrlImportRequest,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """
    Fetch an icon or image from another site and bring it into the Studio.

    The browser cannot do this itself — an icon CDN rarely sends CORS
    headers, and reading SVG markup cross-origin is blocked outright.
    """
    db = _db()
    url = await _validate_import_url(payload.url)
    _reject_client_rendered(url)
    url, content_type, body = await _download(url)

    if _is_svg(content_type, body):
        markup = body.decode("utf-8", errors="replace")
        return UrlImportResponse(kind="svg", svg=_sanitize_svg(markup), asset=None)

    if _looks_like_lottie(content_type, body):
        if len(body) > MAX_ELEMENT_CONTENT_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="That animation is too large to import.",
            )
        return UrlImportResponse(
            kind="lottie", lottie=body.decode("utf-8", errors="replace"), asset=None
        )

    if content_type.startswith("image/"):
        asset = await _store_imported_image(
            body, url, payload.filename, str(current_admin.email), db
        )
        return UrlImportResponse(kind="image", svg=None, asset=asset)

    if content_type in {"text/html", "application/xhtml+xml"}:
        # An ordinary web page: fall back to its social-preview image. This is
        # a single extra hop, never a chain — a preview that is itself a page
        # is treated as no preview at all.
        preview = _extract_preview_image(body.decode("utf-8", errors="replace"), url)
        if preview:
            preview_url = await _validate_import_url(preview)
            preview_url, preview_type, preview_body = await _download(preview_url)
            if _is_svg(preview_type, preview_body):
                return UrlImportResponse(
                    kind="svg",
                    svg=_sanitize_svg(preview_body.decode("utf-8", errors="replace")),
                    asset=None,
                )
            if preview_type.startswith("image/"):
                asset = await _store_imported_image(
                    preview_body, preview_url, payload.filename, str(current_admin.email), db
                )
                return UrlImportResponse(kind="image", svg=None, asset=asset)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "That page builds itself in the browser, so the link has no image behind it. "
                "Download the design instead, or copy the image address of its preview."
            ),
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="That link is not an image. Paste a direct image or SVG link.",
    )


# ----------------------------------------------------------- element library

def _element_summary(doc: Dict[str, Any]) -> DesignElementSummary:
    return DesignElementSummary(
        _id=str(doc.get("_id")),
        name=doc.get("name", "Imported element"),
        kind=doc.get("kind", "svg"),
        preview_url=doc.get("preview_url"),
        source_url=doc.get("source_url"),
        created_at=doc.get("created_at") or datetime.now(timezone.utc),
    )


@router.get("/elements/library", response_model=List[DesignElementSummary])
async def list_design_elements(
    limit: int = Query(200, ge=1, le=500),
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    try:
        cursor = db[ELEMENTS].find({}).sort([("created_at", -1)]).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [_element_summary(d) for d in docs]
    except Exception:
        logger.exception("Failed to list design elements")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load your saved elements. Please try again.",
        )


@router.post(
    "/elements",
    response_model=DesignElementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_design_element(
    payload: DesignElementCreate,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """
    Save an imported element so it is available in every design from now on.

    Without this, an icon pasted into one artboard would have to be fetched
    and pasted again for the next — the import would be a one-off rather
    than something the shop actually owns.
    """
    db = _db()

    raw = payload.content or ""
    if len(raw.encode("utf-8")) > MAX_ELEMENT_CONTENT_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="That element is too large to save. Try a simpler file.",
        )

    if payload.kind == "svg":
        content = _sanitize_svg(raw)
    else:
        try:
            parsed = json.loads(raw)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That does not look like a Lottie animation.",
            )
        # Bodymovin always carries a frame rate, an out point and layers.
        if not isinstance(parsed, dict) or not {"v", "fr", "op", "layers"} <= set(parsed):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="That JSON is not a Lottie animation.",
            )
        content = raw

    preview_url = None
    if payload.preview_data_url:
        try:
            preview_bytes = _decode_data_url(payload.preview_data_url, MAX_RENDER_BYTES)
            uploaded = await upload_bytes_to_cloudinary(
                preview_bytes, folder="crochetcreation/designs/elements"
            )
            preview_url = uploaded["url"]
        except HTTPException:
            raise
        except Exception:
            # A missing thumbnail costs a nicer grid, not the element itself.
            logger.exception("Could not store an element preview")

    doc = {
        "name": payload.name,
        "kind": payload.kind,
        "content": content,
        "source_url": payload.source_url,
        "preview_url": preview_url,
        "created_by": str(current_admin.email),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[ELEMENTS].insert_one(doc)
    doc["_id"] = result.inserted_id

    summary = _element_summary(doc)
    return DesignElementResponse(**summary.model_dump(by_alias=True), content=content)


@router.get("/elements/{element_id}", response_model=DesignElementResponse)
async def get_design_element(
    element_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(element_id)
    doc = await db[ELEMENTS].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That element no longer exists.",
        )
    summary = _element_summary(doc)
    return DesignElementResponse(
        **summary.model_dump(by_alias=True), content=doc.get("content")
    )


@router.delete("/elements/{element_id}", status_code=status.HTTP_200_OK)
async def delete_design_element(
    element_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    db = _db()
    oid = _object_id(element_id)

    doc = await db[ELEMENTS].find_one({"_id": oid})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="That element no longer exists.",
        )

    await db[ELEMENTS].delete_one({"_id": oid})
    if doc.get("preview_url"):
        await delete_image_by_url(doc["preview_url"])

    return {"detail": "Element deleted.", "id": element_id}
