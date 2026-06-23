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
    delivery_time: Optional[str] = Field(default="5-7 working days")
    has_sizes: Optional[bool] = Field(default=False)
    width: Optional[int] = Field(default=None)
    height: Optional[int] = Field(default=None)

    class Config:
        populate_by_name = True
        json_encoders = {
            # Handle encoding for PyObjectId if custom serialization is needed
        }
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
