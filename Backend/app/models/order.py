from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional, List
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class OrderItem(BaseModel):
    product_id: str
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

class OrderResponse(OrderCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    status: str = "Pending"  # "Pending", "Processing", "Delivered", "Cancelled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
