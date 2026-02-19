from pydantic import BaseModel
from typing import List, Dict, Optional

class PriceRange(BaseModel):
    min: int
    max: int
    currency: str

class LocationAddress(BaseModel):
    ko: str
    en: str

class Location(BaseModel):
    lat: float
    lng: float
    address: LocationAddress

class StoreHours(BaseModel):
    open: str
    close: str
    closed_days: List[str]

class StoreName(BaseModel):
    ko: str
    en: str
    ja: str
    zh: str

class Store(BaseModel):
    id: str
    name: StoreName
    category: str
    style_tags: List[str]
    price_range: PriceRange
    location: Location
    area: str
    hours: StoreHours
    features: List[str]
    popular_items: List[str]
    instagram: str
    rating: float
    image_url: str
