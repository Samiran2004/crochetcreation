import logging
import secrets
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from app.core.db import get_database
from app.api.deps import get_current_admin_user
from app.models.user import UserInDB
from app.models.thankyou import ThankYouCreate, ThankYouResponse, ThankYouPublicResponse
from bson import ObjectId
from typing import List

logger = logging.getLogger("app.thankyou")

router = APIRouter(prefix="/api", tags=["thankyou"])

FRONTEND_BASE_URL = "https://crochetcreation.vercel.app"


def _generate_unique_id() -> str:
    """Generate a short unique ID like 'cc-a1b2c3d4'."""
    return f"cc-{secrets.token_hex(4)}"


def _slugify(name: str) -> str:
    """Convert a name to a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug or "customer"


@router.post(
    "/admin/thankyou",
    response_model=ThankYouResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_thankyou_entry(
    payload: ThankYouCreate,
    background_tasks: BackgroundTasks,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """
    Admin creates a thank-you entry for a customer.
    Generates a unique URL and optionally sends an email.
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized.",
        )

    unique_id = _generate_unique_id()
    slug = _slugify(payload.name)

    # Ensure unique_id is truly unique (extremely unlikely collision, but safe)
    while await db["thankyou_customers"].find_one({"unique_id": unique_id}):
        unique_id = _generate_unique_id()

    thankyou_url = f"{FRONTEND_BASE_URL}/thankU/{slug}/{unique_id}"

    doc = {
        "name": payload.name,
        "email": payload.email,
        "mobile": payload.mobile,
        "unique_id": unique_id,
        "slug": slug,
        "thankyou_url": thankyou_url,
        "email_sent": False,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db["thankyou_customers"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # Send email in background if email was provided
    if payload.email:
        background_tasks.add_task(
            _send_thankyou_email_task,
            customer_name=payload.name,
            to_email=payload.email,
            thankyou_url=thankyou_url,
            doc_id=str(result.inserted_id),
        )

    return ThankYouResponse(**doc)


@router.get("/admin/thankyou", response_model=List[ThankYouResponse])
async def list_thankyou_entries(
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """List all thank-you customer entries, newest first."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized.",
        )

    cursor = db["thankyou_customers"].find({}).sort("created_at", -1)
    entries = await cursor.to_list(length=500)
    return [ThankYouResponse(**entry) for entry in entries]


@router.delete("/admin/thankyou/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thankyou_entry(
    entry_id: str,
    current_admin: UserInDB = Depends(get_current_admin_user),
):
    """Delete a thank-you customer entry by its MongoDB ID."""
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized.",
        )

    try:
        result = await db["thankyou_customers"].delete_one({"_id": ObjectId(entry_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid entry ID.",
        )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thank-you entry not found.",
        )


@router.get("/thankyou/{slug}/{unique_id}", response_model=ThankYouPublicResponse)
async def get_thankyou_page_data(slug: str, unique_id: str):
    """
    Public endpoint to fetch thank-you page data.
    No authentication required — the unique_id acts as an access token.
    """
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable.",
        )

    entry = await db["thankyou_customers"].find_one({
        "slug": slug,
        "unique_id": unique_id,
    })

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thank-you page not found.",
        )

    return ThankYouPublicResponse(
        name=entry["name"],
        created_at=entry["created_at"],
    )


async def _send_thankyou_email_task(
    customer_name: str,
    to_email: str,
    thankyou_url: str,
    doc_id: str,
):
    """Background task to send thank-you email and update DB status."""
    try:
        from app.utils.email_sender import send_thankyou_email

        success = await send_thankyou_email(
            to_email=to_email,
            customer_name=customer_name,
            thankyou_url=thankyou_url,
        )

        # Update email_sent status in DB
        from app.core.db import get_database
        db = get_database()
        if db is not None:
            await db["thankyou_customers"].update_one(
                {"_id": ObjectId(doc_id)},
                {"$set": {"email_sent": success}},
            )
            logger.info(f"Thank-you email to {to_email}: {'sent' if success else 'failed'}")
    except Exception as e:
        logger.error(f"Error in thank-you email task: {e}")
        try:
            from app.core.db import get_database
            db = get_database()
            if db is not None:
                await db["thankyou_customers"].update_one(
                    {"_id": ObjectId(doc_id)},
                    {"$set": {"email_sent": False}},
                )
        except Exception as db_err:
            logger.error(f"Failed to update email_sent status: {db_err}")
