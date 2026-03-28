#!/usr/bin/env python3
"""
Seed test data for Maatritwa AI development.
Creates an ASHA user and test patients with vitals.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from uuid import UUID

# Load environment
ENV_PATH = Path(__file__).resolve().parents[0] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Mock ASHA ID from auth.py
ASHA_ID = "550e8400-e29b-41d4-a716-446655440000"

print("🌱 Seeding test data...")

# 1. Create ASHA user
try:
    user_data = {
        "id": ASHA_ID,
        "role": "asha",
        "name": "Gita Devi",
        "email": "gita@asha.local",
        "phone": "+91-9876543210",
    }
    supabase.table("users").insert(user_data).execute()
    print(f"✅ Created ASHA user: {user_data['name']} ({ASHA_ID})")
except Exception as e:
    if "duplicate key" in str(e).lower():
        print(f"ℹ️  ASHA user already exists")
    else:
        print(f"❌ Error creating ASHA user: {e}")

# 2. Create test patients
patients_data = [
    {
        "asha_id": ASHA_ID,
        "name": "Priya Sharma",
        "age": 28,
        "weeks_pregnant": 32,
        "village": "Kandirpur",
    },
    {
        "asha_id": ASHA_ID,
        "name": "Kavya Patel",
        "age": 35,
        "weeks_pregnant": 24,
        "village": "Jhiribandh",
    },
    {
        "asha_id": ASHA_ID,
        "name": "Meera Gupta",
        "age": 26,
        "weeks_pregnant": 20,
        "village": "Panchkot",
    },
    {
        "asha_id": ASHA_ID,
        "name": "Anita Kumari",
        "age": 32,
        "weeks_pregnant": 28,
        "village": "Ranchi",
    },
    {
        "asha_id": ASHA_ID,
        "name": "Sunita Das",
        "age": 29,
        "weeks_pregnant": 36,
        "village": "Godda",
    },
]

patient_ids = []
for patient in patients_data:
    try:
        result = supabase.table("patients").insert(patient).execute()
        patient_id = result.data[0]["id"] if result.data else None
        patient_ids.append(patient_id)
        print(f"✅ Created patient: {patient['name']} ({patient['age']} yrs, Week {patient['weeks_pregnant']})")
    except Exception as e:
        print(f"❌ Error creating patient {patient['name']}: {e}")

# 3. Add vitals for each patient
vitals_data = [
    # Patient 1: Priya - moderate risk
    {
        "blood_pressure_sys": 135,
        "blood_pressure_dia": 85,
        "hemoglobin": 10.5,
        "weight_kg": 62.0,
        "symptoms": "Headache, Swelling",
    },
    # Patient 2: Kavya - high risk
    {
        "blood_pressure_sys": 145,
        "blood_pressure_dia": 95,
        "hemoglobin": 9.8,
        "weight_kg": 68.5,
        "symptoms": "Headache, Blurred Vision",
    },
    # Patient 3: Meera - low risk
    {
        "blood_pressure_sys": 118,
        "blood_pressure_dia": 72,
        "hemoglobin": 12.0,
        "weight_kg": 58.0,
        "symptoms": None,
    },
    # Patient 4: Anita - high risk
    {
        "blood_pressure_sys": 155,
        "blood_pressure_dia": 102,
        "hemoglobin": 9.5,
        "weight_kg": 70.5,
        "symptoms": "Headache, Swelling, Blurred Vision",
    },
    # Patient 5: Sunita - critical risk
    {
        "blood_pressure_sys": 165,
        "blood_pressure_dia": 110,
        "hemoglobin": 9.0,
        "weight_kg": 65.0,
        "symptoms": "Headache, Blurred Vision, Seizures",
    },
]

for patient_id, vitals in zip(patient_ids, vitals_data):
    if not patient_id:
        continue
    try:
        vitals["patient_id"] = patient_id
        supabase.table("vitals").insert(vitals).execute()
        print(f"✅ Added vitals for patient {patient_id[:8]}... (BP: {vitals['blood_pressure_sys']}/{vitals['blood_pressure_dia']})")
    except Exception as e:
        print(f"❌ Error adding vitals: {e}")

print("\n🎉 Seed data created successfully!")
print(f"\nYou can now access:")
print(f"  - ASHA Dashboard: http://localhost:5173")
print(f"  - API Endpoint: http://127.0.0.1:8000/asha/patients")
