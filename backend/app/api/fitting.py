from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.fitting_service import fitting_service
from app.models.fitting import FittingResponse

router = APIRouter()

class TryOnRequest(BaseModel):
    user_image: str # base64
    outfit_items: List[Dict[str, Any]] # List of items from style recommendation
    language: str = "en"

class StyleEditRequest(BaseModel):
    user_image: str # base64
    command: str
    language: str = "en"

@router.post("/try-on", response_model=FittingResponse)
async def virtual_try_on(request: TryOnRequest):
    try:
        response = await fitting_service.process_fitting(
            user_image=request.user_image,
            outfit_items=request.outfit_items,
            language=request.language
        )
        return response
    except Exception as e:
        import traceback
        print(f"[fitting] ERROR: {e}")
        print(f"[fitting] TRACEBACK: {traceback.format_exc()}")
        if str(e) == "rate_limited":
             raise HTTPException(status_code=429, detail="Too many requests. Please try again in a moment.")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/style-edit", response_model=FittingResponse)
async def style_edit(request: StyleEditRequest):
    try:
        response = await fitting_service.process_style_edit(
            user_image=request.user_image,
            command=request.command,
            language=request.language
        )
        return response
    except Exception as e:
        import traceback
        print(f"[fitting] ERROR: {e}")
        print(f"[fitting] TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
