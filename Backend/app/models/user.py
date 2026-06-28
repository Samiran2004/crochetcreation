from pydantic import BaseModel, Field, BeforeValidator, EmailStr, field_validator
from typing import Annotated, Optional
import re

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    mobile: str = Field(..., min_length=1)
    is_admin: bool = False

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        # Normalize and remove common separators
        v_clean = re.sub(r"[\s\-()]", "", v)
        # Allow optional '+' prefix and 10 to 15 digits
        if not re.match(r"^\+?\d{10,15}$", v_clean):
            raise ValueError("Invalid mobile number format. Must be a valid phone number with 10 to 15 digits.")
        return v_clean
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters.")

import uuid

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    phone: str
    street_address: str
    city: str
    state: str
    postal_code: str
    is_default: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    addresses: list[Address] = []

    class Config:
        populate_by_name = True

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str
    addresses: list[Address] = []

    class Config:
        populate_by_name = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters.")

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v_clean = re.sub(r"[\s\-()]", "", v)
        if not re.match(r"^\+?\d{10,15}$", v_clean):
            raise ValueError("Invalid mobile number format. Must be a valid phone number with 10 to 15 digits.")
        return v_clean

class AddressCreate(BaseModel):
    full_name: str
    phone: str
    street_address: str
    city: str
    state: str
    postal_code: str
    is_default: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
