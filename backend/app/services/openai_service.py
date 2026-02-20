import os
import json
import logging
import urllib.parse
from pathlib import Path
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


def _make_placeholder_url(item_name: str, store_name: str = "") -> str:
    encoded_name = urllib.parse.quote_plus(item_name or "fashion item")
    encoded_brand = urllib.parse.quote_plus(store_name or "")
    return f"/api/placeholder/image?text={encoded_name}&brand={encoded_brand}&w=400&h=400"


class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = "gpt-4o"
        # self.stores_data removed (migration to Naver Local Search)

    def _ensure_image_urls(self, data: dict):
        for outfit in data.get("outfits", []):
            for item in outfit.get("items", []):
                url = item.get("image_url", "")
                if not url or "via.placeholder" in url or "placehold.co" in url or "\x01" in url:
                    item["image_url"] = _make_placeholder_url(
                        item.get("name", "fashion item"),
                        item.get("store_name", "")
                    )

    async def recommend_style(
        self,
        style_prefs: List[str],
        budget: str,
        occasion: str,
        colors: List[str],
        gender: str,
        weather: Dict[str, Any],
        language: str
    ) -> Dict[str, Any]:

        # budget 파싱 — 안전하게
        try:
            budget_clean = str(budget).replace(',', '').replace('₩', '').replace(' ', '')
            budget_val = int(budget_clean)
            budget_min = max(budget_val // 2, 30000)
            budget_max = budget_val * 2
        except Exception:
            budget_min = 50000
            budget_max = 200000

        # weather 안전하게 꺼내기
        w_temp = weather.get("temp", 15)
        w_condition = weather.get("condition", "clear")
        w_humidity = weather.get("humidity", 50)

        # 프롬프트에서 중괄호를 이스케이프하기 위해 별도 변수 사용
        example_url = "https://placehold.co/400x400/FFF0F5/333333.png?text=Oversized+Knit+Sweater&font=roboto"

        prompt = f"""The user's gender is: {gender}

CRITICAL RULE: 
- If gender is "male": recommend ONLY men's clothing. No women's items, no skirts, no women's blouses.
- If gender is "female": recommend ONLY women's clothing.
- All recommended items must match the user's gender.

You are K-Fit, an AI K-fashion travel guide for foreign tourists visiting Seoul.

## YOUR TASK
1. Based on your knowledge of Korean fashion trends in 2024-2025, analyze current styles.
2. Create 3 outfit recommendations using REAL Korean fashion brands available in Seoul.

## USER PREFERENCES
- Gender: {gender}
- Styles/Keywords: {json.dumps(style_prefs)}
- Total Budget: ₩{budget_min:,}~₩{budget_max:,}
- Occasion: {occasion}
- Preferred Colors: {json.dumps(colors)}

CRITICAL BRAND RULES:
- If "Modern Hanbok" is in styles: AT LEAST 2 out of 3 outfits MUST include items from Korean Hanbok brands: LEESLE, TCHAI KIM, OUWR, Bukchonzalak.
- If "K-Culture" is in styles: Include at least 1 hanbok brand item across all recommendations AND you MUST add a "culture_tip" field for each outfit.

CRITICAL: For Korean Hanbok brands, you MUST use Korean product names:
- LEESLE (리슬): 철릭 원피스, 저고리 블라우스, 허리치마, 두루마기 코트
- TCHAI KIM (차이킴): 모던한복 저고리, 한복 랩스커트, 모던 당의
- OUWR (오우르): 생활한복 저고리, 한복 바지, 모던 두루마기
- Bukchonzalak (북촌잘락): 캐주얼 한복 셔츠, 한복 팬츠
- DO NOT use English names like "Traditional Hanbok Vest" or "Modern Hanbok Jacket" for these brands as Naver search will fail.

## GUIDELINES FOR BRANDS & STORES
- Recommend ACTUAL, POPULAR brands in Korea.
- **Korean Modern Hanbok Brands**:
  - LEESLE (리슬): Modern hanbok brand.
  - TCHAI KIM (차이킴): High-end modern hanbok.
  - OUWR (오우르): K-culture hanbok brand.
  - Bukchonzalak (북촌자락): Daily life hanbok.

- General Brands: MUSINSA Standard, SPAO, ALAND, TOPTEN10, Nike Seoul, ABC Mart, thisisneverthat, EQL, Matin Kim, depound, EMIS, Wonder Place, BEAKER, Gentle Monster, Ader Error, MUSINSA Empty.

## RULES
1. Each outfit = 3~4 items (top + bottom + outerwear or shoes or accessory)
2. Each item MUST have a realistic price in KRW.
3. Total outfit price must fit within users budget.
4. If "Modern Hanbok" style is selected: Recommend at least 1 hanbok item + mix-match with general fashion.
5. If "K-Culture" style is selected: Include a "culture_tip" field in the outfit with a relevant experience spot suggestion.
6. **Hotel Delivery**: Set "hotel_delivery": true for OUWR and TCHAI KIM brands.
7. **Mandatory Field**: Always include a "culture_tip" field in every outfit.

## OUTPUT FORMAT (strict JSON):
Return ONLY a valid JSON object with this exact structure:

{{
    "trend_analysis": {{
        "current_trends": ["trend1", "trend2", "trend3"],
        "trend_source": "Based on 2024-2025 Korean fashion trends",
        "season_note": "season description"
    }},
    "outfits": [
        {{
            "id": "outfit_1",
            "name": "Creative outfit name",
            "description": "Why this outfit is trendy",
            "weather_note": "Weather suitability",
            "trend_source": "Which Korean trend this reflects",
            "culture_tip": "Mandatory. A short tip about Korean culture related to the outfit.",
            "items": [
                {{
                    "type": "top",
                    "name": "Specific item name",
                    "price": 39900,
                    "image_url": "{example_url}",
                    "image_keyword": "item keyword for search",
                    "store_id": "brand_spao",
                    "store_name": "SPAO",
                    "store_area": "Seoul",
                    "hotel_delivery": false 
                }}
            ],
            "matching_stores": [], 
            "total_price": 119700
        }}
    ],
    "weather": {{"temp": {w_temp}, "condition": "{w_condition}", "humidity": {w_humidity}}},
    "language": "{language}"
}}

ALL text fields must be in {language}.
Prices must be in KRW (Korean Won).
"""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are K-Fit, a Korean fashion trend expert and shopping guide for tourists. Always respond in valid JSON only. No markdown, no explanation."
                    },
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )

            result_text = response.choices[0].message.content
            if not result_text:
                raise ValueError("Empty response from OpenAI")

            result = json.loads(result_text)

            # Post-processing: image_url 보장
            self._ensure_image_urls(result)

            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI JSON response: {e}")
            logger.error(f"Raw response: {result_text[:500] if result_text else 'None'}")
            raise ValueError(f"Invalid JSON from OpenAI: {e}")
        except Exception as e:
            logger.error(f"OpenAI recommendation failed: {e}")
            raise e

    async def adjust_style(
        self,
        current_outfit: Dict[str, Any],
        adjustment_request: str,
        language: str
    ) -> Dict[str, Any]:

        system_prompt = f"""You are a K-fashion style consultant.
Modify the given outfit based on the user's adjustment request.
Target Language: {language}
For image_url, use: https://placehold.co/400x400/FFF0F5/333333?text=ITEM+NAME&font=roboto
Return a JSON object with the single modified outfit (same schema as one outfit object)."""

        user_content = f"""Current Outfit: {json.dumps(current_outfit, ensure_ascii=False)}
Adjustment Request: {adjustment_request}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            data = json.loads(content)

            # image_url 보장
            if "items" in data:
                for item in data["items"]:
                    url = item.get("image_url", "")
                    if not url or "via.placeholder" in url or "\x01" in url:
                        item["image_url"] = _make_placeholder_url(
                            item.get("name", "fashion item"),
                            item.get("store_name", "")
                        )

            return data

        except Exception as e:
            logger.error(f"OpenAI adjustment failed: {e}")
            raise e


openai_service = OpenAIService()
