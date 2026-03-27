from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel, Field
from supabase import Client

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
    patient_age: int | None = None
    weeks_pregnant: int | None = None
    village: str | None = None
    gravida: int | None = None
    parity: int | None = None
    diabetic_history: bool | None = None
    latest_bp_sys: int | None = None
    latest_bp_dia: int | None = None
    latest_hemoglobin: float | None = None
    latest_weight_kg: float | None = None
    latest_symptoms: str | None = None
    last_visit_date: str | None = None
    visit_count: int = 0


class PatientInfo(BaseModel):
    id: str
    asha_id: str
    mother_id: str | None = None
    name: str
    age: int
    weeks_pregnant: int
    village: str
    gravida: int | None = None
    parity: int | None = None
    diabetic_history: bool | None = None
    height_cm: float | None = None
    created_at: str | None = None


class VitalsInfo(BaseModel):
    id: str
    patient_id: str
    blood_pressure_sys: int | None = None
    blood_pressure_dia: int | None = None
    hemoglobin: float | None = None
    weight_kg: float | None = None
    symptoms: str | None = None
    recorded_at: str | None = None


class ClinicalLabsInfo(BaseModel):
    id: str | None = None
    patient_id: str
    sgot: float | None = None
    sgpt: float | None = None
    platelet_count: float | None = None
    serum_creatinine: float | None = None
    proteinuria: str | None = None
    edema: str | None = None
    epigastric_pain: bool | None = None
    seizures: bool | None = None
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
    latest_vitals: VitalsInfo | None = None
    clinical_labs: ClinicalLabsInfo | None = None
    vitals_history: list[VitalsInfo]
    risk_assessments: list[RiskAssessmentInfo]


class ReferralStatusUpdateRequest(BaseModel):
    status: str | None = Field(default=None, pattern="^(pending|accepted|resolved)$")
    notes: str | None = Field(default=None, max_length=2000)


class ReferralStatusResponse(BaseModel):
    id: str
    status: str
    notes: str | None = None
    resolved_at: str | None = None


class PatientLabsUpsertRequest(BaseModel):
    sgot: float | None = None
    sgpt: float | None = None
    platelet_count: float | None = None
    serum_creatinine: float | None = None
    proteinuria: str | None = None
    edema: str | None = None
    epigastric_pain: bool | None = None
    seizures: bool | None = None


class PatientLabsUpsertResponse(BaseModel):
    id: str
    patient_id: str
    sgot: float | None = None
    sgpt: float | None = None
    platelet_count: float | None = None
    serum_creatinine: float | None = None
    proteinuria: str | None = None
    edema: str | None = None
    epigastric_pain: bool | None = None
    seizures: bool | None = None
    recorded_at: str | None = None


def _single_row(data: object) -> dict:
    if isinstance(data, list):
        return data[0] if data else {}
    if isinstance(data, dict):
        return data
    return {}


def _normalize_risk_level(level: str | None) -> str | None:
    if not level:
        return None
    normalized = level.strip().lower()
    if normalized == "critical":
        return "critical"
    if normalized in {"high", "elevated"}:
        return "elevated"
    if normalized in {"medium", "moderate", "monitor"}:
        return "monitor"
    if normalized in {"low", "safe"}:
        return "safe"
    return normalized


def _get_default_doctor_id(supabase: Client) -> str:
    doctor_res = (
        supabase.table("users")
        .select("id")
        .eq("role", "doctor")
        .order("created_at")
        .limit(1)
        .execute()
    )
    doctor_row = _single_row(doctor_res.data)
    doctor_id = doctor_row.get("id")
    if not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No doctor user exists in the system.",
        )
    return doctor_id


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
    supabase: Client = Depends(get_supabase),
) -> list[ReferralListItem]:
    doctor_id = _get_default_doctor_id(supabase)
    response = (
        supabase.table("referrals")
        .select("id, patient_id, asha_id, doctor_id, assessment_id, status, notes, referred_at, resolved_at")
        .eq("doctor_id", doctor_id)
        .order("referred_at", desc=True)
        .execute()
    )

    rows = response.data if isinstance(response.data, list) else []
    result: list[ReferralListItem] = []

    for row in rows:
        patient_id = row.get("patient_id")

        patient_name = None
        latest_risk_level = None
        patient_age = None
        weeks_pregnant = None
        village = None
        gravida = None
        parity = None
        diabetic_history = None
        latest_bp_sys = None
        latest_bp_dia = None
        latest_hemoglobin = None
        latest_weight_kg = None
        latest_symptoms = None
        last_visit_date = None
        visit_count = 0

        if patient_id:
            patient_res = (
                supabase.table("patients")
                .select("name, age, weeks_pregnant, village, gravida, parity, diabetic_history")
                .eq("id", patient_id)
                .limit(1)
                .execute()
            )
            patient_row = _single_row(patient_res.data)
            patient_name = patient_row.get("name")
            patient_age = patient_row.get("age")
            weeks_pregnant = patient_row.get("weeks_pregnant")
            village = patient_row.get("village")
            gravida = patient_row.get("gravida")
            parity = patient_row.get("parity")
            diabetic_history = patient_row.get("diabetic_history")

            latest_vitals_res = (
                supabase.table("vitals")
                .select("blood_pressure_sys, blood_pressure_dia, hemoglobin, weight_kg, symptoms, recorded_at")
                .eq("patient_id", patient_id)
                .order("recorded_at", desc=True)
                .limit(1)
                .execute()
            )
            latest_vitals_row = _single_row(latest_vitals_res.data)
            latest_bp_sys = latest_vitals_row.get("blood_pressure_sys")
            latest_bp_dia = latest_vitals_row.get("blood_pressure_dia")
            latest_hemoglobin = latest_vitals_row.get("hemoglobin")
            latest_weight_kg = latest_vitals_row.get("weight_kg")
            latest_symptoms = latest_vitals_row.get("symptoms")
            last_visit_date = latest_vitals_row.get("recorded_at")

            vitals_count_res = (
                supabase.table("vitals")
                .select("id")
                .eq("patient_id", patient_id)
                .execute()
            )
            vitals_count_rows = vitals_count_res.data if isinstance(vitals_count_res.data, list) else []
            visit_count = len(vitals_count_rows)

            risk_res = (
                supabase.table("risk_assessments")
                .select("risk_level")
                .eq("patient_id", patient_id)
                .order("assessed_at", desc=True)
                .limit(1)
                .execute()
            )
            risk_row = _single_row(risk_res.data)
            latest_risk_level = _normalize_risk_level(risk_row.get("risk_level"))

        result.append(
            ReferralListItem(
                **row,
                patient_name=patient_name,
                latest_risk_level=latest_risk_level,
                patient_age=patient_age,
                weeks_pregnant=weeks_pregnant,
                village=village,
                gravida=gravida,
                parity=parity,
                diabetic_history=diabetic_history,
                latest_bp_sys=latest_bp_sys,
                latest_bp_dia=latest_bp_dia,
                latest_hemoglobin=latest_hemoglobin,
                latest_weight_kg=latest_weight_kg,
                latest_symptoms=latest_symptoms,
                last_visit_date=last_visit_date,
                visit_count=visit_count,
            )
        )

    return result


@doctor_router.get("/referrals/{referral_id}", response_model=ReferralDetailResponse)
def get_referral_detail(
    referral_id: str = Path(min_length=1),
    supabase: Client = Depends(get_supabase),
) -> ReferralDetailResponse:
    doctor_id = _get_default_doctor_id(supabase)
    referral_row = _ensure_doctor_referral(supabase, referral_id, doctor_id)

    patient_res = (
        supabase.table("patients")
        .select("id, asha_id, mother_id, name, age, weeks_pregnant, village, gravida, parity, diabetic_history, height_cm, created_at")
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

    latest_vitals = VitalsInfo(**vitals_rows[0]) if vitals_rows else None

    risk_res = (
        supabase.table("risk_assessments")
        .select("id, patient_id, vitals_id, risk_level, risk_score, flags, model_version, assessed_at")
        .eq("patient_id", referral_row["patient_id"])
        .order("assessed_at", desc=True)
        .execute()
    )
    risk_rows = risk_res.data if isinstance(risk_res.data, list) else []

    labs_row: dict = {}
    try:
        labs_res = (
            supabase.table("clinical_labs")
            .select("id, patient_id, sgot, sgpt, platelet_count, serum_creatinine, proteinuria, edema, epigastric_pain, seizures, recorded_at")
            .eq("patient_id", referral_row["patient_id"])
            .order("recorded_at", desc=True)
            .limit(1)
            .execute()
        )
        labs_row = _single_row(labs_res.data)
    except Exception:
        labs_res = (
            supabase.table("clinical_labs")
            .select("id, patient_id, sgot, sgpt, platelet_count, serum_creatinine, proteinuria, edema, epigastric_pain, recorded_at")
            .eq("patient_id", referral_row["patient_id"])
            .order("recorded_at", desc=True)
            .limit(1)
            .execute()
        )
        labs_row = _single_row(labs_res.data)

    enriched_referral = ReferralListItem(
        **referral_row,
        patient_name=patient_row.get("name"),
        latest_risk_level=(_normalize_risk_level(risk_rows[0].get("risk_level")) if risk_rows else None),
        patient_age=patient_row.get("age"),
        weeks_pregnant=patient_row.get("weeks_pregnant"),
        village=patient_row.get("village"),
        gravida=patient_row.get("gravida"),
        parity=patient_row.get("parity"),
        diabetic_history=patient_row.get("diabetic_history"),
        latest_bp_sys=(vitals_rows[0].get("blood_pressure_sys") if vitals_rows else None),
        latest_bp_dia=(vitals_rows[0].get("blood_pressure_dia") if vitals_rows else None),
        latest_hemoglobin=(vitals_rows[0].get("hemoglobin") if vitals_rows else None),
        latest_weight_kg=(vitals_rows[0].get("weight_kg") if vitals_rows else None),
        latest_symptoms=(vitals_rows[0].get("symptoms") if vitals_rows else None),
        last_visit_date=(vitals_rows[0].get("recorded_at") if vitals_rows else None),
        visit_count=len(vitals_rows),
    )

    return ReferralDetailResponse(
        referral=enriched_referral,
        patient=PatientInfo(**patient_row),
        latest_vitals=latest_vitals,
        clinical_labs=(ClinicalLabsInfo(**labs_row) if labs_row else None),
        vitals_history=[VitalsInfo(**row) for row in vitals_rows],
        risk_assessments=[RiskAssessmentInfo(**row) for row in risk_rows],
    )


@doctor_router.patch("/referrals/{referral_id}/status", response_model=ReferralStatusResponse)
def update_referral_status(
    payload: ReferralStatusUpdateRequest,
    referral_id: str = Path(min_length=1),
    supabase: Client = Depends(get_supabase),
) -> ReferralStatusResponse:
    doctor_id = _get_default_doctor_id(supabase)
    _ensure_doctor_referral(supabase, referral_id, doctor_id)

    if payload.status is None and payload.notes is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update: status or notes.",
        )

    update_payload: dict[str, object] = {}

    if payload.status is not None:
        update_payload["status"] = payload.status

    if payload.notes is not None:
        update_payload["notes"] = payload.notes

    if payload.status == "resolved":
        update_payload["resolved_at"] = datetime.now(timezone.utc).isoformat()
    elif payload.status is not None:
        update_payload["resolved_at"] = None

    response = (
        supabase.table("referrals")
        .update(update_payload)
        .eq("id", referral_id)
        .eq("doctor_id", doctor_id)
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


@doctor_router.post("/patients/{patient_id}/labs", response_model=PatientLabsUpsertResponse)
def upsert_patient_labs(
    payload: PatientLabsUpsertRequest,
    patient_id: str = Path(min_length=1),
    supabase: Client = Depends(get_supabase),
) -> PatientLabsUpsertResponse:
    patient_res = (
        supabase.table("patients")
        .select("id")
        .eq("id", patient_id)
        .limit(1)
        .execute()
    )
    patient_row = _single_row(patient_res.data)
    if not patient_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    existing_res = (
        supabase.table("clinical_labs")
        .select("id")
        .eq("patient_id", patient_id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )
    existing_row = _single_row(existing_res.data)

    base_payload: dict[str, object] = {
        "patient_id": patient_id,
        "sgot": payload.sgot,
        "sgpt": payload.sgpt,
        "platelet_count": payload.platelet_count,
        "serum_creatinine": payload.serum_creatinine,
        "proteinuria": payload.proteinuria,
        "edema": payload.edema,
        "epigastric_pain": payload.epigastric_pain,
        "seizures": payload.seizures,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        if existing_row.get("id"):
            response = (
                supabase.table("clinical_labs")
                .update(base_payload)
                .eq("id", existing_row["id"])
                .execute()
            )
        else:
            response = supabase.table("clinical_labs").insert(base_payload).execute()
    except Exception:
        fallback_payload = {k: v for k, v in base_payload.items() if k != "seizures"}
        if existing_row.get("id"):
            response = (
                supabase.table("clinical_labs")
                .update(fallback_payload)
                .eq("id", existing_row["id"])
                .execute()
            )
        else:
            response = supabase.table("clinical_labs").insert(fallback_payload).execute()

    row = _single_row(response.data)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save patient labs.",
        )

    return PatientLabsUpsertResponse(
        id=row["id"],
        patient_id=row["patient_id"],
        sgot=row.get("sgot"),
        sgpt=row.get("sgpt"),
        platelet_count=row.get("platelet_count"),
        serum_creatinine=row.get("serum_creatinine"),
        proteinuria=row.get("proteinuria"),
        edema=row.get("edema"),
        epigastric_pain=row.get("epigastric_pain"),
        seizures=row.get("seizures"),
        recorded_at=row.get("recorded_at"),
    )


@doctor_router.post("/patients/{patient_id}/refer", response_model=ReferralListItem)
def create_referral_for_patient(
    patient_id: str = Path(min_length=1),
    supabase: Client = Depends(get_supabase),
) -> ReferralListItem:
    doctor_id = _get_default_doctor_id(supabase)

    patient_res = (
        supabase.table("patients")
        .select("id, asha_id, name, age, weeks_pregnant, village, gravida, parity, diabetic_history")
        .eq("id", patient_id)
        .limit(1)
        .execute()
    )
    patient_row = _single_row(patient_res.data)
    if not patient_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found.")

    existing_res = (
        supabase.table("referrals")
        .select("id, patient_id, asha_id, doctor_id, assessment_id, status, notes, referred_at, resolved_at")
        .eq("patient_id", patient_id)
        .eq("doctor_id", doctor_id)
        .order("referred_at", desc=True)
        .limit(1)
        .execute()
    )
    existing_row = _single_row(existing_res.data)

    if existing_row:
        latest_risk_level = None
        risk_res = (
            supabase.table("risk_assessments")
            .select("risk_level")
            .eq("patient_id", patient_id)
            .order("assessed_at", desc=True)
            .limit(1)
            .execute()
        )
        risk_row = _single_row(risk_res.data)
        latest_risk_level = _normalize_risk_level(risk_row.get("risk_level"))
        return ReferralListItem(
            **existing_row,
            patient_name=patient_row.get("name"),
            latest_risk_level=latest_risk_level,
            patient_age=patient_row.get("age"),
            weeks_pregnant=patient_row.get("weeks_pregnant"),
            village=patient_row.get("village"),
            gravida=patient_row.get("gravida"),
            parity=patient_row.get("parity"),
            diabetic_history=patient_row.get("diabetic_history"),
        )

    insert_payload = {
        "patient_id": patient_id,
        "asha_id": patient_row.get("asha_id"),
        "doctor_id": doctor_id,
        "status": "pending",
        "referred_at": datetime.now(timezone.utc).isoformat(),
    }
    create_res = supabase.table("referrals").insert(insert_payload).execute()
    create_row = _single_row(create_res.data)
    if not create_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create referral.",
        )

    return ReferralListItem(
        **create_row,
        patient_name=patient_row.get("name"),
        patient_age=patient_row.get("age"),
        weeks_pregnant=patient_row.get("weeks_pregnant"),
        village=patient_row.get("village"),
        gravida=patient_row.get("gravida"),
        parity=patient_row.get("parity"),
        diabetic_history=patient_row.get("diabetic_history"),
    )
