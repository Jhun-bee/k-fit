"""
OOTD Vision Analysis Service
Uses Gemini 1.5 Pro to analyze a batch of OOTD images
and extract a unified UserStyleProfile.

API key is loaded from environment variable GOOGLE_API_KEY (never hardcoded).
"""
import os
import io
import base64
import logging
import json
from typing import List, Dict, Any, Optional
from PIL import Image
import google.generativeai as genai

logger = logging.getLogger(__name__)


class VisionService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        self.model_name = "gemini-2.0-flash"

    def _decode_image(self, image_b64: str) -> Image.Image:
        """Decode a base64-encoded image string into a PIL Image."""
        if "base64," in image_b64:
            image_b64 = image_b64.split("base64,")[1]
        image_data = base64.b64decode(image_b64)
        return Image.open(io.BytesIO(image_data))

    def _resize_image(self, img: Image.Image, max_size: int = 1024) -> Image.Image:
        """Resize image to fit within max_size while maintaining aspect ratio."""
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        return img

    async def analyze_ootd_batch(self, images_b64: List[str], language: str = "en") -> Dict[str, Any]:
        """
        Analyze a batch of OOTD images to extract a unified UserStyleProfile.
        
        Args:
            images_b64: List of base64-encoded image strings
            language: Language code for the response
            
        Returns:
            A structured dict containing the user's style profile
        """
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not set. Please set it in your .env file.")

        if not images_b64:
            raise ValueError("No images provided for analysis.")

        # Decode and resize all images
        pil_images = []
        for i, img_b64 in enumerate(images_b64[:10]):  # Max 10 images
            try:
                img = self._decode_image(img_b64)
                img = self._resize_image(img)
                if img.mode == "RGBA":
                    img = img.convert("RGB")
                pil_images.append(img)
            except Exception as e:
                logger.warning(f"Failed to decode image {i}: {e}")
                continue

        if not pil_images:
            raise ValueError("No valid images could be processed.")

        lang_instruction = "한국어로 답변해주세요." if language == "ko" else f"Respond in {language}."

        prompt = f"""You are an expert K-fashion stylist AI. Analyze ALL of the following {len(pil_images)} OOTD (Outfit of the Day) photos.

Your task: Find the COMMON PATTERNS across all photos to build a unified style profile of the person.

Look for:
1. Recurring color palettes
2. Preferred silhouettes and fits (oversized, slim, etc.)
3. Common item types (e.g., wide-leg pants, crop tops, layered jackets)
4. Overall aesthetic or vibe (minimal, street, romantic, etc.)
5. Notable signature accessories or styling habits

{lang_instruction}

Return your analysis as a JSON object with this exact structure:
{{
    "core_aesthetic": "The main style aesthetic in 2-3 words (e.g., 'Minimal Street', 'Romantic Casual')",
    "preferred_fit": "Description of preferred fits and silhouettes",
    "key_colors": ["color1", "color2", "color3"],
    "signature_items": ["item1", "item2", "item3"],
    "style_keywords": ["keyword1", "keyword2", "keyword3"],
    "confidence_note": "Brief note on analysis confidence"
}}

Return ONLY the JSON. No markdown, no code blocks, no explanation."""

        try:
            model = genai.GenerativeModel(self.model_name)

            # Build content: prompt + all images
            content_parts = [prompt] + pil_images

            response = model.generate_content(
                content_parts,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1024,
                )
            )

            response_text = response.text.strip()

            # Clean up response - remove markdown code blocks if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                response_text = "\n".join(lines)

            result = json.loads(response_text)
            logger.info(f"OOTD analysis completed. Aesthetic: {result.get('core_aesthetic', 'unknown')}")
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            return {
                "core_aesthetic": "Unable to determine",
                "preferred_fit": "Analysis failed",
                "key_colors": [],
                "signature_items": [],
                "style_keywords": [],
                "confidence_note": f"JSON parsing failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"OOTD analysis failed: {e}")
            raise
