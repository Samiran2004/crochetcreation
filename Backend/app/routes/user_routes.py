from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserResponse, UserInDB, UserUpdate, Address, AddressCreate
from app.api.deps import get_current_user
from app.core.db import get_database
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_profile(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    if not update_data:
        return current_user

    if "mobile" in update_data and update_data["mobile"] != current_user.mobile:
        existing = await db["users"].find_one({"mobile": update_data["mobile"]})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number already in use by another user."
            )

    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": update_data}
    )

    updated_user = await db["users"].find_one({"email": current_user.email})
    return updated_user

@router.post("/me/addresses", response_model=list[Address])
async def add_address(
    address_in: AddressCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    new_address = Address(
        id=str(uuid.uuid4()),
        **address_in.model_dump()
    )

    addresses = current_user.addresses or []

    if new_address.is_default:
        for addr in addresses:
            addr.is_default = False

    if not addresses:
        new_address.is_default = True

    addresses.append(new_address)

    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"addresses": [addr.model_dump() for addr in addresses]}}
    )

    return addresses

@router.put("/me/addresses/{address_id}", response_model=list[Address])
async def update_address(
    address_id: str,
    address_in: AddressCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    addresses = current_user.addresses or []
    found = False

    for i, addr in enumerate(addresses):
        if addr.id == address_id:
            updated_addr = Address(
                id=address_id,
                **address_in.model_dump()
            )
            addresses[i] = updated_addr
            found = True
            break

    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found."
        )

    if address_in.is_default:
        for addr in addresses:
            if addr.id != address_id:
                addr.is_default = False

    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"addresses": [addr.model_dump() for addr in addresses]}}
    )

    return addresses

@router.delete("/me/addresses/{address_id}", response_model=list[Address])
async def delete_address(
    address_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    db = get_database()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not initialized."
        )

    addresses = current_user.addresses or []
    initial_len = len(addresses)
    addresses = [addr for addr in addresses if addr.id != address_id]

    if len(addresses) == initial_len:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found."
        )

    has_default = any(addr.is_default for addr in addresses)
    if not has_default and addresses:
        addresses[0].is_default = True

    await db["users"].update_one(
        {"email": current_user.email},
        {"$set": {"addresses": [addr.model_dump() for addr in addresses]}}
    )

    return addresses
