import logging
import time
from typing import List, Dict, Any, Optional
from app.services.gemini_service import gemini_service
from app.models.fitting import FittingResponse

logger = logging.getLogger(__name__)

class FittingService:
    async def _download_image_as_bytes(self, url: str) -> bytes | None:
        """URL에서 이미지를 다운로드해서 bytes로 반환"""
        import httpx
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return resp.content
        except Exception as e:
            logger.error(f"[fitting] Image download error: {e}")
        return None

    async def _get_product_image_url(self, item_name: str, brand: str) -> str | None:
        """placeholder API를 내부 호출해서 상품 이미지 URL 가져오기"""
        from app.api.placeholder import _search_naver_shopping_detail
        
        query = f"{brand} {item_name}".strip()
        result = await _search_naver_shopping_detail(query)
        if result and result.get("image"):
            return result["image"]
        
        result = await _search_naver_shopping_detail(item_name)
        if result and result.get("image"):
            return result["image"]
        
        return None

    async def process_fitting(self, user_image: str, outfit_items: List[Dict[str, Any]], language: str) -> FittingResponse:
        import asyncio
        start_time = time.time()
        
        # 1. Fetch Product Images
        logger.info(f"[fitting] Starting image fetch for {len(outfit_items)} items")
        product_images = []
        for item in outfit_items:
            try:
                item_name = item.get("name", "")
                brand = item.get("store_name", "") or item.get("brand", "")
                
                logger.debug(f"[fitting] Fetching product image for: {brand} - {item_name}")
                img_url = await self._get_product_image_url(item_name, brand)
                if img_url:
                    img_bytes = await self._download_image_as_bytes(img_url)
                    if img_bytes:
                        size_kb = len(img_bytes) / 1024
                        logger.info(f"[fitting] Downloaded {item_name} image: {size_kb:.1f}KB")
                        product_images.append({
                            "name": item_name,
                            "bytes": img_bytes,
                            "mime_type": "image/jpeg"
                        })
                else:
                    logger.warning(f"[fitting] No image URL found for {item_name}")
            except Exception as e:
                logger.error(f"[fitting] Failed to download product image for {item.get('name')}: {e}")
                continue

        logger.info(f"[fitting] Total product images ready: {len(product_images)}")

        if not product_images:
            logger.warning("[fitting] No product images downloaded, falling back to text-only")
        
        try:
            # Extract item descriptions
            item_descriptions = [f"{item.get('name')} ({item.get('type')})" for item in outfit_items]
            
            # Call Gemini Service with Retry Logic
            max_retries = 1
            for attempt in range(max_retries + 1):
                try:
                    # Note: gemini_service calls are synchronous. 
                    # We run in a thread to keep the loop async if needed, or just call directly.
                    # Since we used await asyncio.sleep, let's keep it simple.
                    generated_image_b64 = gemini_service.virtual_try_on(
                        user_image, 
                        item_descriptions, 
                        product_images=product_images,
                        language=language
                    )
                    break # Success
                except Exception as e:
                    is_rate_limit = "429" in str(e) or "ResourceExhausted" in str(e) or "Too Many Requests" in str(e)
                    if is_rate_limit and attempt < max_retries:
                        logger.warning(f"Gemini 429/Rate Limit hit. Retrying in 5s... (Attempt {attempt+1}/{max_retries})")
                        await asyncio.sleep(5)
                        continue
                    
                    if is_rate_limit and attempt == max_retries:
                        # Re-raise as a specific error that the API can catch to header 429
                        raise Exception("rate_limited")
                    
                    raise e
            
            processing_time = time.time() - start_time
            
            return FittingResponse(
                generated_image=generated_image_b64,
                processing_time=processing_time
            )
            
        except Exception as e:
            if str(e) == "rate_limited":
                # Propagate specific message
                raise e
            logger.error(f"Fitting process failed: {e}")
            raise e

    async def process_style_edit(self, user_image: str, command: str, language: str) -> FittingResponse:
        start_time = time.time()
        
        try:
            generated_image_b64 = gemini_service.style_edit(user_image, command, language)
            
            processing_time = time.time() - start_time
            
            return FittingResponse(
                generated_image=generated_image_b64,
                processing_time=processing_time
            )
        except Exception as e:
            logger.error(f"Style edit process failed: {e}")
            raise e

fitting_service = FittingService()
