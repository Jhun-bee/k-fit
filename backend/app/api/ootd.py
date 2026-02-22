"""
OOTD API Router
Handles image upload and batch style analysis endpoints.
API keys are never exposed to the frontend.
"""
import logging
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.vision_service import VisionService
from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)
router = APIRouter()

vision_service = VisionService()
openai_service = OpenAIService()


class OOTDAnalyzeRequest(BaseModel):
    images: List[str]  # List of base64-encoded image strings
    language: str = "en"


class OOTDRecommendRequest(BaseModel):
    style_profile: dict  # UserStyleProfile from analyze step
    gender: str = "female"
    budget_min: int = 50000
    budget_max: int = 300000
    occasion: str = "Daily"
    language: str = "en"


@router.post("/analyze")
async def analyze_ootd(request: OOTDAnalyzeRequest):
    """
    Analyze a batch of OOTD images using Gemini Vision.
    Returns a UserStyleProfile JSON.
    """
    try:
        if not request.images:
            raise HTTPException(status_code=400, detail="No images provided")
        if len(request.images) > 10:
            raise HTTPException(status_code=400, detail="Maximum 10 images allowed")

        profile = await vision_service.analyze_ootd_batch(
            images_b64=request.images,
            language=request.language
        )
        return {"status": "success", "style_profile": profile}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"OOTD analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze images")


@router.post("/recommend")
async def recommend_from_ootd(request: OOTDRecommendRequest):
    """
    Generate outfit recommendations based on the UserStyleProfile.
    Uses the existing OpenAI service for text-based recommendations.
    """
    try:
        profile = request.style_profile
        # Convert profile keywords into the format expected by recommend_style
        style_prefs = profile.get("style_keywords", [])
        colors = profile.get("key_colors", [])

        # Add the core aesthetic as a keyword
        aesthetic = profile.get("core_aesthetic", "")
        if aesthetic and aesthetic not in style_prefs:
            style_prefs.insert(0, aesthetic)

        result = await openai_service.recommend_style(
            gender=request.gender,
            style_prefs=style_prefs,
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            occasion=request.occasion,
            colors=colors
        )
        return result

    except Exception as e:
        logger.error(f"OOTD recommendation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")
