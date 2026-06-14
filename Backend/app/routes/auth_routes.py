from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse, UserInDB
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.db import get_database

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
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

    # Insert document
    result = await db["users"].insert_one(user_dict)
    
    # Retrieve and return the created user
    created_user = await db["users"].find_one({"_id": result.inserted_id})
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

    # Create access token
    access_token = create_access_token(subject=user_dict["email"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user_dict["email"],
            "first_name": user_dict["first_name"],
            "last_name": user_dict["last_name"]
        }
    }
