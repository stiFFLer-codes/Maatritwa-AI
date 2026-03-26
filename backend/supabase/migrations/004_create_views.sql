-- Migration 004: Create Views for Doctor Basic/Detailed, Mother Basic, Anemia 3-Visit
-- Run in Supabase SQL Editor after 003

-- Doctor Basic: 14 key params (user-specified)
CREATE OR REPLACE VIEW public.doctor_basic AS
WITH latest_vitals AS (
  SELECT DISTINCT ON (patient_id) * FROM public.vitals ORDER BY patient_id, recorded_at DESC
),
latest_labs AS (
  SELECT DISTINCT ON (patient_id) * FROM public.clinical_labs ORDER BY patient_id, recorded_at DESC
)
SELECT 
  p.id,
  p.name,
  p.age,
  p.weeks_pregnant AS gest_week,
  p.gravida,
  p.parity,
  lv.blood_pressure_sys,
  lv.blood_pressure_dia,
  ll.platelet_count,
  ll.serum_creatinine,
  ll.sgpt,
  ll.sgot,
  ll.proteinuria,
  ll.headache,
  ll.blurring_vision,
  ll.epigastric_pain
FROM public.patients p
LEFT JOIN latest_vitals lv ON p.id = lv.patient_id
LEFT JOIN latest_labs ll ON p.id = ll.patient_id;

-- Doctor Detailed: + all patients fields + full labs (fixed ID dup)
CREATE OR REPLACE VIEW public.doctor_detailed AS
WITH latest_vitals AS (
  SELECT DISTINCT ON (patient_id) patient_id, blood_pressure_sys, blood_pressure_dia, hemoglobin, weight_kg, pulse_rate, symptoms, recorded_at as vitals_recorded_at
  FROM public.vitals ORDER BY patient_id, recorded_at DESC
),
latest_labs AS (
  SELECT DISTINCT ON (patient_id) patient_id, sgpt, sgot, serum_creatinine, platelet_count, proteinuria, edema, epigastric_pain, headache, blurring_vision, recorded_at as labs_recorded_at
  FROM public.clinical_labs ORDER BY patient_id, recorded_at DESC
)
SELECT 
  p.*,
  lv.blood_pressure_sys, lv.blood_pressure_dia, lv.hemoglobin, lv.weight_kg, lv.pulse_rate, lv.symptoms as vitals_symptoms, lv.vitals_recorded_at,
  ll.sgpt, ll.sgot, ll.serum_creatinine, ll.platelet_count, ll.proteinuria, ll.edema, ll.epigastric_pain, ll.headache, ll.blurring_vision, ll.labs_recorded_at
FROM public.patients p
LEFT JOIN latest_vitals lv ON p.id = lv.patient_id
LEFT JOIN latest_labs ll ON p.id = ll.patient_id;

COMMENT ON VIEW public.doctor_detailed IS 'Doctor detailed view: all patients + latest vitals/labs (prefixed cols)';

-- Mother Basic: 5 params (latest)
CREATE OR REPLACE VIEW public.mother_basic AS
SELECT 
  p.name,
  p.weeks_pregnant,
  lv.blood_pressure_sys || '/' || lv.blood_pressure_dia AS latest_bp,
  lv.hemoglobin AS latest_hb,
  ra.risk_level AS latest_risk
FROM public.patients p
LEFT JOIN LATERAL (SELECT * FROM public.vitals WHERE patient_id = p.id ORDER BY recorded_at DESC LIMIT 1) lv ON true
LEFT JOIN LATERAL (SELECT * FROM public.risk_assessments WHERE patient_id = p.id ORDER BY assessed_at DESC LIMIT 1) ra ON true;

-- Anemia 3-Visit: Avg Hb last 3 if >=3 visits
CREATE OR REPLACE VIEW public.anemia_3visit AS
WITH ranked_vitals AS (
  SELECT patient_id, hemoglobin, recorded_at,
  ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY recorded_at DESC) as rn
  FROM public.vitals
)
SELECT 
  patient_id,
  COUNT(*) as visit_count,
  AVG(hemoglobin) FILTER (WHERE rn <= 3) as avg_hb_last3,
  CASE 
    WHEN COUNT(*) >= 3 AND AVG(hemoglobin) FILTER (WHERE rn <= 3)::numeric < 11 THEN 'high'
    WHEN COUNT(*) >= 3 AND AVG(hemoglobin) FILTER (WHERE rn <= 3)::numeric < 12 THEN 'medium'
    ELSE 'low'
  END AS anemia_risk
FROM ranked_vitals
GROUP BY patient_id
HAVING COUNT(*) >= 3;

-- Verification
COMMENT ON VIEW public.doctor_basic IS 'Doctor basic view: name,age,gest_wk,gravida/parity,BP,platelet_count,creatinine,sgpt/sgot,proteinuria,headache,blurring,epigastric_pain';
COMMENT ON VIEW public.anemia_3visit IS 'Anemia risk from avg Hb of last 3+ visits';
