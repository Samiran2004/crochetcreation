from pydantic import BaseModel, Field, BeforeValidator
from typing import Annotated, Optional

# Custom type to convert MongoDB ObjectId to string for JSON serialization
PyObjectId = Annotated[str, BeforeValidator(str)]

class ProductModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str = Field(..., min_length=1)
    description: str
    price: float = Field(..., gt=0)
    category: str
    image_url: str

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
                "image_url": "https://res.cloudinary.com/demo/image/upload/v1234/crochet_rabbit.jpg"
            }
        }
