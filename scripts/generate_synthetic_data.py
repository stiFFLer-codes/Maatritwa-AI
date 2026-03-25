import pandas as pd
import numpy as np
import json

np.random.seed(42)

# Real data statistics (extracted from our 104 patients)
# Normal (n=80): Systolic mean=115, std=8 | Diastolic mean=79, std=8
# Mild PE (n=10): Systolic mean=145, std=5 | Diastolic mean=98, std=5
# Severe PE (n=14): Systolic mean=170, std=6 | Diastolic mean=116, std=6

def generate_normal(n=1200):
    patients = []
    for _ in range(n):
        age = int(np.clip(np.random.normal(25, 4), 17, 40))
        gest_weeks = int(np.clip(np.random.normal(28, 7), 8, 40))
        sys_bp = int(np.clip(np.random.normal(115, 10), 90, 137))
        dia_bp = int(np.clip(np.random.normal(79, 8), 55, 89))
        platelets = round(np.clip(np.random.normal(2.54, 0.6), 1.5, 4.0), 2)
        sgot = int(np.clip(np.random.normal(14, 3), 8, 22))
        sgpt = int(np.clip(np.random.normal(15, 4), 8, 25))
        creatinine = round(np.clip(np.random.normal(0.65, 0.15), 0.3, 1.0), 2)
        hemoglobin = round(np.clip(np.random.normal(11.8, 1.0), 9.0, 14.0), 1)
        headache = 1 if np.random.random() < 0.04 else 0
        visual_dist = 0
        epigastric = 1 if np.random.random() < 0.12 else 0
        seizures = 0
        edema = 1 if np.random.random() < 0.05 else 0
        urine_protein = 0
        severe_bp = 0
        has_history = 1 if np.random.random() < 0.35 else 0

        patients.append({
            'age': age, 'gestationalWeeks': gest_weeks,
            'systolicBP': sys_bp, 'diastolicBP': dia_bp,
            'plateletCount': platelets, 'sgot': sgot, 'sgpt': sgpt,
            'serumCreatinine': creatinine, 'hemoglobin': hemoglobin,
            'headache': headache, 'visualDisturbance': visual_dist,
            'epigastricPain': epigastric, 'seizures': seizures,
            'edema': edema, 'urineProtein': urine_protein,
            'severeBP': severe_bp, 'hasHistory': has_history,
            'diagnosis': 'Normal'
        })
    return patients

def generate_mild_pe(n=400):
    patients = []
    for _ in range(n):
        age = int(np.clip(np.random.normal(25, 5), 18, 38))
        gest_weeks = int(np.clip(np.random.normal(30, 5), 20, 40))
        sys_bp = int(np.clip(np.random.normal(145, 6), 138, 158))
        dia_bp = int(np.clip(np.random.normal(98, 5), 88, 108))
        platelets = round(np.clip(np.random.normal(1.92, 0.4), 1.0, 3.0), 2)
        sgot = int(np.clip(np.random.normal(16, 3), 10, 25))
        sgpt = int(np.clip(np.random.normal(17, 4), 10, 30))
        creatinine = round(np.clip(np.random.normal(0.68, 0.15), 0.4, 1.1), 2)
        hemoglobin = round(np.clip(np.random.normal(11.2, 0.8), 9.0, 13.0), 1)
        headache = 1 if np.random.random() < 0.50 else 0
        visual_dist = 1 if np.random.random() < 0.50 else 0
        epigastric = 1 if np.random.random() < 0.30 else 0
        seizures = 0
        edema = 1 if np.random.random() < 0.25 else 0
        urine_protein = np.random.choice([0, 1], p=[0.7, 0.3])
        severe_bp = 0
        has_history = 1 if np.random.random() < 0.50 else 0

        patients.append({
            'age': age, 'gestationalWeeks': gest_weeks,
            'systolicBP': sys_bp, 'diastolicBP': dia_bp,
            'plateletCount': platelets, 'sgot': sgot, 'sgpt': sgpt,
            'serumCreatinine': creatinine, 'hemoglobin': hemoglobin,
            'headache': headache, 'visualDisturbance': visual_dist,
            'epigastricPain': epigastric, 'seizures': seizures,
            'edema': edema, 'urineProtein': urine_protein,
            'severeBP': severe_bp, 'hasHistory': has_history,
            'diagnosis': 'Mild Pre-Eclampsia'
        })
    return patients

def generate_severe_pe(n=400):
    patients = []
    for _ in range(n):
        age = int(np.clip(np.random.normal(24, 5), 17, 38))
        gest_weeks = int(np.clip(np.random.normal(32, 4), 22, 40))
        sys_bp = int(np.clip(np.random.normal(170, 8), 155, 200))
        dia_bp = int(np.clip(np.random.normal(116, 7), 105, 140))
        platelets = round(np.clip(np.random.normal(1.40, 0.35), 0.5, 2.2), 2)
        sgot = int(np.clip(np.random.normal(17, 4), 10, 35))
        sgpt = int(np.clip(np.random.normal(20, 5), 10, 45))
        creatinine = round(np.clip(np.random.normal(1.23, 0.3), 0.7, 2.0), 2)
        hemoglobin = round(np.clip(np.random.normal(10.5, 1.0), 8.0, 12.5), 1)
        headache = 1 if np.random.random() < 0.93 else 0
        visual_dist = 1 if np.random.random() < 0.93 else 0
        epigastric = 1 if np.random.random() < 0.43 else 0
        seizures = 1 if np.random.random() < 0.04 else 0
        edema = 1 if np.random.random() < 0.40 else 0
        urine_protein = np.random.choice([0, 1, 2, 3], p=[0.2, 0.35, 0.25, 0.2])
        severe_bp = 1
        has_history = 1 if np.random.random() < 0.55 else 0

        patients.append({
            'age': age, 'gestationalWeeks': gest_weeks,
            'systolicBP': sys_bp, 'diastolicBP': dia_bp,
            'plateletCount': platelets, 'sgot': sgot, 'sgpt': sgpt,
            'serumCreatinine': creatinine, 'hemoglobin': hemoglobin,
            'headache': headache, 'visualDisturbance': visual_dist,
            'epigastricPain': epigastric, 'seizures': seizures,
            'edema': edema, 'urineProtein': urine_protein,
            'severeBP': severe_bp, 'hasHistory': has_history,
            'diagnosis': 'Severe Pre-Eclampsia'
        })
    return patients

if __name__ == '__main__':
    normal = generate_normal(1200)
    mild = generate_mild_pe(400)
    severe = generate_severe_pe(400)

    all_patients = normal + mild + severe
    np.random.shuffle(all_patients)

    df = pd.DataFrame(all_patients)
    df.to_csv('scripts/synthetic_training_data.csv', index=False)
    print(f"Generated {len(all_patients)} synthetic patients:")
    print(f"  Normal: {len(normal)}")
    print(f"  Mild PE: {len(mild)}")
    print(f"  Severe PE: {len(severe)}")
    print(f"Saved to scripts/synthetic_training_data.csv")
