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
    def __init__(
        self,
        model: Any | None,
        model_version: str,
        using_fallback: bool,
        *,
        model_features: list[str] | None = None,
        label_encoder: Any | None = None,
    ):
        self.model = model
        self.model_version = model_version
        self.using_fallback = using_fallback
        self.model_features = model_features
        self.label_encoder = label_encoder

    @classmethod
    def from_env(cls) -> "RiskPredictor":
        project_root = Path(__file__).resolve().parents[2]
        default_model_path = project_root / "backend" / "app" / "ml_model.pkl"
        model_path = Path(os.getenv("RISK_MODEL_PATH", str(default_model_path)))
        model_version = os.getenv("RISK_MODEL_VERSION", "decision-tree-v1")

        if not model_path.exists():
            logger.warning(
                "Risk model file not found at %s. Falling back to rule-based logic.",
                model_path,
            )
            return cls(
                model=None,
                model_version=f"{model_version}-fallback",
                using_fallback=True,
            )

        try:
            with model_path.open("rb") as model_file:
                loaded = pickle.load(model_file)
                model_features = None
                label_encoder = None

                if isinstance(loaded, dict):
                    model = loaded.get("model")
                    model_features = loaded.get("features")
                    label_encoder = loaded.get("label_encoder")
                else:
                    model = loaded

                if model is None:
                    raise ValueError("Loaded artifact does not contain a valid model object.")
            logger.info("Risk model loaded from %s", model_path)
            return cls(
                model=model,
                model_version=model_version,
                using_fallback=False,
                model_features=model_features,
                label_encoder=label_encoder,
            )
        except Exception as exc:
            logger.warning(
                "Failed to load risk model from %s (%s). Falling back to rule-based logic.",
                model_path,
                exc,
            )
            return cls(
                model=None,
                model_version=f"{model_version}-fallback",
                using_fallback=True,
            )

    def predict(self, feature_values: dict[str, float]) -> tuple[str, float, list[str]]:
        flags = _compute_flags(feature_values)

        if self.model is None:
            return _rule_based_prediction(feature_values, flags)

        vector = [self._build_feature_vector(feature_values)]

        raw_label = self.model.predict(vector)[0]
        decoded_label = self._decode_label(raw_label)
        if decoded_label is not None:
            raw_label = decoded_label
        risk_level = _normalize_risk_label(raw_label)

        risk_score = 0.5
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(vector)[0]
            classes = getattr(self.model, "classes_", None)
            if classes is not None:
                matched_index = None
                for idx, cls_label in enumerate(classes):
                    decoded_cls = self._decode_label(cls_label)
                    if decoded_cls is not None:
                        cls_label = decoded_cls
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

    def _decode_label(self, label: Any) -> Any:
        if self.label_encoder is None:
            return None
        try:
            decoded = self.label_encoder.inverse_transform([int(label)])
            return decoded[0]
        except Exception:
            return None

    def _build_feature_vector(self, feature_values: dict[str, float]) -> list[float]:
        feature_order = self.model_features or FEATURE_ORDER
        return [float(self._get_feature_value(name, feature_values)) for name in feature_order]

    @staticmethod
    def _get_feature_value(name: str, feature_values: dict[str, float]) -> float:
        if name in feature_values:
            return feature_values[name]

        mapped_values = {
            "age": feature_values["age"],
            "gestationalWeeks": feature_values["weeks_pregnant"],
            "systolicBP": feature_values["blood_pressure_sys"],
            "diastolicBP": feature_values["blood_pressure_dia"],
            "hemoglobin": feature_values["hemoglobin"],
            # Default-safe fallbacks for model features not currently captured in API payload.
            "plateletCount": 2.5,
            "sgot": 15.0,
            "sgpt": 15.0,
            "serumCreatinine": 0.7,
            "headache": 0.0,
            "visualDisturbance": 0.0,
            "epigastricPain": 0.0,
            "seizures": 0.0,
            "edema": 0.0,
            "urineProtein": 0.0,
            "severeBP": 1.0 if (feature_values["blood_pressure_sys"] >= 160 or feature_values["blood_pressure_dia"] >= 110) else 0.0,
            "hasHistory": 0.0,
            "weight_kg": feature_values["weight_kg"],
            "weeks_pregnant": feature_values["weeks_pregnant"],
            "blood_pressure_sys": feature_values["blood_pressure_sys"],
            "blood_pressure_dia": feature_values["blood_pressure_dia"],
        }
        return mapped_values.get(name, 0.0)


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
