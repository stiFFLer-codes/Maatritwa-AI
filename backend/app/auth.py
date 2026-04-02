import os
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import Client

from .db import get_supabase

security = HTTPBearer(auto_error=False)

# ── Development auth bypass ───────────────────────────────────────────────────
# This project ships with real authentication OFF. Every request is served as a
# fixed demo user for whichever role the endpoint asks for, so the dashboards can
# be driven without a login flow. It was built this way for a demo deadline and
# never reverted.
#
# DEV_AUTH=0 re-enables real Supabase token verification below. That path is
# preserved but has not been exercised since March 2026 — treat it as untested.
#
# Do not deploy with DEV_AUTH on. It is an unauthenticated read/write API.
DEV_AUTH = os.getenv("DEV_AUTH", "1") == "1"

# Fixed UUIDs so seeded rows keep matching across restarts (see backend/seed_data.py).
DEV_USER_IDS = {
    "asha": "550e8400-e29b-41d4-a716-446655440000",
    "mother": "550e8400-e29b-41d4-a716-446655440001",
    "doctor": "550e8400-e29b-41d4-a716-446655440002",
}


class CurrentUser(BaseModel):
    id: str
    role: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


def _decode_access_token(token: str, supabase: Client) -> dict[str, Any]:
    try:
        response = supabase.auth.get_user(token)
        user = getattr(response, "user", None)
        if user is None and isinstance(response, dict):
            user = response.get("user")
        if hasattr(user, "model_dump"):
            payload = user.model_dump()
        elif isinstance(user, dict):
            payload = user
        else:
            payload = {}
        if not payload or not payload.get("id"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token.",
            )
        payload["sub"] = payload.get("id")
        payload["app_metadata"] = payload.get("app_metadata") or {}
        payload["user_metadata"] = payload.get("user_metadata") or {}
        return payload
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc


def _extract_role(payload: dict[str, Any]) -> Optional[str]:
    app_metadata = payload.get("app_metadata") or {}
    user_metadata = payload.get("user_metadata") or {}
    role = app_metadata.get("role") or user_metadata.get("role")
    if role in {"asha", "mother", "doctor"}:
        return role
    return None


def _single_payload(data: Any) -> dict[str, Any]:
    if isinstance(data, list):
        return data[0] if data else {}
    if isinstance(data, dict):
        return data
    return {}


def _ensure_user_row(supabase: Client, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    role = _extract_role(payload)

    existing = (
        supabase.table("users")
        .select("id, role, name, email, phone")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    current_row = _single_payload(existing.data)
    if current_row:
        return current_row

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role not found. Set app_metadata.role (asha/mother/doctor) or create row in public.users.",
        )

    user_metadata = payload.get("user_metadata") or {}
    insert_payload = {
        "id": user_id,
        "role": role,
        "name": user_metadata.get("name") or payload.get("name") or None,
        "email": payload.get("email") or user_metadata.get("email"),
        "phone": user_metadata.get("phone") or payload.get("phone"),
    }

    inserted = (
        supabase.table("users")
        .insert(insert_payload)
        .execute()
    )
    created_row = _single_payload(inserted.data)

    if not created_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user profile.",
        )

    return created_row


def _get_default_asha_user_id(supabase: Client) -> Optional[str]:
    profile_response = (
        supabase.table("asha_profiles")
        .select("user_id")
        .limit(1)
        .execute()
    )
    profile_row = _single_payload(profile_response.data)
    user_id = profile_row.get("user_id") if profile_row else None
    if isinstance(user_id, str) and user_id:
        return user_id

    users_response = (
        supabase.table("users")
        .select("id")
        .eq("role", "asha")
        .limit(1)
        .execute()
    )
    user_row = _single_payload(users_response.data)
    fallback_id = user_row.get("id") if user_row else None
    if isinstance(fallback_id, str) and fallback_id:
        return fallback_id

    return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase),
) -> CurrentUser:
    if DEV_AUTH:
        return CurrentUser(id=DEV_USER_IDS["asha"], role="asha")

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    payload = _decode_access_token(credentials.credentials, supabase)
    row = _ensure_user_row(supabase, payload["sub"], payload)
    return CurrentUser(**row)


def require_role(required_role: str):
    def role_dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        # With DEV_AUTH on there is no login, so get_current_user always returns the
        # ASHA demo user. Hand back the demo user for whichever role was asked for
        # instead — otherwise every mother and doctor endpoint 403s permanently.
        if DEV_AUTH:
            if required_role not in DEV_USER_IDS:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Unknown role '{required_role}'.",
                )
            return CurrentUser(id=DEV_USER_IDS[required_role], role=required_role)

        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required.",
            )
        return current_user

    return role_dependency
