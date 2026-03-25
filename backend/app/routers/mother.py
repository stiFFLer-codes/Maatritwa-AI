from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import Client

from ..auth import CurrentUser, require_role
from ..db import get_supabase


mother_router = APIRouter(prefix="/mother", tags=["mother"])


class MotherPatientProfile(BaseModel):
    id: str
    asha_id: str
    mother_id: str | None = None
    name: str
    age: int
    weeks_pregnant: int
    village: str
    created_at: str | None = None


class MotherVitalsResponse(BaseModel):
    id: str
    patient_id: str
    blood_pressure_sys: int
    blood_pressure_dia: int
    hemoglobin: float
    weight_kg: float
    symptoms: str | None = None
    recorded_at: str | None = None


class MotherRiskResponse(BaseModel):
    id: str
    patient_id: str
    vitals_id: str | None = None
    risk_level: str
    risk_score: float
    flags: list[str]
    model_version: str
    assessed_at: str | None = None


def _single_row(data: object) -> dict:
    if isinstance(data, list):
        return data[0] if data else {}
    if isinstance(data, dict):
        return data
    return {}


def _get_mother_patient(supabase: Client, mother_id: str) -> dict:
    response = (
        supabase.table("patients")
        .select("id, asha_id, mother_id, name, age, weeks_pregnant, village, created_at")
        .eq("mother_id", mother_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    row = _single_row(response.data)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient profile found for this mother account.",
        )
    return row


@mother_router.get("/profile", response_model=MotherPatientProfile)
def get_mother_profile(
    current_user: CurrentUser = Depends(require_role("mother")),
    supabase: Client = Depends(get_supabase),
) -> MotherPatientProfile:
    patient_row = _get_mother_patient(supabase, current_user.id)
    return MotherPatientProfile(**patient_row)


@mother_router.get("/vitals", response_model=list[MotherVitalsResponse])
def get_mother_vitals(
    current_user: CurrentUser = Depends(require_role("mother")),
    supabase: Client = Depends(get_supabase),
) -> list[MotherVitalsResponse]:
    patient_row = _get_mother_patient(supabase, current_user.id)

    response = (
        supabase.table("vitals")
        .select("id, patient_id, blood_pressure_sys, blood_pressure_dia, hemoglobin, weight_kg, symptoms, recorded_at")
        .eq("patient_id", patient_row["id"])
        .order("recorded_at", desc=True)
        .execute()
    )
    rows = response.data if isinstance(response.data, list) else []
    return [MotherVitalsResponse(**row) for row in rows]


@mother_router.get("/risk", response_model=MotherRiskResponse)
def get_mother_latest_risk(
    current_user: CurrentUser = Depends(require_role("mother")),
    supabase: Client = Depends(get_supabase),
) -> MotherRiskResponse:
    patient_row = _get_mother_patient(supabase, current_user.id)

    response = (
        supabase.table("risk_assessments")
        .select("id, patient_id, vitals_id, risk_level, risk_score, flags, model_version, assessed_at")
        .eq("patient_id", patient_row["id"])
        .order("assessed_at", desc=True)
        .limit(1)
        .execute()
    )
    row = _single_row(response.data)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No risk assessment found for this mother profile.",
        )

    return MotherRiskResponse(**row)
