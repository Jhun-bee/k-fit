from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.weather_service import weather_service
from app.services.openai_service import openai_service

router = APIRouter()


class StyleRequest(BaseModel):
    style_prefs: List[str]
    budget: str
    occasion: str
    colors: List[str]
    gender: str = "Unisex"
    language: str = "en"
    keywords: List[str] = []
    styles: List[str] = ["Street", "Casual"]


class StyleAdjustmentRequest(BaseModel):
    current_outfit: Dict[str, Any]
    adjustment: str
    language: str = "en"


@router.post("/recommend")
async def recommend_style(request: StyleRequest):
    print(f"[style] Received gender: {request.gender}")
    print(f"[style] Received styles: {request.styles}")
    weather = await weather_service.get_seoul_weather()

    try:
        recommendation = await openai_service.recommend_style(
            style_prefs=request.styles + request.style_prefs + request.keywords, # Merge all possible style sources
            budget=request.budget,
            occasion=request.occasion,
            colors=request.colors,
            gender=request.gender,
            weather=weather,
            language=request.language
        )
        return recommendation

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/adjust")
async def adjust_style(request: StyleAdjustmentRequest):
    try:
        adjusted_outfit = await openai_service.adjust_style(
            current_outfit=request.current_outfit,
            adjustment_request=request.adjustment,
            language=request.language
        )
        return adjusted_outfit

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
