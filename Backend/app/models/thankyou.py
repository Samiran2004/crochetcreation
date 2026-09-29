from pydantic import BaseModel, Field, BeforeValidator, field_validator
from typing import Annotated, Optional
from datetime import datetime, timezone
import re

PyObjectId = Annotated[str, BeforeValidator(str)]


class ThankYouCreate(BaseModel):
    """Schema used by admin to create a new thank-you customer entry."""
    name: str = Field(..., min_length=1, description="Customer name (required)")
    email: Optional[str] = Field(None, description="Customer email (optional)")
    mobile: Optional[str] = Field(None, description="Customer mobile number (optional)")

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
            # Normalize: remove common separators
            v_clean = re.sub(r"[\s\-()]", "", v)
            if not re.match(r"^\+?\d{10,15}$", v_clean):
                raise ValueError("Invalid mobile number format. Must be 10 to 15 digits.")
            return v_clean
        return v


class ThankYouResponse(BaseModel):
    """Response schema for a thank-you customer entry."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    unique_id: str
    slug: str
    thankyou_url: str
    email_sent: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class ThankYouPublicResponse(BaseModel):
    """Public-facing response for the thank-you page (no sensitive data)."""
    name: str
    created_at: datetime
