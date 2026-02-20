import os
import urllib.parse
import httpx
import asyncio
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse, Response, JSONResponse

router = APIRouter()

NAVER_SHOP_CLIENT_ID = os.getenv("NAVER_SHOP_CLIENT_ID", "")
NAVER_SHOP_CLIENT_SECRET = os.getenv("NAVER_SHOP_CLIENT_SECRET", "")
NAVER_SHOP_URL = "https://openapi.naver.com/v1/search/shop.json"

# 인메모리 캐시: search_key → image_url
_image_cache: dict[str, str] = {}

# Singleton HTTP Client
_http_client: httpx.AsyncClient | None = None

async def _get_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(timeout=5.0)
    return _http_client

async def _search_naver_shopping(query: str, retry: bool = True) -> str | None:
    """네이버 쇼핑 API로 상품 검색 → 첫 번째 결과의 image URL 반환"""
    if not NAVER_SHOP_CLIENT_ID or not NAVER_SHOP_CLIENT_SECRET:
        print("[placeholder] NAVER API keys not set")
        return None

    headers = {
        "X-Naver-Client-Id": NAVER_SHOP_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_SHOP_CLIENT_SECRET,
    }
    params = {
        "query": query,
        "display": 1,
        "start": 1,
        "sort": "sim",
        "exclude": "used:rental:cbshop",
    }

    try:
        client = await _get_client()
        resp = await client.get(NAVER_SHOP_URL, headers=headers, params=params)
        
        # 429 Too Many Requests - 재시도
        if resp.status_code == 429 and retry:
            print(f"[placeholder] Rate limited, waiting 1s and retrying: {query}")
            await asyncio.sleep(1.0)
            return await _search_naver_shopping(query, retry=False)

        resp.raise_for_status()
        data = resp.json()
        items = data.get("items", [])
        if items:
            image_url = items[0].get("image")
            if image_url:
                # HTTP -> HTTPS 변환 (혼합 콘텐츠 방지)
                if image_url.startswith("http://"):
                    image_url = image_url.replace("http://", "https://", 1)
                print(f"[placeholder] Found: {query} → {image_url}")
                return image_url
        print(f"[placeholder] No results for: {query}")
    except Exception as e:
        print(f"[placeholder] Naver API error: {e}")

    return None


def _svg_fallback(text: str, brand: str, w: int, h: int) -> Response:
    """최종 폴백: SVG 플레이스홀더"""
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="45%" text-anchor="middle"
              font-family="Arial" font-size="14" fill="#9ca3af">{text}</text>
        <text x="50%" y="60%" text-anchor="middle"
              font-family="Arial" font-size="11" fill="#d1d5db">{brand}</text>
    </svg>'''
    return Response(content=svg.encode(), media_type="image/svg+xml")


ALLOWED_BRANDS = {
    "MUSINSA Standard", "무신사 스탠다드",
    "thisisneverthat", "디스이즈네버댓",
    "COVERNAT", "커버낫",
    "ADER ERROR", "아더에러",
    "LMC", "엘엠씨",
    "MAHAGRID", "마하그리드",
    "Andersson Bell", "앤더슨벨",
    "KOOR", "쿠어",
    "8SECONDS", "에잇세컨즈",
    "SPAO", "스파오",
    "Matin Kim", "마뗑킴",
    "MARDI MERCREDI", "마르디 메크르디",
    "EMIS", "이미스",
    "Stand Oil", "스탠드오일",
    "Stylenanda", "스타일난다",
    "Kirsh", "키르시",
    "LEESLE", "리슬",
    "TCHAI KIM", "차이킴",
    "OUWR", "아워",
    "Bukchonzalak", "북촌잘락",
    "Soosulhwa", "수설화",
}

FEMALE_ONLY_BRANDS = {
    "Matin Kim", "마뗑킴",
    "MARDI MERCREDI", "마르디 메크르디",
    "EMIS", "이미스",
    "Stand Oil", "스탠드오일",
    "Stylenanda", "스타일난다",
    "Kirsh", "키르시"
}

def _build_search_query(brand: str, item_name: str, gender: str = None) -> str:
    """브랜드가 허용 목록에 없거나 성별이 맞지 않으면 무신사 스탠다드로 대체"""
    # 1. 브랜드 확인
    is_allowed = brand in ALLOWED_BRANDS
    
    # 2. 성별에 따른 여성 전용 브랜드 필터링
    is_gender_mismatch = (gender == "male" and brand in FEMALE_ONLY_BRANDS)
    
    if not is_allowed or is_gender_mismatch:
        status = "restricted" if not is_allowed else "gender-mismatch"
        print(f"[placeholder] Brand \"{brand}\" is {status}, replacing with 무신사 스탠다드")
        brand = "무신사 스탠다드"
    
    gender_prefix = ""
    if gender:
        gender_prefix = "남성 " if gender.lower() == "male" else "여성 "
    
    return f"{brand} {gender_prefix}{item_name}"

@router.get("/image")
async def placeholder_image(
    text: str = Query("Item"),
    brand: str = Query(""),
    w: int = Query(400),
    h: int = Query(400),
    gender: str = Query(None)
):
    decoded_text = urllib.parse.unquote_plus(text)
    decoded_brand = urllib.parse.unquote_plus(brand)

    # Hanbok Brand Mapping for Naver Search
    HANBOK_SEARCH_MAP = {
        "LEESLE": "리슬",
        "TCHAI KIM": "차이킴", 
        "OUWR": "아워",
        "Bukchonzalak": "북촌잘락",
        "Soosulhwa": "수설화"
    }
    search_brand = HANBOK_SEARCH_MAP.get(decoded_brand, decoded_brand)

    # 0. 영어 상품명 -> 한국어 변환 (우선순위 높음)
    _en_to_kr = {
        "oversized tee": "오버사이즈 티셔츠", "wide pants": "와이드 팬츠",
        "bucket hat": "버킷햇", "graphic sweatshirt": "그래픽 맨투맨",
        "denim jacket": "데님 자켓", "denim": "데님 자켓",
        "beanie": "비니", "jogger pants": "조거 팬츠",
        "logo sweatshirt": "로고 맨투맨", "hoodie": "후디",
        "cargo pants": "카고 팬츠", "crossbody bag": "크로스백",
        "sneakers": "스니커즈", "mini skirt": "미니스커트",
        "cardigan": "가디건", "bomber jacket": "봄버 자켓",
        "pleated skirt": "플리츠 스커트", "tote bag": "토트백",
        "cap": "볼캡", "windbreaker": "바람막이",
    }
    text_lower = decoded_text.lower().strip()
    refined_text = _en_to_kr.get(text_lower, decoded_text)

    # 1. 브랜드 및 성별 필터링 적용 (1차 쿼리 생성용)
    refined_query = _build_search_query(search_brand, refined_text, gender)
    print(f"[placeholder] Search start for: \"{search_brand} {decoded_text}\"")

    cache_key = f"{gender}_{refined_query}".lower().strip()

    # 1) 캐시 히트
    if cache_key in _image_cache:
        return RedirectResponse(
            url=_image_cache[cache_key],
            status_code=302,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # 2) 3단계 fallback 검색
    # Try 1: {brand} {item_name} (refined_query)
    print(f"[placeholder] Try 1: {refined_query}")
    image_url = await _search_naver_shopping(refined_query)

    if not image_url:
        # Try 2: {item_name}
        query2 = f"{'남성 ' if gender == 'male' else '여성 ' if gender == 'female' else ''}{refined_text}".strip()
        print(f"[placeholder] Try 1 failed, trying: {query2}")
        image_url = await _search_naver_shopping(query2)

    if not image_url:
        # Try 3: {brand}
        query3 = search_brand
        print(f"[placeholder] Try 2 failed, trying: {query3}")
        image_url = await _search_naver_shopping(query3)

    # 3) 결과 반환
    if image_url:
        _image_cache[cache_key] = image_url
        return RedirectResponse(
            url=image_url,
            status_code=302,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    # 4) 최종 폴백
    print(f"[placeholder] All steps failed for {decoded_brand} {decoded_text}. Returning SVG fallback.")
    return _svg_fallback(decoded_text, decoded_brand, w, h)


async def _search_naver_shopping_detail(query: str) -> dict | None:
    """네이버 쇼핑 검색 후 image, link, title을 딕셔너리로 반환"""
    if not NAVER_SHOP_CLIENT_ID or not NAVER_SHOP_CLIENT_SECRET:
        return None
    
    client = await _get_client()
    try:
        resp = await client.get(
            NAVER_SHOP_URL,
            params={"query": query, "display": 1, "sort": "sim", "exclude": "used:rental:cbshop"},
            headers={
                "X-Naver-Client-Id": NAVER_SHOP_CLIENT_ID,
                "X-Naver-Client-Secret": NAVER_SHOP_CLIENT_SECRET,
            },
        )
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("items", [])
            if items:
                item = items[0]
                image_url = item.get("image", "")
                if image_url and image_url.startswith("http://"):
                    image_url = image_url.replace("http://", "https://", 1)
                return {
                    "image": image_url,
                    "link": item.get("link", ""),
                    "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                    "price": item.get("lprice", ""),
                    "mall": item.get("mallName", "")
                }
        elif resp.status_code == 429:
            await asyncio.sleep(1)
            # 1회 재시도
            resp2 = await client.get(
                NAVER_SHOP_URL,
                params={"query": query, "display": 1, "sort": "sim", "exclude": "used:rental:cbshop"},
                headers={
                    "X-Naver-Client-Id": NAVER_SHOP_CLIENT_ID,
                    "X-Naver-Client-Secret": NAVER_SHOP_CLIENT_SECRET,
                },
            )
            if resp2.status_code == 200:
                data = resp2.json()
                items = data.get("items", [])
                if items:
                    item = items[0]
                    image_url = item.get("image", "")
                    if image_url and image_url.startswith("http://"):
                        image_url = image_url.replace("http://", "https://", 1)
                    return {
                        "image": image_url,
                        "link": item.get("link", ""),
                        "title": item.get("title", "").replace("<b>", "").replace("</b>", ""),
                        "price": item.get("lprice", ""),
                        "mall": item.get("mallName", "")
                    }
    except Exception as e:
        print(f"[placeholder] Detail search error: {e}")
    return None


@router.get("/product-info")
async def product_info(text: str = "Item", brand: str = "", gender: str = None):
    """상품 이미지 URL과 네이버 쇼핑 링크를 JSON으로 반환"""
    decoded_text = urllib.parse.unquote_plus(text)
    decoded_brand = urllib.parse.unquote_plus(brand)
    
    # Hanbok Mapping
    HANBOK_SEARCH_MAP = {
        "LEESLE": "리슬", "TCHAI KIM": "차이킴", "OUWR": "아워", "Bukchonzalak": "북촌잘락", "Soosulhwa": "수설화"
    }
    search_brand = HANBOK_SEARCH_MAP.get(decoded_brand, decoded_brand)

    # 영어 상품명 -> 한국어 변환
    _en_to_kr = {
        "oversized tee": "오버사이즈 티셔츠", "wide pants": "와이드 팬츠",
        "bucket hat": "버킷햇", "graphic sweatshirt": "그래픽 맨투맨",
        "denim jacket": "데님 자켓", "denim": "데님 자켓",
        "beanie": "비니", "jogger pants": "조거 팬츠",
        "logo sweatshirt": "로고 맨투맨", "hoodie": "후디",
        "cargo pants": "카고 팬츠", "crossbody bag": "크로스백",
        "sneakers": "스니커즈", "mini skirt": "미니스커트",
        "cardigan": "가디건", "bomber jacket": "봄버 자켓",
        "pleated skirt": "플리츠 스커트", "tote bag": "토트백",
        "cap": "볼캡", "windbreaker": "바람막이",
    }
    text_lower = decoded_text.lower().strip()
    refined_text = _en_to_kr.get(text_lower, decoded_text)
    
    # 3단계 fallback apply
    # Try 1: {brand} {item_name}
    query1 = _build_search_query(search_brand, refined_text, gender)
    print(f"[product-info] Try 1: {query1}")
    result = await _search_naver_shopping_detail(query1)
    
    if not result:
        # Try 2: {item_name}
        query2 = f"{'남성 ' if gender == 'male' else '여성 ' if gender == 'female' else ''}{refined_text}".strip()
        print(f"[product-info] Try 1 failed, trying: {query2}")
        result = await _search_naver_shopping_detail(query2)
    
    if not result:
        # Try 3: {brand}
        query3 = search_brand
        print(f"[product-info] Try 2 failed, trying: {query3}")
        result = await _search_naver_shopping_detail(query3)
    
    if result:
        return JSONResponse(result)
    
    print(f"[product-info] All steps failed for {decoded_brand} {decoded_text}")
    return JSONResponse({
        "image": None,
        "link": None, 
        "title": decoded_text
    })