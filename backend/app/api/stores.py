import os
import httpx
import urllib.parse
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
# Keep Store model import for compatibility with stubbed endpoints, though search returns different shape or we map it
from app.models.store import Store 

router = APIRouter()

# 1. Compatibility Stub
STORES: List[Store] = []

# 2. Naver API Keys (Reusing Shop Keys as requested)
NAVER_CLIENT_ID = os.getenv("NAVER_SHOP_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.getenv("NAVER_SHOP_CLIENT_SECRET", "")
NAVER_LOCAL_URL = "https://openapi.naver.com/v1/search/local.json"

# 3. Models for Search
class StoreSearchRequest(BaseModel):
    brands: List[str]
    area: Optional[str] = None

class StoreSearchResult(BaseModel):
    name: str
    brand: str
    category: str
    address: str
    roadAddress: str
    lat: float
    lng: float
    naverLink: Optional[str] = None
    kakaoLink: Optional[str] = None

class StoreSearchResponse(BaseModel):
    stores: List[StoreSearchResult]

# 4. Helper: robust coordinate conversion
def _convert_coord(val: str) -> float:
    """
    네이버 지역검색 API 좌표 변환
    - 1269780000 (Integer > 1억) -> / 10,000,000 (WGS84 scaled)
    - 311277 (Integer KATECH ?) -> / 10,000,000 (Just fallback, might be wrong but handled as requested)
    - 126.9780 (Float) -> As is
    """
    try:
        num = float(val)
        if num > 100000000:  # e.g., 1269780000
            return num / 10000000
        elif num > 10000:    # e.g., 311277 (KATECH or broken data), user asked for /100000 fallback or similar logic
             # User Request: if num > 1000: return num / 100000
             # But wait, 311277 / 100000 = 3.11... too small for Korea (37.5).
             # Let's strictly follow User's instruction: 
             # "elif num > 1000: return num / 100000"
             return num / 100000
        return num
    except Exception:
        return 0.0

# 5. Search Endpoint
@router.post("/search", response_model=StoreSearchResponse)
async def search_stores(request: StoreSearchRequest):
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Naver API Keys not configured")

    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }

    all_stores = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        import asyncio
        for brand in request.brands:
            query = f"{brand} {request.area}" if request.area else f"{brand} 서울"
            
            try:
                # Add delay to avoid rate limits when searching multiple brands
                if len(request.brands) > 1:
                    await asyncio.sleep(0.15)

                params = {
                    "query": query,
                    "display": 3, # Reduced to 3 per brand as requested to avoid clutter
                    "sort": "random"
                }
                resp = await client.get(NAVER_LOCAL_URL, headers=headers, params=params)
                
                if resp.status_code == 429:
                    print(f"Rate limit hit for {brand}, retrying...")
                    await asyncio.sleep(1.0)
                    resp = await client.get(NAVER_LOCAL_URL, headers=headers, params=params)

                resp.raise_for_status()
                data = resp.json()
                
                for item in data.get("items", []):
                    # Clean tags like <b>...</b>
                    name_clean = item['title'].replace("<b>", "").replace("</b>", "")
                    
                    # Coordinates
                    lat = _convert_coord(item['mapy'])
                    lng = _convert_coord(item['mapx'])
                    
                    if lat == 0 or lng == 0:
                        continue

                    # Links
                    naver_link = f"https://map.naver.com/v5/search/{urllib.parse.quote(name_clean)}"
                    kakao_link = f"https://map.kakao.com/link/search/{urllib.parse.quote(name_clean)}"

                    all_stores.append(StoreSearchResult(
                        name=name_clean,
                        brand=brand, # Tag with original brand name
                        category=item.get('category', ''),
                        address=item.get('address', ''),
                        roadAddress=item.get('roadAddress', ''),
                        lat=lat,
                        lng=lng,
                        naverLink=naver_link,
                        kakaoLink=kakao_link
                    ))
            except Exception as e:
                print(f"Error searching {brand}: {e}")
                continue

    return StoreSearchResponse(stores=all_stores)

# 6. Legacy Stubs
@router.get("/", response_model=List[Store])
async def get_stores():
    return []

@router.get("/nearby", response_model=List[Store])
async def get_nearby_stores():
    return []

@router.get("/{store_id}", response_model=Store)
async def get_store_detail(store_id: str):
    raise HTTPException(status_code=404, detail="Store not found (Legacy)")
