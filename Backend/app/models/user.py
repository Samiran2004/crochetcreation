from pydantic import BaseModel, Field, BeforeValidator, EmailStr, field_validator
from typing import Annotated, Optional
import re

PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    mobile: str = Field(..., min_length=1)

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

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)

    class Config:
        populate_by_name = True

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str

    class Config:
        populate_by_name = True
