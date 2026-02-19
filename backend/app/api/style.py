from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_style():
    return {"message": "not implemented"}
