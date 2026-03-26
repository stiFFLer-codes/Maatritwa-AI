from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client

from .auth import CurrentUser
from .db import get_supabase
from .ml import RiskPredictor
from .routers.asha import asha_router
from .routers.doctor import doctor_router
from .routers.mother import mother_router


class UserProfile(BaseModel):
    id: str
    role: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.risk_predictor = RiskPredictor.from_env()
    yield


app = FastAPI(title="Maatritwa AI Backend", lifespan=lifespan)

# ── CORS Configuration ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Vite dev server
        "http://127.0.0.1:5173",      # Vite dev server (127.0.0.1)
        "http://localhost:3000",      # Alternative dev port
        "http://127.0.0.1:3000",      # Alternative dev port (127.0.0.1)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])


# Removed auth completely (user wants no auth)

# @auth_router.get("/me", response_model=UserProfile)
# def auth_me( ... ) - REMOVED

# app.include_router(auth_router)  # Auth completely removed
app.include_router(asha_router)
app.include_router(doctor_router)
app.include_router(mother_router)
