from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def fit_clothes():
    return {"message": "not implemented"}
