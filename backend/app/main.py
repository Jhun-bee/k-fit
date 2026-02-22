from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from app.api import style, fitting, stores, route, placeholder, ootd

app = FastAPI(title="K-Fit API", version="0.5.0")

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
app.include_router(placeholder.router, prefix="/api/placeholder", tags=["placeholder"])
app.include_router(ootd.router, prefix="/api/ootd", tags=["ootd"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "0.5.0"}
