from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client

from .auth import CurrentUser, get_current_user
from .db import get_supabase
from .ml import RiskPredictor
from .routers.asha import asha_router
from .routers.doctor import doctor_router
from .routers.mother import mother_router


class UserProfile(BaseModel):
    id: str
    role: str
    name: str | None = None
    phone: str | None = None
    language: str | None = None


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


@auth_router.get("/me", response_model=UserProfile)
def auth_me(
    current_user: CurrentUser = Depends(get_current_user),
    supabase: Client = Depends(get_supabase),
) -> UserProfile:
    response = (
        supabase.table("users")
        .select("id, role, name, phone, language")
        .eq("id", current_user.id)
        .limit(1)
        .execute()
    )
    rows = response.data if isinstance(response.data, list) else [response.data]
    profile = rows[0] if rows and rows[0] else None

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found.",
        )

    return UserProfile(**profile)


app.include_router(auth_router)
app.include_router(asha_router)
app.include_router(doctor_router)
app.include_router(mother_router)
