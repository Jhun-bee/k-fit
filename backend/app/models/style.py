from pydantic import BaseModel
from typing import List, Optional, Any

class StyleItem(BaseModel):
    type: str
    name: str
    price: Optional[int] = None
    price_range: Optional[str] = None # Keeping for backward compat if needed, but price is preferred
    image_keyword: str
    image_url: Optional[str] = None
    store_id: Optional[str] = None
    store_name: Optional[str] = None
    store_area: Optional[str] = None

class StoreInfo(BaseModel):
    store_id: str
    store_name: str
    area: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class Outfit(BaseModel):
    id: str
    name: str
    description: str
    items: List[StyleItem]
    matching_stores: List[StoreInfo] # Changed from List[str] to List[StoreInfo] or mixed? User prompt implies object.
    # User prompt example: "matching_stores": [{"store_id": ..., "store_name": ...}]
    # But existing frontend might expect strings?
    # Let's check frontend code. It expects matching_stores to be array of strings or objects? 
    # MapPage handles both: "const passedIds = passedStores.map((s: any) => (typeof s === 'string' ? s : s.id));"
    # So we can safely change this to list of objects or Any.
    trend_source: str
    weather_note: str
    total_price: Optional[int] = None

class TrendAnalysis(BaseModel):
    current_trends: List[str]
    trend_source: str
    season_note: str

class WeatherInfo(BaseModel):
    temp: int
    condition: str
    humidity: int

class StyleRecommendationResponse(BaseModel):
    trend_analysis: Optional[TrendAnalysis] = None
    outfits: List[Outfit]
    weather: WeatherInfo
    language: str
