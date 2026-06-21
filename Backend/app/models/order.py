from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional, List
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class OrderItem(BaseModel):
    product_id: Optional[str] = None
    title: str
    price: float
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    customer_mobile: str
    items: List[OrderItem]
    total_amount: float
    payment_method: str = "COD"  # "COD", "UPI", "CARD"
    user_id: Optional[PyObjectId] = None

class ManualOrderCreate(BaseModel):
    """Schema for admin-created manual/DM orders."""
    customer_name: str
    customer_email: Optional[str] = None
    customer_mobile: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    payment_method: str = "COD"
    notes: Optional[str] = None

class OrderResponse(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    customer_name: str
    customer_email: Optional[str] = None
    customer_mobile: Optional[str] = None
    items: List[OrderItem] = []
    total_amount: float = 0
    payment_method: str = "COD"
    user_id: Optional[PyObjectId] = None
    status: str = "Pending"  # "Pending", "Processing", "Delivered", "Cancelled"
    is_manual: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
