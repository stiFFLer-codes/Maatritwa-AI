from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from pydantic import BaseModel, Field
from supabase import Client

from ..auth import CurrentUser, require_role
from ..db import get_supabase
from ..ml import RiskPredictor


class PatientCreateRequest(BaseModel):
    mother_id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    age: int = Field(ge=10, le=60)
    weeks_pregnant: int = Field(ge=1, le=45)
    village: str = Field(min_length=1, max_length=120)


class PatientResponse(BaseModel):
    id: str
    asha_id: str
    mother_id: str | None = None
    name: str
    age: int
    weeks_pregnant: int
    village: str
    created_at: str | None = None


class VitalsCreateRequest(BaseModel):
    blood_pressure_sys: int = Field(ge=50, le=300)
    blood_pressure_dia: int = Field(ge=30, le=200)
    hemoglobin: float = Field(ge=0, le=30)
    weight_kg: float = Field(ge=10, le=300)
    symptoms: str | None = Field(default=None, max_length=2000)


class VitalsResponse(BaseModel):
    id: str
    patient_id: str
    blood_pressure_sys: int
    blood_pressure_dia: int
    hemoglobin: float
    weight_kg: float
    symptoms: str | None = None
    recorded_at: str | None = None


class PredictRiskRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    vitals_id: str | None = None
    blood_pressure_sys: int = Field(ge=50, le=300)
    blood_pressure_dia: int = Field(ge=30, le=200)
    hemoglobin: float = Field(ge=0, le=30)
    weight_kg: float = Field(ge=10, le=300)
    weeks_pregnant: int = Field(ge=1, le=45)
    age: int = Field(ge=10, le=60)


class RiskAssessmentResponse(BaseModel):
    id: str
    patient_id: str
    vitals_id: str | None = None
    risk_level: str
    risk_score: float
    flags: list[str]
    model_version: str
    assessed_at: str | None = None


asha_router = APIRouter(prefix="/asha", tags=["asha"])


def _single_row(data: object) -> dict:
    if isinstance(data, list):
        return data[0] if data else {}
    if isinstance(data, dict):
        return data
    return {}


def _get_risk_predictor(request: Request) -> RiskPredictor:
    predictor = getattr(request.app.state, "risk_predictor", None)
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Risk predictor is not initialized.",
        )
    return predictor


@asha_router.post("/patients", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreateRequest,
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
) -> PatientResponse:
    insert_payload = {
        "asha_id": current_user.id,
        "mother_id": payload.mother_id,
        "name": payload.name,
        "age": payload.age,
        "weeks_pregnant": payload.weeks_pregnant,
        "village": payload.village,
    }

    response = (
        supabase.table("patients")
        .insert(insert_payload)
        .execute()
    )
    row = _single_row(response.data)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create patient record.",
        )

    return PatientResponse(**row)


@asha_router.get("/patients", response_model=list[PatientResponse])
def list_asha_patients(
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
) -> list[PatientResponse]:
    response = (
        supabase.table("patients")
        .select("id, asha_id, mother_id, name, age, weeks_pregnant, village, created_at")
        .eq("asha_id", current_user.id)
        .order("created_at", desc=True)
        .execute()
    )

    rows = response.data if isinstance(response.data, list) else []
    return [PatientResponse(**row) for row in rows]


@asha_router.post("/patients/{patient_id}/vitals", response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
def submit_vitals(
    payload: VitalsCreateRequest,
    patient_id: str = Path(min_length=1),
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
) -> VitalsResponse:
    patient_response = (
        supabase.table("patients")
        .select("id, asha_id")
        .eq("id", patient_id)
        .eq("asha_id", current_user.id)
        .limit(1)
        .execute()
    )
    owned_patient = _single_row(patient_response.data)

    if not owned_patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The provided patient_id does not belong to the current ASHA.",
        )

    insert_payload = {
        "patient_id": patient_id,
        "blood_pressure_sys": payload.blood_pressure_sys,
        "blood_pressure_dia": payload.blood_pressure_dia,
        "hemoglobin": payload.hemoglobin,
        "weight_kg": payload.weight_kg,
        "symptoms": payload.symptoms,
    }

    vitals_response = (
        supabase.table("vitals")
        .insert(insert_payload)
        .execute()
    )
    vitals_row = _single_row(vitals_response.data)

    if not vitals_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit vitals reading.",
        )

    return VitalsResponse(**vitals_row)


@asha_router.post("/predict", response_model=RiskAssessmentResponse, status_code=status.HTTP_201_CREATED)
def predict_risk(
    payload: PredictRiskRequest,
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
    predictor: RiskPredictor = Depends(_get_risk_predictor),
) -> RiskAssessmentResponse:
    patient_response = (
        supabase.table("patients")
        .select("id, asha_id")
        .eq("id", payload.patient_id)
        .eq("asha_id", current_user.id)
        .limit(1)
        .execute()
    )
    owned_patient = _single_row(patient_response.data)

    if not owned_patient:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The provided patient_id does not belong to the current ASHA.",
        )

    if payload.vitals_id:
        vitals_response = (
            supabase.table("vitals")
            .select("id, patient_id")
            .eq("id", payload.vitals_id)
            .eq("patient_id", payload.patient_id)
            .limit(1)
            .execute()
        )
        linked_vitals = _single_row(vitals_response.data)
        if not linked_vitals:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The provided vitals_id is invalid for this patient_id.",
            )

    feature_values = {
        "blood_pressure_sys": float(payload.blood_pressure_sys),
        "blood_pressure_dia": float(payload.blood_pressure_dia),
        "hemoglobin": float(payload.hemoglobin),
        "weight_kg": float(payload.weight_kg),
        "weeks_pregnant": float(payload.weeks_pregnant),
        "age": float(payload.age),
    }

    risk_level, risk_score, flags = predictor.predict(feature_values)

    insert_payload = {
        "patient_id": payload.patient_id,
        "vitals_id": payload.vitals_id,
        "risk_level": risk_level,
        "risk_score": float(risk_score),
        "flags": flags,
        "model_version": predictor.model_version,
    }

    assessment_response = (
        supabase.table("risk_assessments")
        .insert(insert_payload)
        .execute()
    )
    assessment_row = _single_row(assessment_response.data)

    if not assessment_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save risk assessment.",
        )

    return RiskAssessmentResponse(**assessment_row)
