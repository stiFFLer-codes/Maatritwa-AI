import logging
import os
import pickle
from pathlib import Path
from typing import Any

FEATURE_ORDER = [
    "blood_pressure_sys",
    "blood_pressure_dia",
    "hemoglobin",
    "weight_kg",
    "weeks_pregnant",
    "age",
]

LABEL_MAP = {
    0: "low",
    1: "medium",
    2: "high",
    "0": "low",
    "1": "medium",
    "2": "high",
    "low": "low",
    "medium": "medium",
    "high": "high",
    "normal": "low",
    "mild pre-eclampsia": "medium",
    "severe pre- eclampsia": "high",
    "severe pre-eclampsia": "high",
}

logger = logging.getLogger(__name__)


class RiskPredictor:
    def __init__(self, model: Any | None, model_version: str, using_fallback: bool):
        self.model = model
        self.model_version = model_version
        self.using_fallback = using_fallback

    @classmethod
    def from_env(cls) -> "RiskPredictor":
        model_path = Path(os.getenv("RISK_MODEL_PATH", "backend/model/risk_model.pkl"))
        model_version = os.getenv("RISK_MODEL_VERSION", "decision-tree-v1")

        if not model_path.exists():
            logger.warning(
                "Risk model file not found at %s. Falling back to rule-based logic.",
                model_path,
            )
            return cls(model=None, model_version=f"{model_version}-fallback", using_fallback=True)

        try:
            with model_path.open("rb") as model_file:
                model = pickle.load(model_file)
            logger.info("Risk model loaded from %s", model_path)
            return cls(model=model, model_version=model_version, using_fallback=False)
        except Exception as exc:
            logger.warning(
                "Failed to load risk model from %s (%s). Falling back to rule-based logic.",
                model_path,
                exc,
            )
            return cls(model=None, model_version=f"{model_version}-fallback", using_fallback=True)

    def predict(self, feature_values: dict[str, float]) -> tuple[str, float, list[str]]:
        flags = _compute_flags(feature_values)

        if self.model is None:
            return _rule_based_prediction(feature_values, flags)

        vector = [[float(feature_values[name]) for name in FEATURE_ORDER]]

        raw_label = self.model.predict(vector)[0]
        risk_level = _normalize_risk_label(raw_label)

        risk_score = 0.5
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(vector)[0]
            classes = getattr(self.model, "classes_", None)
            if classes is not None:
                matched_index = None
                for idx, cls_label in enumerate(classes):
                    if _normalize_risk_label(cls_label) == risk_level:
                        matched_index = idx
                        break
                if matched_index is not None:
                    risk_score = float(probabilities[matched_index])
                else:
                    risk_score = float(max(probabilities))
            else:
                risk_score = float(max(probabilities))

        risk_score = max(0.0, min(1.0, risk_score))

        if "severe_anemia" in flags and risk_level == "low":
            risk_level = "medium"
        if "hypertensive_crisis" in flags:
            risk_level = "high"

        return risk_level, risk_score, flags


def _normalize_risk_label(raw: Any) -> str:
    key = str(raw).strip().lower()
    return LABEL_MAP.get(raw, LABEL_MAP.get(key, "medium"))


def _compute_flags(feature_values: dict[str, float]) -> list[str]:
    flags: list[str] = []

    sys_bp = feature_values["blood_pressure_sys"]
    dia_bp = feature_values["blood_pressure_dia"]
    hb = feature_values["hemoglobin"]
    weight = feature_values["weight_kg"]
    age = feature_values["age"]
    weeks = feature_values["weeks_pregnant"]

    if sys_bp >= 160 or dia_bp >= 110:
        flags.append("hypertensive_crisis")
    elif sys_bp >= 140 or dia_bp >= 90:
        flags.append("high_bp")

    if hb < 7:
        flags.append("severe_anemia")
    elif hb < 11:
        flags.append("anemia")

    if weight < 45:
        flags.append("low_weight")

    if age < 19:
        flags.append("teen_pregnancy")
    elif age >= 35:
        flags.append("advanced_maternal_age")

    if weeks > 40:
        flags.append("post_term")

    return flags


def _rule_based_prediction(feature_values: dict[str, float], flags: list[str]) -> tuple[str, float, list[str]]:
    sys_bp = feature_values["blood_pressure_sys"]
    dia_bp = feature_values["blood_pressure_dia"]
    hb = feature_values["hemoglobin"]

    if sys_bp >= 160 or dia_bp >= 110 or hb < 7:
        return "high", 0.9, flags

    if sys_bp >= 140 or dia_bp >= 90 or hb < 9:
        return "medium", 0.7, flags

    if flags:
        return "medium", 0.6, flags

    return "low", 0.25, flags
