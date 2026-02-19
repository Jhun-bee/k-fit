from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import style, fitting, stores, route

app = FastAPI(title="K-Fit API", version="0.1.0")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(style.router, prefix="/api/style", tags=["style"])
app.include_router(fitting.router, prefix="/api/fitting", tags=["fitting"])
app.include_router(stores.router, prefix="/api/stores", tags=["stores"])
app.include_router(route.router, prefix="/api/route", tags=["route"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
