from pydantic import BaseModel
from typing import List, Optional

class StyleItem(BaseModel):
    type: str
    name: str
    price_range: str
    image_keyword: str

class Outfit(BaseModel):
    id: str
    name: str
    description: str
    items: List[StyleItem]
    matching_stores: List[str]
    trend_source: str
    weather_note: str

class WeatherInfo(BaseModel):
    temp: int
    condition: str
    humidity: int

class StyleRecommendationResponse(BaseModel):
    outfits: List[Outfit]
    weather: WeatherInfo
    language: str
