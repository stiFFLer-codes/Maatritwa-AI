"""
train_model.py
Trains a DecisionTreeClassifier (max_depth=4) on the clinical data,
evaluates it with Leave-One-Out CV, and exports:
  - src/data/modelMetrics.json   (accuracy, confusion matrix, per-class metrics)
  - src/data/decisionTreeRules.js (JS if-else function for browser use)
"""

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import LeaveOneOut
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support, confusion_matrix
)

ROOT        = Path(__file__).resolve().parent.parent
CLINICAL_J  = ROOT / "src" / "data" / "clinicalPatients.json"
METRICS_OUT = ROOT / "src" / "data" / "modelMetrics.json"
RULES_OUT   = ROOT / "src" / "data" / "decisionTreeRules.js"

if not CLINICAL_J.exists():
    sys.exit("ERROR: clinicalPatients.json not found. Run process_clinical_data.py first.")

# ── Load data ─────────────────────────────────────────────────────────────────
with open(CLINICAL_J, encoding="utf-8") as f:
    patients = json.load(f)

PROTEIN_MAP = {"Nil": 0, "1+": 1, "2+": 2, "3+": 3}
DIAG_MAP    = {"Normal": 0, "Mild Pre-Eclampsia": 1, "Severe Pre- Eclampsia": 2}
LABEL_NAMES = ["Normal", "Mild Pre-Eclampsia", "Severe Pre-Eclampsia"]

def to_row(p):
    protein = PROTEIN_MAP.get(p.get("urineProtein", "Nil"), 0)
    has_history = 0 if (not p.get("history") or p["history"].lower() in ("no specific history", "", "nan")) else 1
    return [
        p.get("age", 0),
        p.get("gestationalWeeks", 0),
        p.get("systolicBP", 0),
        p.get("diastolicBP", 0),
        p.get("plateletCount") or 0.0,
        p.get("sgot") or 0.0,
        p.get("sgpt") or 0.0,
        p.get("serumCreatinine") or 0.0,
        int(p.get("headache", False)),
        int(p.get("visualDisturbance", False)),
        int(p.get("epigastricPain", False)),
        int(p.get("seizures", False)),
        int(p.get("edema", False)),
        protein,
        int(p.get("severeBP", False)),
        has_history,
    ]

FEATURES = [
    "age", "gestationalWeeks", "systolicBP", "diastolicBP",
    "plateletCount", "sgot", "sgpt", "serumCreatinine",
    "headache", "visualDisturbance", "epigastricPain", "seizures", "edema",
    "urineProtein", "severeBP", "hasHistory",
]

X = np.array([to_row(p) for p in patients], dtype=float)
y = np.array([DIAG_MAP.get(p["actualDiagnosis"], 0) for p in patients], dtype=int)

print(f"Dataset: {X.shape[0]} patients, {X.shape[1]} features")
print(f"Class distribution: {dict(zip(LABEL_NAMES, np.bincount(y)))}")

# ── Leave-One-Out CV ──────────────────────────────────────────────────────────
loo = LeaveOneOut()
y_true_all = []
y_pred_all = []

for train_idx, test_idx in loo.split(X):
    clf_loo = DecisionTreeClassifier(max_depth=4, random_state=42, class_weight="balanced")
    clf_loo.fit(X[train_idx], y[train_idx])
    y_pred_all.append(clf_loo.predict(X[test_idx])[0])
    y_true_all.append(y[test_idx][0])

y_true_all = np.array(y_true_all)
y_pred_all = np.array(y_pred_all)

acc = accuracy_score(y_true_all, y_pred_all)
prec, rec, f1, support = precision_recall_fscore_support(y_true_all, y_pred_all, labels=[0, 1, 2], zero_division=0)
cm = confusion_matrix(y_true_all, y_pred_all, labels=[0, 1, 2])

print(f"\nLOOCV Accuracy: {acc:.3f} ({acc*100:.1f}%)")
for i, name in enumerate(LABEL_NAMES):
    print(f"  {name}: P={prec[i]:.2f} R={rec[i]:.2f} F1={f1[i]:.2f} (n={support[i]})")
print(f"\nConfusion matrix:\n{cm}")

# ── Train final model on ALL data ─────────────────────────────────────────────
clf = DecisionTreeClassifier(max_depth=4, random_state=42, class_weight="balanced")
clf.fit(X, y)

tree_rules_text = export_text(clf, feature_names=FEATURES)
print("\nDecision tree rules:\n" + tree_rules_text)

# ── Save metrics ──────────────────────────────────────────────────────────────
metrics = {
    "datasetSize": int(X.shape[0]),
    "features": FEATURES,
    "crossValidation": "Leave-One-Out",
    "treeDepth": 4,
    "loocvAccuracy": round(float(acc), 4),
    "loocvAccuracyPct": round(float(acc) * 100, 1),
    "perClass": {
        LABEL_NAMES[i]: {
            "precision": round(float(prec[i]), 3),
            "recall": round(float(rec[i]), 3),
            "f1": round(float(f1[i]), 3),
            "support": int(support[i]),
        }
        for i in range(3)
    },
    "confusionMatrix": cm.tolist(),
    "confusionMatrixLabels": LABEL_NAMES,
    "treeRulesText": tree_rules_text,
    "hospitalNote": "Validated on 104 real patient records from a tertiary care hospital in India",
    "guidelines": "WHO 2019 & FOGSI clinical guidelines",
}

with open(METRICS_OUT, "w", encoding="utf-8") as f:
    json.dump(metrics, f, indent=2, ensure_ascii=False)
print(f"\nOK Metrics saved to {METRICS_OUT}")

# ── Export decision tree as JS ─────────────────────────────────────────────────
# Walk the sklearn tree structure and emit nested JS if-else

tree = clf.tree_
feature_idx = tree.feature        # feature index at each node (-2 = leaf)
thresholds   = tree.threshold      # threshold at each node
children_l   = tree.children_left
children_r   = tree.children_right
values       = tree.value          # shape (n_nodes, 1, n_classes)

def node_to_js(node_id: int, depth: int) -> list[str]:
    indent = "  " * depth
    lines  = []

    if feature_idx[node_id] == -2:
        # Leaf node
        class_counts = values[node_id][0]
        total = class_counts.sum()
        pred_class = int(np.argmax(class_counts))
        confidence = round(float(class_counts[pred_class] / total), 3)
        label = LABEL_NAMES[pred_class]
        lines.append(f"{indent}return {{ prediction: '{label}', confidence: {confidence} }};")
        return lines

    feat  = FEATURES[feature_idx[node_id]]
    thresh = round(float(thresholds[node_id]), 4)

    # Map feature name to patient object accessor
    ACCESS = {
        "age":               "p.age",
        "gestationalWeeks":  "p.gestationalWeeks",
        "systolicBP":        "p.systolicBP",
        "diastolicBP":       "p.diastolicBP",
        "plateletCount":     "(p.plateletCount ?? 0)",
        "sgot":              "(p.sgot ?? 0)",
        "sgpt":              "(p.sgpt ?? 0)",
        "serumCreatinine":   "(p.serumCreatinine ?? 0)",
        "headache":          "(p.headache ? 1 : 0)",
        "visualDisturbance": "(p.visualDisturbance ? 1 : 0)",
        "epigastricPain":    "(p.epigastricPain ? 1 : 0)",
        "seizures":          "(p.seizures ? 1 : 0)",
        "edema":             "(p.edema ? 1 : 0)",
        "urineProtein":      "(['Nil','1+','2+','3+'].indexOf(p.urineProtein ?? 'Nil'))",
        "severeBP":          "(p.severeBP ? 1 : 0)",
        "hasHistory":        "((p.history && p.history !== 'No specific History' && p.history !== '') ? 1 : 0)",
    }
    accessor = ACCESS.get(feat, f"p.{feat}")

    lines.append(f"{indent}if ({accessor} <= {thresh}) {{")
    lines.extend(node_to_js(children_l[node_id], depth + 1))
    lines.append(f"{indent}}} else {{")
    lines.extend(node_to_js(children_r[node_id], depth + 1))
    lines.append(f"{indent}}}")
    return lines

js_body_lines = node_to_js(0, 1)
js_body = "\n".join(js_body_lines)

# Compute per-class accuracy for inline docs
sensitivity_severe = round(float(rec[2]), 3)   # recall for severe (class 2)
sensitivity_mild   = round(float(rec[1]), 3)
specificity_normal = round(float(rec[0]), 3)

js_content = f"""// ── Auto-generated decision tree — DO NOT EDIT MANUALLY ──────────────────────
// Generated by scripts/train_model.py
// Model: DecisionTreeClassifier(max_depth=4)
// Validation: Leave-One-Out CV on {int(X.shape[0])} patients
// Overall accuracy: {round(float(acc)*100, 1)}%
// Sensitivity (Severe Pre-Eclampsia): {sensitivity_severe*100:.1f}%
// Sensitivity (Mild Pre-Eclampsia):   {sensitivity_mild*100:.1f}%
// Specificity (Normal):               {specificity_normal*100:.1f}%

/**
 * @param {{object}} p - Patient object with clinical fields
 * @returns {{{{ prediction: string, confidence: number }}}}
 */
export function predictWithTree(p) {{
{js_body}
}}

export const MODEL_META = {{
  accuracy: {round(float(acc), 4)},
  accuracyPct: {round(float(acc)*100, 1)},
  datasetSize: {int(X.shape[0])},
  treeDepth: 4,
  crossValidation: "Leave-One-Out",
  sensitivitySevere: {sensitivity_severe},
  sensitivityMild:   {sensitivity_mild},
  specificityNormal: {specificity_normal},
  hospitalNote: "Validated on 104 real patient records from a tertiary care hospital in India",
}};
"""

with open(RULES_OUT, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"OK Decision tree JS saved to {RULES_OUT}")
print("\nSummary:")
print(f"  LOOCV Accuracy     : {acc*100:.1f}%")
print(f"  Sensitivity Severe : {sensitivity_severe*100:.1f}%")
print(f"  Sensitivity Mild   : {sensitivity_mild*100:.1f}%")
print(f"  Specificity Normal : {specificity_normal*100:.1f}%")
