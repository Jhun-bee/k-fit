from pydantic import BaseModel
from typing import Optional

class FittingRequest(BaseModel):
    user_image: str  # base64
    garment_image: str # base64 or url
    garment_type: str # upper_body, lower_body, dresses

class FittingResponse(BaseModel):
    generated_image: str # base64
    processing_time: float
