"""
process_clinical_data.py
Reads Maatritva_AI_Data_collection.xlsx, anonymizes patient names,
cleans fields, and exports frontend/src/data/clinicalPatients.json
"""

import json
import random
import re
import sys
from pathlib import Path

import pandas as pd

# ── Resolve paths ─────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parents[2]
EXCEL = ROOT / "backend" / "data" / "raw" / "Maatritva_AI_Data_collection.xlsx"
OUT   = ROOT / "frontend" / "src" / "data" / "clinicalPatients.json"

if not EXCEL.exists():
    sys.exit(f"ERROR: Excel file not found at {EXCEL}")

# ── Anonymised Indian female names pool ──────────────────────────────────────
FIRST = [
    "Priya","Sunita","Geeta","Rekha","Anita","Kavita","Savitri","Lakshmi",
    "Nirmala","Rani","Meena","Radha","Parvati","Kamla","Durga","Sarita",
    "Babita","Sushila","Pushpa","Malti","Usha","Hemlata","Sarla","Mamta",
    "Kanta","Shanti","Lata","Manju","Beena","Sona","Hema","Nisha","Pooja",
    "Ritu","Seema","Vandana","Archana","Deepa","Renu","Preeti","Swati",
    "Jyoti","Neha","Manisha","Monika","Divya","Shreya","Payal","Komal","Pinki",
    "Champa","Pushpa","Basanti","Sita","Ganga","Yamuna","Tulsi","Jasoda",
    "Devki","Radha","Meera","Rukmini","Draupadi","Savitri","Damyanti",
]
LAST = [
    "Sharma","Verma","Singh","Patel","Gupta","Joshi","Yadav","Mishra",
    "Dubey","Tiwari","Pandey","Chauhan","Thakur","Rawat","Nair","Reddy",
    "Iyer","Pillai","Menon","Bhat","Shah","Mehta","Chaudhary","Agarwal",
    "Saxena","Srivastava","Bhatt","Trivedi","Desai","Jain","Malhotra",
    "Kapoor","Khanna","Chopra","Tandon","Arora","Bhatia","Kohli","Anand",
    "Bansal","Goel","Mittal","Singhal","Goyal","Rastogi","Varma","Dwivedi",
    "Shukla","Upadhyay","Bajpai","Asthana","Lal","Kumari","Devi","Bai",
]

random.seed(42)

def anon_name(i: int) -> str:
    f = FIRST[i % len(FIRST)]
    l = LAST[(i * 7 + 3) % len(LAST)]
    return f"{f} {l}"

# ── Cleaning helpers ──────────────────────────────────────────────────────────

def clean_gest(val) -> int:
    """'34 weeks' → 34"""
    if pd.isna(val):
        return 0
    m = re.search(r"\d+", str(val))
    return int(m.group()) if m else 0

def clean_bool(val) -> bool:
    if pd.isna(val):
        return False
    return str(val).strip().lower() in ("yes", "yes ", "y", "1", "true")

def clean_protein(val) -> str:
    if pd.isna(val):
        return "Nil"
    return str(val).strip()

DIAG_MAP = {
    "Normal":                "low",
    "Mild Pre-Eclampsia":    "high",
    "Severe Pre- Eclampsia": "critical",
    "Severe Pre-Eclampsia":  "critical",
}

def map_risk(diag: str) -> str:
    return DIAG_MAP.get(str(diag).strip(), "low")

# ── Load & process ────────────────────────────────────────────────────────────
df = pd.read_excel(EXCEL)

patients = []
for idx, row in df.iterrows():
    serial = int(row["Serial number"]) if not pd.isna(row["Serial number"]) else idx + 1
    pid = f"CP{serial:03d}"
    diag = str(row["Final Diagnosis"]).strip()

    patient = {
        "id":                 pid,
        "name":               anon_name(idx),
        "age":                int(row["Age"]) if not pd.isna(row["Age"]) else 0,
        "gravida":            int(row["Gravida"]) if not pd.isna(row["Gravida"]) else 0,
        "parity":             int(row["Parity"]) if not pd.isna(row["Parity"]) else 0,
        "gestationalWeeks":   clean_gest(row["Gestational age "]),
        "systolicBP":         int(row["Systolic BP"]) if not pd.isna(row["Systolic BP"]) else 0,
        "diastolicBP":        int(row["Diastolic BP"]) if not pd.isna(row["Diastolic BP"]) else 0,
        "history":            str(row["Any specific history of"]).strip() if not pd.isna(row["Any specific history of"]) else "",
        "severeBP":           clean_bool(row["Severe BP (yes/no) yes>=160/110"]),
        "urineProtein":       clean_protein(row["Urine Protein (Nil/1+/2+/3+)"]),
        "headache":           clean_bool(row["Headache"]),
        "visualDisturbance":  clean_bool(row["Visual Disturbance"]),
        "epigastricPain":     clean_bool(row["Epigastric Pain"]),
        "plateletCount":      float(row["Platelet count (Lakhs/cmm)"]) if not pd.isna(row["Platelet count (Lakhs/cmm)"]) else None,
        "sgot":               float(row["SGOT"]) if not pd.isna(row["SGOT"]) else None,
        "sgpt":               float(row["SGPT"]) if not pd.isna(row["SGPT"]) else None,
        "serumCreatinine":    float(row["Serum Creatinine"]) if not pd.isna(row["Serum Creatinine"]) else None,
        "seizures":           clean_bool(row["Seizures(Yes//N0)"]),
        "edema":              clean_bool(row["Edema"]),
        "actualDiagnosis":    diag,
        "riskLevel":          map_risk(diag),
    }
    patients.append(patient)

# ── Write JSON ────────────────────────────────────────────────────────────────
OUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(patients, f, indent=2, ensure_ascii=False)

# ── Summary ───────────────────────────────────────────────────────────────────
from collections import Counter
counts = Counter(p["riskLevel"] for p in patients)
print(f"OK  Wrote {len(patients)} patients to {OUT}")
print(f"   Risk distribution: {dict(counts)}")
print(f"   Diagnoses: {Counter(p['actualDiagnosis'] for p in patients)}")
