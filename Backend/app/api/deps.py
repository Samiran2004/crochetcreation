from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from typing import Optional
from app.core.config import settings
from app.core.db import get_database
from app.models.user import UserInDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials: sub is missing from token payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: JWT decode error: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    try:
        user_dict = await db["users"].find_one({"email": email})
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection timed out or failed. If using MongoDB Atlas, please check if your current public IP is whitelisted in your Atlas Network Access settings. Error: {str(e)}"
        )
    if user_dict is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: user with email {email} not found in database.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return UserInDB(**user_dict)

async def get_optional_current_user(token: Optional[str] = Depends(optional_oauth2_scheme)) -> Optional[UserInDB]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except jwt.PyJWTError:
        return None

    db = get_database()
    if db is None:
        return None

    try:
        user_dict = await db["users"].find_one({"email": email})
        if user_dict is None:
            return None
        return UserInDB(**user_dict)
    except Exception:
        return None

async def get_current_admin_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative permissions to perform this action."
        )
    return current_user

