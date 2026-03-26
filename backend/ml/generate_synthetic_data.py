"""
Synthetic ASHA-level Patient Data Generator for मातृत्व AI
==========================================================
Generates 2000 patients with distributions matched to real hospital data (n=104).
Includes realistic feature correlations, class overlap, and edge cases.

Features (11): age, gestationalWeeks, systolicBP, diastolicBP, gravida, parity,
               headache, visualDisturbance, edema, seizures, hasDiabetes

Target: diagnosis (Normal / Mild Pre-Eclampsia / Severe Pre-Eclampsia)

Usage: python scripts/generate_synthetic_asha.py
"""

import numpy as np`r`nimport pandas as pd`r`nimport sys`r`nfrom pathlib import Path`r`n`r`nif hasattr(sys.stdout, "reconfigure"):`r`n    sys.stdout.reconfigure(encoding="utf-8")

np.random.seed(42)


# ── Helper: correlated binary symptoms ────────────────────────────
def correlated_symptoms(base_probs, n, correlation_strength=0.6):
    """
    Generate correlated binary symptoms.
    If headache=1, visual disturbance is more likely (and vice versa).
    This mimics real clinical presentation where symptoms cluster.
    """
    headache_prob, visual_prob, edema_prob, seizure_prob = base_probs

    headache = np.random.random(n) < headache_prob
    
    # Visual disturbance correlates with headache
    visual_boost = headache * correlation_strength * visual_prob
    visual = np.random.random(n) < (visual_prob + visual_boost)
    
    # Edema is somewhat independent but slightly correlated with severity
    edema = np.random.random(n) < edema_prob
    
    # Seizures are rare and correlate strongly with headache + visual
    seizure_boost = (headache & visual).astype(float) * 0.03
    seizures = np.random.random(n) < (seizure_prob + seizure_boost)
    
    return headache.astype(int), visual.astype(int), edema.astype(int), seizures.astype(int)


# ── Helper: realistic gravida/parity ──────────────────────────────
def generate_gravida_parity(n, age_array):
    """
    Gravida correlates with age — older women tend to have higher gravida.
    Parity = gravida - 1 (simplified, assumes no miscarriages for synthetic data).
    """
    gravida = np.ones(n, dtype=int)
    for i in range(n):
        age = age_array[i]
        if age <= 20:
            gravida[i] = np.random.choice([1, 2], p=[0.75, 0.25])
        elif age <= 25:
            gravida[i] = np.random.choice([1, 2, 3], p=[0.40, 0.35, 0.25])
        elif age <= 30:
            gravida[i] = np.random.choice([1, 2, 3, 4], p=[0.20, 0.30, 0.30, 0.20])
        else:
            gravida[i] = np.random.choice([2, 3, 4, 5], p=[0.20, 0.30, 0.30, 0.20])
    
    parity = np.maximum(0, gravida - np.random.choice([1, 1, 1, 2], size=n))
    return gravida, parity


# ── Helper: correlated BP values ──────────────────────────────────
def generate_correlated_bp(n, sys_mean, sys_std, dia_mean, dia_std, sys_range, dia_range):
    """
    Systolic and diastolic BP are correlated (r ≈ 0.7 in real data).
    This generates them jointly rather than independently.
    """
    correlation = 0.7
    cov_matrix = [
        [sys_std**2, correlation * sys_std * dia_std],
        [correlation * sys_std * dia_std, dia_std**2]
    ]
    bp_values = np.random.multivariate_normal(
        [sys_mean, dia_mean], cov_matrix, size=n
    )
    systolic = np.clip(bp_values[:, 0], sys_range[0], sys_range[1]).astype(int)
    diastolic = np.clip(bp_values[:, 1], dia_range[0], dia_range[1]).astype(int)
    return systolic, diastolic


# ═══════════════════════════════════════════════════════════════════
# NORMAL PATIENTS (n=1200)
# ═══════════════════════════════════════════════════════════════════
def generate_normal(n=1200):
    age = np.clip(np.random.normal(25, 4, n), 17, 40).astype(int)
    gest_weeks = np.clip(np.random.normal(28, 7, n), 8, 40).astype(int)
    
    # BP: Normal range, but allow some borderline cases (up to 135)
    # ~5% of normal patients will have borderline BP (130-135)
    systolic, diastolic = generate_correlated_bp(
        n, sys_mean=115, sys_std=10, dia_mean=79, dia_std=8,
        sys_range=(90, 135), dia_range=(55, 88)
    )
    
    gravida, parity = generate_gravida_parity(n, age)
    
    # Symptoms: very rare in normal patients
    headache, visual, edema, seizures = correlated_symptoms(
        base_probs=(0.04, 0.01, 0.05, 0.0), n=n, correlation_strength=0.3
    )
    
    # Diabetes: ~10% prevalence, slightly higher with age
    diabetes_prob = 0.08 + (age - 20) * 0.005
    diabetes = (np.random.random(n) < diabetes_prob).astype(int)
    
    return pd.DataFrame({
        'age': age, 'gestationalWeeks': gest_weeks,
        'systolicBP': systolic, 'diastolicBP': diastolic,
        'gravida': gravida, 'parity': parity,
        'headache': headache, 'visualDisturbance': visual,
        'edema': edema, 'seizures': seizures,
        'hasDiabetes': diabetes,
        'diagnosis': 'Normal'
    })


# ═══════════════════════════════════════════════════════════════════
# MILD PRE-ECLAMPSIA (n=400)
# ═══════════════════════════════════════════════════════════════════
def generate_mild(n=400):
    age = np.clip(np.random.normal(25, 5, n), 18, 38).astype(int)
    gest_weeks = np.clip(np.random.normal(30, 5, n), 20, 40).astype(int)
    
    # BP: Elevated but not severe
    # Allow overlap with normal (some as low as 135) and severe (some up to 155)
    systolic, diastolic = generate_correlated_bp(
        n, sys_mean=145, sys_std=7, dia_mean=96, dia_std=6,
        sys_range=(135, 158), dia_range=(85, 108)
    )
    
    gravida, parity = generate_gravida_parity(n, age)
    
    # Symptoms: moderate prevalence, correlated
    headache, visual, edema, seizures = correlated_symptoms(
        base_probs=(0.45, 0.40, 0.25, 0.0), n=n, correlation_strength=0.5
    )
    
    # Diabetes: slightly higher prevalence in PE
    diabetes_prob = 0.15 + (age - 20) * 0.005
    diabetes = (np.random.random(n) < diabetes_prob).astype(int)
    
    return pd.DataFrame({
        'age': age, 'gestationalWeeks': gest_weeks,
        'systolicBP': systolic, 'diastolicBP': diastolic,
        'gravida': gravida, 'parity': parity,
        'headache': headache, 'visualDisturbance': visual,
        'edema': edema, 'seizures': seizures,
        'hasDiabetes': diabetes,
        'diagnosis': 'Mild Pre-Eclampsia'
    })


# ═══════════════════════════════════════════════════════════════════
# SEVERE PRE-ECLAMPSIA (n=400)
# ═══════════════════════════════════════════════════════════════════
def generate_severe(n=400):
    age = np.clip(np.random.normal(24, 5, n), 17, 38).astype(int)
    gest_weeks = np.clip(np.random.normal(32, 4, n), 22, 40).astype(int)
    
    # BP: Severely elevated
    # Allow some overlap with mild (some as low as 152)
    systolic, diastolic = generate_correlated_bp(
        n, sys_mean=168, sys_std=9, dia_mean=114, dia_std=8,
        sys_range=(150, 200), dia_range=(100, 140)
    )
    
    gravida, parity = generate_gravida_parity(n, age)
    
    # Symptoms: very high prevalence, strongly correlated
    headache, visual, edema, seizures = correlated_symptoms(
        base_probs=(0.90, 0.88, 0.40, 0.04), n=n, correlation_strength=0.7
    )
    
    # Diabetes
    diabetes_prob = 0.15 + (age - 20) * 0.005
    diabetes = (np.random.random(n) < diabetes_prob).astype(int)
    
    return pd.DataFrame({
        'age': age, 'gestationalWeeks': gest_weeks,
        'systolicBP': systolic, 'diastolicBP': diastolic,
        'gravida': gravida, 'parity': parity,
        'headache': headache, 'visualDisturbance': visual,
        'edema': edema, 'seizures': seizures,
        'hasDiabetes': diabetes,
        'diagnosis': 'Severe Pre-Eclampsia'
    })


# ═══════════════════════════════════════════════════════════════════
# EDGE CASES — borderline patients that test the model's boundaries
# ═══════════════════════════════════════════════════════════════════
def generate_edge_cases():
    """
    Manually crafted tricky patients:
    - Normal with borderline BP (should NOT be flagged)
    - Mild PE with atypical presentation (high BP but no symptoms)
    - Severe PE in young patient (age doesn't protect you)
    - Patient with symptoms but normal BP (should NOT be flagged as PE)
    """
    edges = [
        # Normal but borderline BP — should stay Normal
        {'age': 28, 'gestationalWeeks': 34, 'systolicBP': 134, 'diastolicBP': 86,
         'gravida': 2, 'parity': 1, 'headache': 0, 'visualDisturbance': 0,
         'edema': 0, 'seizures': 0, 'hasDiabetes': 0, 'diagnosis': 'Normal'},
        
        # Normal with headache only (common, not PE)
        {'age': 22, 'gestationalWeeks': 26, 'systolicBP': 112, 'diastolicBP': 72,
         'gravida': 1, 'parity': 0, 'headache': 1, 'visualDisturbance': 0,
         'edema': 0, 'seizures': 0, 'hasDiabetes': 0, 'diagnosis': 'Normal'},
        
        # Mild PE without symptoms (BP only presentation)
        {'age': 30, 'gestationalWeeks': 36, 'systolicBP': 148, 'diastolicBP': 96,
         'gravida': 3, 'parity': 2, 'headache': 0, 'visualDisturbance': 0,
         'edema': 0, 'seizures': 0, 'hasDiabetes': 1, 'diagnosis': 'Mild Pre-Eclampsia'},
        
        # Severe PE in young primigravida
        {'age': 19, 'gestationalWeeks': 30, 'systolicBP': 172, 'diastolicBP': 118,
         'gravida': 1, 'parity': 0, 'headache': 1, 'visualDisturbance': 1,
         'edema': 1, 'seizures': 0, 'hasDiabetes': 0, 'diagnosis': 'Severe Pre-Eclampsia'},
        
        # Normal elderly multigravida (age alone doesn't mean PE)
        {'age': 35, 'gestationalWeeks': 32, 'systolicBP': 122, 'diastolicBP': 78,
         'gravida': 4, 'parity': 3, 'headache': 0, 'visualDisturbance': 0,
         'edema': 1, 'seizures': 0, 'hasDiabetes': 1, 'diagnosis': 'Normal'},
        
        # Mild PE with full symptoms (borderline severe)
        {'age': 27, 'gestationalWeeks': 33, 'systolicBP': 152, 'diastolicBP': 102,
         'gravida': 2, 'parity': 1, 'headache': 1, 'visualDisturbance': 1,
         'edema': 1, 'seizures': 0, 'hasDiabetes': 0, 'diagnosis': 'Mild Pre-Eclampsia'},
    ]
    return pd.DataFrame(edges)


# ═══════════════════════════════════════════════════════════════════
# MAIN: Generate, validate distributions, and save
# ═══════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print("=" * 60)
    print("Maatritwa AI - Synthetic ASHA Data Generator")
    print("=" * 60)
    
    normal_df = generate_normal(1200)
    mild_df = generate_mild(400)
    severe_df = generate_severe(400)
    edge_df = generate_edge_cases()
    
    df = pd.concat([normal_df, mild_df, severe_df, edge_df], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # Shuffle
    
    # Save
    script_dir = Path(__file__).resolve().parent
    out_dir = script_dir.parent / "data" / "synthetic"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "synthetic_asha_data.csv"
    df.to_csv(out_path, index=False)
    
    # Print summary
    print(f"\nTotal patients: {len(df)}")
    print(f"\nClass distribution:")
    for diag in ['Normal', 'Mild Pre-Eclampsia', 'Severe Pre-Eclampsia']:
        subset = df[df['diagnosis'] == diag]
        print(f"  {diag}: {len(subset)} patients")
        print(f"    Systolic BP: {subset['systolicBP'].mean():.1f} ± {subset['systolicBP'].std():.1f} (range {subset['systolicBP'].min()}-{subset['systolicBP'].max()})")
        print(f"    Diastolic BP: {subset['diastolicBP'].mean():.1f} ± {subset['diastolicBP'].std():.1f}")
        print(f"    Age: {subset['age'].mean():.1f} ± {subset['age'].std():.1f}")
        print(f"    Headache: {subset['headache'].mean()*100:.1f}%")
        print(f"    Visual Dist: {subset['visualDisturbance'].mean()*100:.1f}%")
        print(f"    Edema: {subset['edema'].mean()*100:.1f}%")
        print(f"    Diabetes: {subset['hasDiabetes'].mean()*100:.1f}%")
    
    # Verify overlap between classes
    normal_max_sbp = df[df['diagnosis'] == 'Normal']['systolicBP'].max()
    mild_min_sbp = df[df['diagnosis'] == 'Mild Pre-Eclampsia']['systolicBP'].min()
    severe_min_sbp = df[df['diagnosis'] == 'Severe Pre-Eclampsia']['systolicBP'].min()
    
    print(f"\n{'─' * 40}")
    print(f"BP Overlap Check:")
    print(f"  Normal max systolic: {normal_max_sbp}")
    print(f"  Mild PE min systolic: {mild_min_sbp}")
    print(f"  Severe PE min systolic: {severe_min_sbp}")
    overlap = normal_max_sbp >= mild_min_sbp
    print(f"  Normal↔Mild overlap: {'YES ✓' if overlap else 'NO ✗ (too clean!)'}")
    
    print(f"\nSaved to: {out_path}")
    print("=" * 60)


