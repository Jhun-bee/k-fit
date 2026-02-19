from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def create_route():
    return {"message": "not implemented"}
