from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_stores():
    return {"message": "not implemented"}

@router.get("/{store_id}")
async def get_store_detail(store_id: str):
    return {"message": "not implemented"}
