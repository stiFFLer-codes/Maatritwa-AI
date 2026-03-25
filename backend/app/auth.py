from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from supabase import Client

from .db import get_supabase

security = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    id: str
    role: str
    name: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None


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
        .select("id, role, name, phone, language")
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
        "name": user_metadata.get("name") or payload.get("name"),
        "phone": user_metadata.get("phone") or payload.get("phone"),
        "language": user_metadata.get("language") or "hi",
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


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase: Client = Depends(get_supabase),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )

    payload = _decode_access_token(credentials.credentials, supabase)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim.",
        )

    user_row = _ensure_user_row(supabase, user_id, payload)

    return CurrentUser(
        id=user_id,
        role=user_row.get("role") or _extract_role(payload) or "",
        name=user_row.get("name"),
        phone=user_row.get("phone"),
        language=user_row.get("language"),
    )


def require_role(required_role: str):
    def role_dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required.",
            )
        return current_user

    return role_dependency
