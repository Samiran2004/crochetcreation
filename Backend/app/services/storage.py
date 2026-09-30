"""
Media storage, independent of who is hosting it.

Everything the app uploads goes through here. Which provider actually
receives it is decided at runtime by ``STORAGE_BACKEND``, so Cloudflare R2
and Cloudinary can run side by side during a migration: assets already in
Cloudinary keep being served from the absolute URLs stored against them,
while new uploads land wherever the setting points. Deletion inspects the
URL rather than trusting a setting, so old assets can still be removed after
the switch.

Images are re-encoded on the way in. Bandwidth, not disk, is what a media
budget is actually spent on, and an untouched phone photo is several
megabytes of it for every visitor who loads the page.
"""

import asyncio
import io
import logging
import mimetypes
import uuid
from typing import Optional
from urllib.parse import urlparse

from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger("app.storage")

# Formats that must not be re-encoded: SVG is text and would be rasterised,
# and a GIF would lose its animation.
PASSTHROUGH_TYPES = {"image/svg+xml", "image/gif"}

CACHE_CONTROL = "public, max-age=31536000, immutable"

_r2_client = None


def using_r2() -> bool:
    return settings.STORAGE_BACKEND == "r2"


def _client():
    """Lazily build the S3 client so importing this module needs no config."""
    global _r2_client
    if _r2_client is None:
        import boto3
        from botocore.config import Config

        _r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            # R2 ignores regions but boto3 insists on one being present.
            region_name="auto",
            config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
        )
    return _r2_client


# ------------------------------------------------------------- optimisation


def optimize_image(data: bytes, content_type: str) -> tuple:
    """
    Shrink an upload to something worth serving.

    Returns ``(data, content_type, extension, width, height)``. Anything that
    cannot be safely re-encoded, or that Pillow refuses to open, is returned
    untouched — a failed optimisation must never cost the admin their upload.
    """
    extension = (mimetypes.guess_extension(content_type or "") or ".bin").lstrip(".")
    if extension == "jpe":
        extension = "jpg"

    if content_type in PASSTHROUGH_TYPES:
        return data, content_type, extension, None, None

    try:
        from PIL import Image

        with Image.open(io.BytesIO(data)) as image:
            image.load()
            # Drop EXIF orientation into the pixels, otherwise the rotation is
            # lost when the metadata is stripped by the re-encode.
            try:
                from PIL import ImageOps

                image = ImageOps.exif_transpose(image)
            except Exception:
                pass

            has_alpha = image.mode in ("RGBA", "LA", "P")
            image = image.convert("RGBA" if has_alpha else "RGB")

            limit = settings.IMAGE_MAX_DIMENSION
            if limit > 0 and max(image.size) > limit:
                image.thumbnail((limit, limit), Image.LANCZOS)

            buffer = io.BytesIO()
            image.save(buffer, format="WEBP", quality=settings.IMAGE_QUALITY, method=4)
            encoded = buffer.getvalue()
            width, height = image.size
    except Exception:
        logger.info("Could not optimise an upload (%s); storing it as-is", content_type)
        return data, content_type, extension, None, None

    # Re-encoding is not guaranteed to win — a small PNG icon can come out
    # larger as WebP. Keep whichever is smaller.
    if len(encoded) >= len(data):
        return data, content_type, extension, width, height

    return encoded, "image/webp", "webp", width, height


def _measure(data: bytes) -> tuple:
    try:
        from PIL import Image

        with Image.open(io.BytesIO(data)) as image:
            return image.size
    except Exception:
        return None, None


# -------------------------------------------------------------------- keys


def build_key(folder: str, extension: str) -> str:
    return f"{folder.strip('/')}/{uuid.uuid4().hex}.{extension}"


def key_from_url(url: str) -> Optional[str]:
    """The object key for a URL served from our own R2 domain, else None."""
    base = settings.R2_PUBLIC_BASE_URL
    if not base or not url or not url.startswith(base):
        return None
    return urlparse(url).path.lstrip("/") or None


# ------------------------------------------------------------------ upload


async def _put(key: str, data: bytes, content_type: str) -> None:
    def _call():
        _client().put_object(
            Bucket=settings.R2_BUCKET,
            Key=key,
            Body=data,
            ContentType=content_type,
            CacheControl=CACHE_CONTROL,
        )

    await asyncio.get_event_loop().run_in_executor(None, _call)


async def upload_bytes(
    data: bytes,
    folder: str = "crochetcreation",
    public_id: Optional[str] = None,
    overwrite: bool = False,
    content_type: str = "image/png",
) -> dict:
    """
    Store raw bytes and return ``{url, public_id, width, height}``.

    ``public_id`` pins the object to a stable address so repeated writes
    replace it instead of piling up — which is what keeps one design from
    accumulating a new preview file on every save.
    """
    optimised, final_type, extension, width, height = optimize_image(data, content_type)
    if width is None:
        width, height = _measure(optimised)

    if not using_r2():
        from app.services.cloudinary_upload import upload_bytes_to_cloudinary

        return await upload_bytes_to_cloudinary(
            optimised, folder=folder, public_id=public_id, overwrite=overwrite
        )

    key = f"{folder.strip('/')}/{public_id}.{extension}" if public_id else build_key(folder, extension)
    await _put(key, optimised, final_type)

    return {
        "url": f"{settings.R2_PUBLIC_BASE_URL}/{key}",
        "public_id": key,
        "width": width,
        "height": height,
    }


async def upload_image(file: UploadFile, folder: str = "crochetcreation") -> dict:
    """Store an uploaded file and return ``{url, public_id, width, height}``."""
    data = await file.read()
    await file.seek(0)

    if not using_r2():
        from app.services.cloudinary_upload import upload_image_and_get_details

        return await upload_image_and_get_details(file, folder=folder)

    optimised, final_type, extension, width, height = optimize_image(
        data, file.content_type or "application/octet-stream"
    )
    if width is None:
        width, height = _measure(optimised)

    key = build_key(folder, extension)
    await _put(key, optimised, final_type)

    return {
        "url": f"{settings.R2_PUBLIC_BASE_URL}/{key}",
        "public_id": key,
        "width": width,
        "height": height,
    }


# ------------------------------------------------------------------ delete


async def delete_by_url(url: str) -> None:
    """
    Remove an asset, choosing the provider from the URL.

    Deciding by URL rather than by the current setting is what makes a
    half-migrated library safe to manage: a Cloudinary asset uploaded last
    month still deletes cleanly after the switch to R2.
    """
    if not url:
        return

    key = key_from_url(url)
    if key:
        def _call():
            _client().delete_object(Bucket=settings.R2_BUCKET, Key=key)

        try:
            await asyncio.get_event_loop().run_in_executor(None, _call)
        except Exception:
            logger.exception("Failed to delete %s from R2", key)
        return

    if "res.cloudinary.com" in url:
        from app.services.cloudinary_upload import delete_image_by_url

        await delete_image_by_url(url)


async def delete_asset(public_id: str, url: Optional[str] = None) -> None:
    """
    Remove an asset by its stored identifier.

    An R2 key and a Cloudinary public_id look alike, so the URL is used to
    disambiguate whenever the caller has one — which it almost always does.
    """
    if url:
        await delete_by_url(url)
        return
    if not public_id:
        return

    if using_r2():
        def _call():
            _client().delete_object(Bucket=settings.R2_BUCKET, Key=public_id)

        try:
            await asyncio.get_event_loop().run_in_executor(None, _call)
        except Exception:
            logger.exception("Failed to delete %s from R2", public_id)
        return

    from app.services.cloudinary_upload import delete_image_from_cloudinary

    await delete_image_from_cloudinary(public_id)
