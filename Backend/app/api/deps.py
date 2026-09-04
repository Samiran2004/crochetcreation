import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from typing import Optional
from app.core.config import settings
from app.core.db import get_database
from app.models.user import UserInDB

logger = logging.getLogger("app.auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode a JWT and return its subject (email) only if it is a genuine *access*
    token. Refresh tokens carry type="refresh" and must never authenticate a
    request — they may only be exchanged at /api/auth/refresh.

    Returns None for anything invalid; callers decide whether that is a 401.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except jwt.PyJWTError as e:
        logger.info("Rejected token: %s", e)
        return None

    if payload.get("type") != "access":
        logger.info("Rejected token: wrong token type %r", payload.get("type"))
        return None

    email = payload.get("sub")
    if not email:
        logger.info("Rejected token: missing subject")
        return None

    return email


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserInDB:
    email = decode_access_token(token)
    if email is None:
        raise CREDENTIALS_EXCEPTION

    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again shortly."
        )

    try:
        user_dict = await db["users"].find_one({"email": email})
    except Exception:
        # Full detail (which can include connection strings and Atlas network
        # hints) goes to the server log, never to the client.
        logger.exception("Database lookup failed while authenticating a request")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again shortly."
        )

    if user_dict is None:
        raise CREDENTIALS_EXCEPTION

    return UserInDB(**user_dict)


async def get_optional_current_user(token: Optional[str] = Depends(optional_oauth2_scheme)) -> Optional[UserInDB]:
    if not token:
        return None

    email = decode_access_token(token)
    if email is None:
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
        logger.exception("Database lookup failed while resolving an optional user")
        return None


async def get_current_admin_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative permissions to perform this action."
        )
    return current_user
