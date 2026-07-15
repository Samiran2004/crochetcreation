from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import (
    UserCreate, UserResponse, UserInDB,
    ForgotPasswordRequest, VerifyOTPRequest, ResetPasswordRequest,
    GoogleAuthRequest
)
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.core.config import settings
import jwt
from app.core.db import get_database
from app.utils.email_sender import send_welcome_email, send_otp_email
import random
from datetime import datetime, timedelta, timezone
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

import app.core.firebase  # Ensures initialization
from firebase_admin import auth

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, background_tasks: BackgroundTasks):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    # Check if the email already exists in MongoDB
    existing_user_email = await db["users"].find_one({"email": user_in.email})
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Check if the mobile number already exists in MongoDB
    existing_user_mobile = await db["users"].find_one({"mobile": user_in.mobile})
    if existing_user_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this mobile number already exists."
        )

    # Hash the password
    hashed_password = get_password_hash(user_in.password)

    # Prepare document for insertion
    user_dict = user_in.model_dump(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    user_dict["is_admin"] = False

    # Insert document
    result = await db["users"].insert_one(user_dict)
    
    # Retrieve and return the created user
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    
    # Send welcome email using Brevo REST API
    try:
        background_tasks.add_task(
            send_welcome_email,
            created_user.get("email"),
            created_user.get("first_name", "Valued Customer"),
            created_user.get("last_name", ""),
            created_user.get("mobile", "")
        )
    except Exception as e:
        print(f"Error queueing welcome email: {e}")
        
    return created_user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    # Find user by email or mobile number
    user_dict = await db["users"].find_one({
        "$or": [
            {"email": form_data.username},
            {"mobile": form_data.username}
        ]
    })
    if not user_dict or not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/mobile or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    is_admin_user = user_dict.get("is_admin", False)

    # Create tokens
    access_token = create_access_token(subject=user_dict["email"])
    refresh_token = create_refresh_token(subject=user_dict["email"])
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "email": user_dict["email"],
            "first_name": user_dict["first_name"],
            "last_name": user_dict["last_name"],
            "is_admin": is_admin_user
        }
    }

@router.post("/google")
async def google_auth(req: GoogleAuthRequest, background_tasks: BackgroundTasks):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(req.firebase_id_token)
        email = decoded_token.get("email")
        name = decoded_token.get("name", "")
        uid = decoded_token.get("uid")
        picture = decoded_token.get("picture", "")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No email found in Google token."
            )

        # Split name into first and last
        name_parts = name.split(" ")
        first_name = name_parts[0] if name_parts else "User"
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        # Check if user exists
        user_dict = await db["users"].find_one({"email": email})
        
        if user_dict:
            # Update user if necessary (e.g., set auth_provider to google, update picture)
            update_data = {}
            if user_dict.get("auth_provider") != "google":
                update_data["auth_provider"] = "google"
            if picture and user_dict.get("picture") != picture:
                update_data["picture"] = picture
                
            if update_data:
                await db["users"].update_one(
                    {"email": email},
                    {"$set": update_data}
                )
        else:
            # Create new user
            user_dict = {
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "mobile": "", # Can't get mobile from Google reliably
                "hashed_password": "", # No password for Google auth users
                "is_admin": False,
                "auth_provider": "google",
                "firebase_uid": uid,
                "picture": picture,
                "is_verified": True
            }
            result = await db["users"].insert_one(user_dict)
            user_dict["_id"] = result.inserted_id

            # Send welcome email using Brevo REST API for new Google users
            try:
                background_tasks.add_task(
                    send_welcome_email,
                    user_dict.get("email"),
                    user_dict.get("first_name", "Valued Customer"),
                    user_dict.get("last_name", ""),
                    ""
                )
            except Exception as e:
                print(f"Error queueing welcome email for Google auth: {e}")

        # Create our standard application tokens
        access_token = create_access_token(subject=user_dict["email"])
        refresh_token = create_refresh_token(subject=user_dict["email"])
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "email": user_dict["email"],
                "first_name": user_dict.get("first_name", ""),
                "last_name": user_dict.get("last_name", ""),
                "is_admin": user_dict.get("is_admin", False),
                "picture": user_dict.get("picture", "")
            }
        }

    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google ID token."
        )
    except Exception as e:
        print(f"Error in Google auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during Google authentication."
        )

@router.post("/forgot-password")
@limiter.limit("3/10minutes")
async def forgot_password(req: ForgotPasswordRequest, background_tasks: BackgroundTasks, request: Request):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    # Check if email exists
    user = await db["users"].find_one({"email": req.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address."
        )

    # Generate 6-digit OTP
    otp = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Store OTP in DB (overwrite if already exists)
    await db["otps"].update_one(
        {"email": req.email},
        {"$set": {"otp": otp, "expires_at": expires_at, "attempts": 0}},
        upsert=True
    )

    # Queue email sending task via Brevo REST API
    try:
        background_tasks.add_task(send_otp_email, req.email, otp)
    except Exception as e:
        print(f"Error queueing OTP email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email. Please try again later."
        )

    return {"message": "OTP has been successfully sent to your email address."}


@router.post("/verify-otp")
@limiter.limit("5/10minutes")
async def verify_otp(req: VerifyOTPRequest, request: Request):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    otp_doc = await db["otps"].find_one({"email": req.email})
    if not otp_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP not found or expired."
        )

    if otp_doc.get("attempts", 0) >= 5:
        await db["otps"].delete_one({"email": req.email})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. OTP has been invalidated."
        )

    if otp_doc["otp"] != req.otp:
        await db["otps"].update_one(
            {"email": req.email},
            {"$inc": {"attempts": 1}}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please check and try again."
        )

    if otp_doc["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new one."
        )

    return {"message": "OTP verified successfully."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    # Re-verify OTP for security
    otp_doc = await db["otps"].find_one({"email": req.email, "otp": req.otp})
    if not otp_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code."
        )

    if otp_doc["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP code has expired. Please request a new one."
        )

    # Hash new password
    hashed_password = get_password_hash(req.password)

    # Update user password in MongoDB
    result = await db["users"].update_one(
        {"email": req.email},
        {"$set": {"hashed_password": hashed_password}}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or password could not be updated."
        )

    # Delete the verified OTP
    await db["otps"].delete_one({"email": req.email})

    return {"message": "Password has been reset successfully."}

from pydantic import BaseModel
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
async def refresh_access_token(req: RefreshTokenRequest):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(req.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    db = get_database()
    user = await db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception

    new_access_token = create_access_token(subject=email)
    new_refresh_token = create_refresh_token(subject=email)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }
