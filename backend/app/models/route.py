from pydantic import BaseModel
from typing import List, Dict, Optional

class NavigationLinks(BaseModel):
    kakao: str
    naver: str
    google: str

class TransitInfo(BaseModel):
    method: str
    duration_min: int
    odsay_summary: str
    navigation_links: NavigationLinks

class RouteStep(BaseModel):
    order: int
    store_id: str
    store_name: str
    arrival_time: str
    shopping_time_min: int
    transit_to_next: Optional[TransitInfo] = None

class RoutePlan(BaseModel):
    total_time_min: int
    total_stores: int
    schedule: List[RouteStep]
    tips: List[str]

class RouteResponse(BaseModel):
    route: RoutePlan
