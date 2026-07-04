from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional, List
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class Address(BaseModel):
    street_address: str
    city: str
    state: str
    postal_code: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    shipping_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ManualOrderCreate(BaseModel):
    """Schema for admin-created manual/DM orders."""
    customer_name: str
    customer_email: Optional[str] = None
    customer_mobile: Optional[str] = None
    items: List[OrderItem]
    total_amount: float
    payment_method: str = "COD"
    notes: Optional[str] = None
    shipping_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    shipping_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    email_sent: bool = False
    invoice_url: Optional[str] = None

    class Config:
        populate_by_name = True

class ManualOrderResponse(BaseModel):
    """Response for manual order creation — includes email_sent flag."""
    order: OrderResponse
    email_sent: bool = False
