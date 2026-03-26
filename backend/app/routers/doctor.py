from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, Field
from supabase import Client

from ..auth import CurrentUser, require_role
from ..db import get_supabase


doctor_router = APIRouter(prefix="/doctor", tags=["doctor"])


class ReferralListItem(BaseModel):
    id: str
    patient_id: str
    asha_id: str
    doctor_id: str
    assessment_id: str | None = None
    status: str
    notes: str | None = None
    referred_at: str | None = None
    resolved_at: str | None = None
    patient_name: str | None = None
    latest_risk_level: str | None = None


class PatientInfo(BaseModel):
    id: str
    asha_id: str
    mother_id: str | None = None
    name: str
    age: int
    weeks_pregnant: int
    village: str
    created_at: str | None = None


class VitalsInfo(BaseModel):
    id: str
    patient_id: str
    blood_pressure_sys: int
    blood_pressure_dia: int
    hemoglobin: float
    weight_kg: float
    symptoms: str | None = None
    recorded_at: str | None = None


class RiskAssessmentInfo(BaseModel):
    id: str
    patient_id: str
    vitals_id: str | None = None
    risk_level: str
    risk_score: float
    flags: list[str]
    model_version: str
    assessed_at: str | None = None


class ReferralDetailResponse(BaseModel):
    referral: ReferralListItem
    patient: PatientInfo
    vitals_history: list[VitalsInfo]
    risk_assessments: list[RiskAssessmentInfo]


class ReferralStatusUpdateRequest(BaseModel):
    status: str = Field(pattern="^(accepted|resolved)$")
    notes: str | None = Field(default=None, max_length=2000)


class ReferralStatusResponse(BaseModel):
    id: str
    status: str
    notes: str | None = None
    resolved_at: str | None = None


def _single_row(data: object) -> dict:
    if isinstance(data, list):
        return data[0] if data else {}
    if isinstance(data, dict):
        return data
    return {}


def _ensure_doctor_referral(supabase: Client, referral_id: str, doctor_id: str) -> dict:
    response = (
        supabase.table("referrals")
        .select("id, patient_id, asha_id, doctor_id, assessment_id, status, notes, referred_at, resolved_at")
        .eq("id", referral_id)
        .eq("doctor_id", doctor_id)
        .limit(1)
        .execute()
    )
    row = _single_row(response.data)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found for this doctor.",
        )
    return row


@doctor_router.get("/referrals", response_model=list[ReferralListItem])
def list_doctor_referrals(
# current_user: CurrentUser = Depends(require_role("doctor")),  # Auth disabled
    supabase: Client = Depends(get_supabase),
) -> list[ReferralListItem]:
    response = (
        supabase.table("referrals")
        .select("id, patient_id, asha_id, doctor_id, assessment_id, status, notes, referred_at, resolved_at")
        .eq("doctor_id", current_user.id)
        .order("referred_at", desc=True)
        .execute()
    )

    rows = response.data if isinstance(response.data, list) else []
    result: list[ReferralListItem] = []

    for row in rows:
        patient_id = row.get("patient_id")

        patient_name = None
        latest_risk_level = None

        if patient_id:
            patient_res = (
                supabase.table("patients")
                .select("name")
                .eq("id", patient_id)
                .limit(1)
                .execute()
            )
            patient_row = _single_row(patient_res.data)
            patient_name = patient_row.get("name")

            risk_res = (
                supabase.table("risk_assessments")
                .select("risk_level")
                .eq("patient_id", patient_id)
                .order("assessed_at", desc=True)
                .limit(1)
                .execute()
            )
            risk_row = _single_row(risk_res.data)
            latest_risk_level = risk_row.get("risk_level")

        result.append(
            ReferralListItem(
                **row,
                patient_name=patient_name,
                latest_risk_level=latest_risk_level,
            )
        )

    return result


@doctor_router.get("/referrals/{referral_id}", response_model=ReferralDetailResponse)
def get_referral_detail(
    referral_id: str = Path(min_length=1),
    current_user: CurrentUser = Depends(require_role("doctor")),
    supabase: Client = Depends(get_supabase),
) -> ReferralDetailResponse:
    referral_row = _ensure_doctor_referral(supabase, referral_id, current_user.id)

    patient_res = (
        supabase.table("patients")
        .select("id, asha_id, mother_id, name, age, weeks_pregnant, village, created_at")
        .eq("id", referral_row["patient_id"])
        .limit(1)
        .execute()
    )
    patient_row = _single_row(patient_res.data)
    if not patient_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient linked to referral was not found.",
        )

    vitals_res = (
        supabase.table("vitals")
        .select("id, patient_id, blood_pressure_sys, blood_pressure_dia, hemoglobin, weight_kg, symptoms, recorded_at")
        .eq("patient_id", referral_row["patient_id"])
        .order("recorded_at", desc=True)
        .execute()
    )
    vitals_rows = vitals_res.data if isinstance(vitals_res.data, list) else []

    risk_res = (
        supabase.table("risk_assessments")
        .select("id, patient_id, vitals_id, risk_level, risk_score, flags, model_version, assessed_at")
        .eq("patient_id", referral_row["patient_id"])
        .order("assessed_at", desc=True)
        .execute()
    )
    risk_rows = risk_res.data if isinstance(risk_res.data, list) else []

    enriched_referral = ReferralListItem(
        **referral_row,
        patient_name=patient_row.get("name"),
        latest_risk_level=(risk_rows[0].get("risk_level") if risk_rows else None),
    )

    return ReferralDetailResponse(
        referral=enriched_referral,
        patient=PatientInfo(**patient_row),
        vitals_history=[VitalsInfo(**row) for row in vitals_rows],
        risk_assessments=[RiskAssessmentInfo(**row) for row in risk_rows],
    )


@doctor_router.patch("/referrals/{referral_id}/status", response_model=ReferralStatusResponse)
def update_referral_status(
    payload: ReferralStatusUpdateRequest,
    referral_id: str = Path(min_length=1),
    current_user: CurrentUser = Depends(require_role("doctor")),
    supabase: Client = Depends(get_supabase),
) -> ReferralStatusResponse:
    _ensure_doctor_referral(supabase, referral_id, current_user.id)

    update_payload = {"status": payload.status}

    if payload.notes is not None:
        update_payload["notes"] = payload.notes

    if payload.status == "resolved":
        update_payload["resolved_at"] = datetime.now(timezone.utc).isoformat()
    else:
        update_payload["resolved_at"] = None

    response = (
        supabase.table("referrals")
        .update(update_payload)
        .eq("id", referral_id)
        .eq("doctor_id", current_user.id)
        .execute()
    )
    row = _single_row(response.data)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update referral status.",
        )

    return ReferralStatusResponse(
        id=row["id"],
        status=row["status"],
        notes=row.get("notes"),
        resolved_at=row.get("resolved_at"),
    )
