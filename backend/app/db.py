import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, status
from supabase import Client, create_client

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)


@lru_cache
def get_supabase() -> Client:
    """Return a singleton Supabase client configured with service role key."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase environment variables are not configured.",
        )

    return create_client(supabase_url, supabase_service_key)


@lru_cache
def get_supabase_jwt_secret() -> str:
    """Return the JWT secret used to verify Supabase access tokens."""
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured.",
        )
    return secret

import os
print(os.getenv("SUPABASE_URL"))