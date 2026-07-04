from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional, List

# Custom type to convert MongoDB ObjectId to string for JSON serialization
PyObjectId = Annotated[str, BeforeValidator(str)]

class ProductModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str = Field(..., min_length=1)
    description: str
    price: float = Field(..., gt=0)
    originalPrice: Optional[float] = Field(default=None, gt=0)
    sellingPrice: Optional[float] = Field(default=None, gt=0)
    category: str
    image_url: str
    image_urls: Optional[List[str]] = Field(default_factory=list)
    size: Optional[str] = Field(default="")
    materials: Optional[str] = Field(default="")
    care_instructions: Optional[str] = Field(default="")
    in_stock: Optional[bool] = Field(default=True)
    stock_quantity: Optional[int] = Field(default=15)
    stock_count: Optional[int] = Field(default=15)
    delivery_time: Optional[str] = Field(default="5-7 working days")
    has_sizes: Optional[bool] = Field(default=False)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)

    class Config:
        populate_by_name = True
        json_encoders = {}
        json_schema_extra = {
            "example": {
                "title": "Cute Crochet Rabbit Toy",
                "description": "Handmade white organic cotton crochet rabbit toy.",
                "price": 24.99,
                "category": "toys",
                "image_url": "https://res.cloudinary.com/demo/image/upload/v1234/crochet_rabbit.jpg",
                "width": 1200,
                "height": 900
            }
        }

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    originalPrice: Optional[float] = None
    sellingPrice: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    size: Optional[str] = None
    materials: Optional[str] = None
    care_instructions: Optional[str] = None
    in_stock: Optional[bool] = None
    stock_quantity: Optional[int] = None
    stock_count: Optional[int] = None
    delivery_time: Optional[str] = None
    has_sizes: Optional[bool] = None
    width: Optional[int] = None
    height: Optional[int] = None
