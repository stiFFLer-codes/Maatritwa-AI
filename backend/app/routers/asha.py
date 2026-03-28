from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, Request, status
from pydantic import BaseModel, Field
from supabase import Client

from ..auth import CurrentUser, require_role
from ..db import get_supabase
from ..ml import EclampsiaPredictor, RiskPredictor


class PatientCreateRequest(BaseModel):
    mother_id: str | None = None
    name: str = Field(min_length=1, max_length=120)
    age: int = Field(ge=10, le=60)
    weeks_pregnant: int = Field(ge=1, le=45)
    village: str = Field(min_length=1, max_length=120)
    height_cm: float | None = Field(None, ge=120, le=220)
    blood_group: str | None = None
    lmp_date: str | None = None
    edd_date: str | None = None
    expected_del_wks: int | None = None
    parity: int | None = None
    gravida: int | None = None
    diabetic_history: bool = False
    veg_nonveg: str | None = None
    has_addiction: bool = False
    addiction_notes: str | None = None


class PatientResponse(BaseModel):
    id: str
    asha_id: str
    mother_id: str | None = None
    name: str
    age: int
    weeks_pregnant: int
    village: str
    created_at: str | None = None
    risk_level: str | None = None
    risk_score: float | None = None
    blood_pressure_sys: int | None = None
    blood_pressure_dia: int | None = None
    last_visit_date: str | None = None
    visit_count: int = 0
    risk_assessment_count: int = 0
    pending_referral_count: int = 0


class VisitHistoryItem(BaseModel):
    id: str
    recorded_at: str | None = None
    blood_pressure_sys: int | None = None
    blood_pressure_dia: int | None = None
    hemoglobin: float | None = None
    weight_kg: float | None = None
    pulse_rate: int | None = None
    symptoms: str | None = None
    risk_level: str | None = None
    risk_score: float | None = None


class PatientDetailsResponse(BaseModel):
    patient: PatientResponse
    visits: list[VisitHistoryItem]


class EclampsiaPredictionResponse(BaseModel):
    eligible: bool
    min_visits_required: int
    available_visits: int
    risk_level: str | None = None
    risk_score: float | None = None
    flags: list[str] = []
    model_version: str | None = None
    message: str


class ReferralCreateRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=2000)


class ReferralCreateResponse(BaseModel):
    id: str
    patient_id: str
    asha_id: str
    doctor_id: str | None = None
    status: str
    notes: str | None = None
    referred_at: str | None = None


class VitalsCreateRequest(BaseModel):
    blood_pressure_sys: int = Field(ge=70, le=240)
    blood_pressure_dia: int = Field(ge=40, le=140)
    hemoglobin: float = Field(ge=3, le=25)
    weight_kg: float = Field(ge=25, le=250)
    pulse_rate: int | None = Field(None, ge=40, le=200)
    symptoms: str | None = Field(default=None, max_length=2000)


class VitalsResponse(BaseModel):
    id: str
    patient_id: str
    blood_pressure_sys: int
    blood_pressure_dia: int
    hemoglobin: float
    weight_kg: float
    pulse_rate: int | None = None
    symptoms: str | None = None
    recorded_at: str | None = None


class ExistingVisitCreateRequest(BaseModel):
    recorded_at: datetime | None = None
    weeks_pregnant: int = Field(ge=1, le=45)
    blood_pressure_sys: int = Field(ge=70, le=240)
    blood_pressure_dia: int = Field(ge=40, le=140)
    symptoms: str | None = Field(default=None, max_length=2000)


class ExistingVisitResponse(BaseModel):
    id: str
    patient_id: str
    weeks_pregnant: int
    blood_pressure_sys: int
    blood_pressure_dia: int
    symptoms: str | None = None
    recorded_at: str | None = None


class PredictRiskRequest(BaseModel):
    patient_id: str = Field(min_length=1)
    vitals_id: str | None = None
    blood_pressure_sys: int = Field(ge=70, le=240)
    blood_pressure_dia: int = Field(ge=40, le=140)
    hemoglobin: float = Field(ge=3, le=25)
    weight_kg: float = Field(ge=25, le=250)
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


def _get_eclampsia_predictor(request: Request) -> EclampsiaPredictor:
    predictor = getattr(request.app.state, "eclampsia_predictor", None)
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Eclampsia predictor is not initialized.",
        )
    return predictor


def _symptom_in_text(symptoms_text: str | None, term: str) -> bool:
    if not symptoms_text:
        return False
    return term.lower() in symptoms_text.lower()


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
        "height_cm": payload.height_cm,
        "blood_group": payload.blood_group,
        "lmp_date": payload.lmp_date,
        "edd_date": payload.edd_date,
        "expected_del_wks": payload.expected_del_wks,
        "parity": payload.parity,
        "gravida": payload.gravida,
        "diabetic_history": payload.diabetic_history,
        "veg_nonveg": payload.veg_nonveg,
        "has_addiction": payload.has_addiction,
        "addiction_notes": payload.addiction_notes,
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
    enriched_rows: list[PatientResponse] = []

    for row in rows:
        patient_id = row["id"]

        vitals_response = (
            supabase.table("vitals")
            .select("id, blood_pressure_sys, blood_pressure_dia, recorded_at")
            .eq("patient_id", patient_id)
            .order("recorded_at", desc=True)
            .execute()
        )
        vitals_rows = vitals_response.data if isinstance(vitals_response.data, list) else []
        latest_vitals = vitals_rows[0] if vitals_rows else {}

        risk_response = (
            supabase.table("risk_assessments")
            .select("id, risk_level, risk_score")
            .eq("patient_id", patient_id)
            .order("assessed_at", desc=True)
            .execute()
        )
        risk_rows = risk_response.data if isinstance(risk_response.data, list) else []
        latest_risk = risk_rows[0] if risk_rows else {}

        referral_response = (
            supabase.table("referrals")
            .select("id, status")
            .eq("patient_id", patient_id)
            .in_("status", ["pending", "accepted"])
            .execute()
        )
        referral_rows = referral_response.data if isinstance(referral_response.data, list) else []

        enriched_rows.append(
            PatientResponse(
                **row,
                risk_level=latest_risk.get("risk_level"),
                risk_score=latest_risk.get("risk_score"),
                blood_pressure_sys=latest_vitals.get("blood_pressure_sys"),
                blood_pressure_dia=latest_vitals.get("blood_pressure_dia"),
                last_visit_date=latest_vitals.get("recorded_at"),
                visit_count=len(vitals_rows),
                risk_assessment_count=len(risk_rows),
                pending_referral_count=len(referral_rows),
            )
        )

    return enriched_rows


@asha_router.get("/patients/{patient_id}/details", response_model=PatientDetailsResponse)
def get_patient_details(
    patient_id: str = Path(min_length=1),
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
) -> PatientDetailsResponse:
    patient_response = (
        supabase.table("patients")
        .select("id, asha_id, mother_id, name, age, weeks_pregnant, village, created_at")
        .eq("id", patient_id)
        .eq("asha_id", current_user.id)
        .limit(1)
        .execute()
    )
    patient_row = _single_row(patient_response.data)
    if not patient_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found for this ASHA worker.",
        )

    vitals_response = (
        supabase.table("vitals")
        .select("id, recorded_at, blood_pressure_sys, blood_pressure_dia, hemoglobin, weight_kg, pulse_rate, symptoms")
        .eq("patient_id", patient_id)
        .order("recorded_at", desc=True)
        .execute()
    )
    vitals_rows = vitals_response.data if isinstance(vitals_response.data, list) else []

    risk_response = (
        supabase.table("risk_assessments")
        .select("vitals_id, risk_level, risk_score")
        .eq("patient_id", patient_id)
        .order("assessed_at", desc=True)
        .execute()
    )
    risk_rows = risk_response.data if isinstance(risk_response.data, list) else []
    risk_by_vitals: dict[str, dict] = {}
    for risk_row in risk_rows:
        vitals_id = risk_row.get("vitals_id")
        if isinstance(vitals_id, str) and vitals_id not in risk_by_vitals:
            risk_by_vitals[vitals_id] = risk_row

    visits = [
        VisitHistoryItem(
            id=vital["id"],
            recorded_at=vital.get("recorded_at"),
            blood_pressure_sys=vital.get("blood_pressure_sys"),
            blood_pressure_dia=vital.get("blood_pressure_dia"),
            hemoglobin=vital.get("hemoglobin"),
            weight_kg=vital.get("weight_kg"),
            pulse_rate=vital.get("pulse_rate"),
            symptoms=vital.get("symptoms"),
            risk_level=risk_by_vitals.get(vital["id"], {}).get("risk_level"),
            risk_score=risk_by_vitals.get(vital["id"], {}).get("risk_score"),
        )
        for vital in vitals_rows
    ]

    latest_visit = visits[0] if visits else None
    patient_latest_risk = next((visit for visit in visits if visit.risk_level), None)

    patient = PatientResponse(
        **patient_row,
        risk_level=patient_latest_risk.risk_level if patient_latest_risk else None,
        risk_score=patient_latest_risk.risk_score if patient_latest_risk else None,
        blood_pressure_sys=latest_visit.blood_pressure_sys if latest_visit else None,
        blood_pressure_dia=latest_visit.blood_pressure_dia if latest_visit else None,
        last_visit_date=latest_visit.recorded_at if latest_visit else None,
    )

    return PatientDetailsResponse(patient=patient, visits=visits)


@asha_router.get(
    "/patients/{patient_id}/eclampsia-risk",
    response_model=EclampsiaPredictionResponse,
)
def predict_eclampsia_risk(
    patient_id: str = Path(min_length=1),
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
    predictor: EclampsiaPredictor = Depends(_get_eclampsia_predictor),
) -> EclampsiaPredictionResponse:
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found for this ASHA worker.",
        )

    vitals_response = (
        supabase.table("vitals")
        .select("id, recorded_at, blood_pressure_sys, blood_pressure_dia, symptoms")
        .eq("patient_id", patient_id)
        .order("recorded_at", desc=True)
        .execute()
    )
    vitals_rows = vitals_response.data if isinstance(vitals_response.data, list) else []

    min_required = 3
    available = len(vitals_rows)
    if available < min_required:
        return EclampsiaPredictionResponse(
            eligible=False,
            min_visits_required=min_required,
            available_visits=available,
            message=f"Eclampsia prediction requires at least {min_required} visits.",
        )

    recent_visits = vitals_rows[:3]
    systolics = [float(v.get("blood_pressure_sys") or 0) for v in recent_visits]
    diastolics = [float(v.get("blood_pressure_dia") or 0) for v in recent_visits]

    symptom_headache_count = 0
    symptom_blurred_vision_count = 0
    symptom_swelling_count = 0
    symptom_seizures_count = 0
    severe_bp_visits = 0

    for visit in recent_visits:
        symptoms = visit.get("symptoms")
        if _symptom_in_text(symptoms, "headache"):
            symptom_headache_count += 1
        if _symptom_in_text(symptoms, "blurred vision"):
            symptom_blurred_vision_count += 1
        if _symptom_in_text(symptoms, "swelling"):
            symptom_swelling_count += 1
        if _symptom_in_text(symptoms, "seizure"):
            symptom_seizures_count += 1

        sys_bp = float(visit.get("blood_pressure_sys") or 0)
        dia_bp = float(visit.get("blood_pressure_dia") or 0)
        if sys_bp >= 160 or dia_bp >= 110:
            severe_bp_visits += 1

    feature_values = {
        "avg_systolic_bp": sum(systolics) / len(systolics),
        "avg_diastolic_bp": sum(diastolics) / len(diastolics),
        "bp_rise_sys": max(0.0, systolics[0] - systolics[-1]),
        "bp_rise_dia": max(0.0, diastolics[0] - diastolics[-1]),
        "symptom_headache_count": float(symptom_headache_count),
        "symptom_blurred_vision_count": float(symptom_blurred_vision_count),
        "symptom_swelling_count": float(symptom_swelling_count),
        "symptom_seizures_count": float(symptom_seizures_count),
        "severe_bp_visits": float(severe_bp_visits),
    }

    risk_level, risk_score, flags = predictor.predict(feature_values)

    return EclampsiaPredictionResponse(
        eligible=True,
        min_visits_required=min_required,
        available_visits=available,
        risk_level=risk_level,
        risk_score=risk_score,
        flags=flags,
        model_version=predictor.model_version,
        message="Prediction generated successfully.",
    )


@asha_router.post("/referrals", response_model=ReferralCreateResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    payload: ReferralCreateRequest,
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
) -> ReferralCreateResponse:
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found for this ASHA worker.",
        )

    doctor_response = (
        supabase.table("users")
        .select("id")
        .eq("role", "doctor")
        .limit(1)
        .execute()
    )
    doctor_row = _single_row(doctor_response.data)
    doctor_id = doctor_row.get("id") if doctor_row else None
    if not isinstance(doctor_id, str) or not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No doctor account found to assign referral.",
        )

    insert_payload = {
        "patient_id": payload.patient_id,
        "asha_id": current_user.id,
        "doctor_id": doctor_id,
        "status": "pending",
        "notes": payload.notes,
    }

    referral_response = (
        supabase.table("referrals")
        .insert(insert_payload)
        .execute()
    )
    referral_row = _single_row(referral_response.data)

    if not referral_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create referral.",
        )

    return ReferralCreateResponse(**referral_row)


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
        "pulse_rate": payload.pulse_rate,
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


@asha_router.post(
    "/patients/{patient_id}/visits",
    response_model=ExistingVisitResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_existing_patient_visit(
    payload: ExistingVisitCreateRequest,
    patient_id: str = Path(min_length=1),
    current_user: CurrentUser = Depends(require_role("asha")),
    supabase: Client = Depends(get_supabase),
) -> ExistingVisitResponse:
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

    update_response = (
        supabase.table("patients")
        .update({"weeks_pregnant": payload.weeks_pregnant})
        .eq("id", patient_id)
        .eq("asha_id", current_user.id)
        .execute()
    )
    if update_response.data is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update patient gestation week.",
        )

    insert_payload = {
        "patient_id": patient_id,
        "blood_pressure_sys": payload.blood_pressure_sys,
        "blood_pressure_dia": payload.blood_pressure_dia,
        "symptoms": payload.symptoms,
    }
    if payload.recorded_at:
        insert_payload["recorded_at"] = payload.recorded_at.isoformat()

    visit_response = (
        supabase.table("vitals")
        .insert(insert_payload)
        .execute()
    )
    visit_row = _single_row(visit_response.data)
    if not visit_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit visit record.",
        )

    return ExistingVisitResponse(
        id=visit_row["id"],
        patient_id=visit_row["patient_id"],
        weeks_pregnant=payload.weeks_pregnant,
        blood_pressure_sys=visit_row["blood_pressure_sys"],
        blood_pressure_dia=visit_row["blood_pressure_dia"],
        symptoms=visit_row.get("symptoms"),
        recorded_at=visit_row.get("recorded_at"),
    )


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

    RISK_MAP = {
        "low": "safe",
        "medium": "monitor",
        "high": "critical"
    }
    mapped_risk_level = RISK_MAP.get(risk_level.lower(), "insufficient_data")

    insert_payload = {
        "patient_id": payload.patient_id,
        "vitals_id": payload.vitals_id,
        "risk_level": mapped_risk_level,
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
