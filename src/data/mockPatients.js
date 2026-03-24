// ── Real clinical data — anonymized ──────────────────────────────────────────
// Source: 104 patient records from a tertiary care hospital in India
// Processing: scripts/process_clinical_data.py
// First 20 patients used for demo (all 4 risk tiers represented)
import rawClinical from './clinicalPatients.json';

// ── WHO Risk engine (unchanged) ───────────────────────────────────────────────
function computeRisk(p) {
  const { systolicBP, diastolicBP, age, gestationalWeeks,
          previousPreeclampsia, diabetes, firstPregnancy, hemoglobin, weight, height } = p;
  if (systolicBP >= 160 || diastolicBP >= 110) return 'critical';
  if (
    systolicBP >= 140 ||
    diastolicBP >= 90 ||
    (previousPreeclampsia && systolicBP >= 130) ||
    (age > 35 && gestationalWeeks > 20 && systolicBP >= 130)
  ) return 'high';
  const bmi = weight / ((height / 100) ** 2);
  if (
    systolicBP >= 130 || diastolicBP >= 80 ||
    age > 35 || previousPreeclampsia || diabetes ||
    firstPregnancy || hemoglobin < 11 || bmi > 30
  ) return 'moderate';
  return 'low';
}

function visit(date, sys, dia, wt, notes = '') {
  return { date: new Date(date), systolicBP: sys, diastolicBP: dia, weight: wt, notes };
}

// ── Enrich clinical records with fields the UI expects ───────────────────────
// Clinical data lacks weight/height/hemoglobin/previousPreeclampsia etc.
// We derive them from available fields and add synthetic visit history.

function deriveExtras(p, idx) {
  const hist = (p.history || '').toLowerCase();

  // Derive boolean risk factors from history text
  const previousPreeclampsia = /pre-?ecl|pe\b/i.test(hist);
  const diabetes = /dm\b|diabetes|gdm/i.test(hist);
  const firstPregnancy = p.gravida === 1;

  // Estimate weight & height (realistic for Indian pregnant women, gestational-week-adjusted)
  const baseWeight = 48 + (p.age - 18) * 0.4 + p.gestationalWeeks * 0.3;
  const weight = parseFloat((baseWeight + ((idx * 31 + 7) % 14) - 7).toFixed(1));
  const heightOptions = [150, 152, 154, 155, 156, 157, 158, 160, 162, 163];
  const height = heightOptions[(idx * 3 + p.age) % heightOptions.length];

  // Estimate hemoglobin (slightly lower for patients with history/edema/high BP)
  let hemoglobin = 12.0;
  if (p.severeBP || p.riskLevel === 'critical') hemoglobin = 10.2 + (idx % 3) * 0.3;
  else if (p.riskLevel === 'high') hemoglobin = 11.2 + (idx % 4) * 0.2;
  else hemoglobin = 11.8 + (idx % 6) * 0.3;
  hemoglobin = parseFloat(hemoglobin.toFixed(1));

  // Synthetic visit history (2-3 past visits, slightly lower BP than current)
  const now = new Date('2026-03-24');
  const v1date = new Date(now); v1date.setDate(now.getDate() - 14);
  const v2date = new Date(now); v2date.setDate(now.getDate() - 28);
  const v3date = new Date(now); v3date.setDate(now.getDate() - 42);

  const sys = p.systolicBP;
  const dia = p.diastolicBP;

  const visits = [
    visit(v1date.toISOString().split('T')[0], sys, dia, weight,
      p.riskLevel === 'critical' ? 'Severe hypertension noted. Urgent referral issued.' :
      p.riskLevel === 'high'     ? 'Elevated BP. Monitoring intensified.' :
                                   'Routine ANC visit. No concerns.'),
    visit(v2date.toISOString().split('T')[0],
      Math.max(sys - 4, sys - 8 + (idx % 8)), Math.max(dia - 3, dia - 6 + (idx % 6)),
      parseFloat((weight - 0.8).toFixed(1)),
      'Follow-up visit.'),
    visit(v3date.toISOString().split('T')[0],
      Math.max(sys - 8, sys - 14 + (idx % 10)), Math.max(dia - 5, dia - 10 + (idx % 7)),
      parseFloat((weight - 1.6).toFixed(1)),
      'Initial registration.'),
  ];

  return { previousPreeclampsia, diabetes, firstPregnancy, weight, height, hemoglobin, visits };
}

// ── Build the 20-patient array ────────────────────────────────────────────────
// Pick the first 20 clinical records for demo display
const DEMO_COUNT = 20;

const raw = rawClinical.slice(0, DEMO_COUNT).map((p, idx) => {
  const extras = deriveExtras(p, idx);
  return {
    // Core identifiers
    id:   p.id,
    name: p.name,

    // Demographics
    age:              p.age,
    gravida:          p.gravida,
    parity:           p.parity,
    gestationalWeeks: p.gestationalWeeks,

    // Vitals
    systolicBP:  p.systolicBP,
    diastolicBP: p.diastolicBP,
    weight:      extras.weight,
    height:      extras.height,
    hemoglobin:  extras.hemoglobin,

    // Risk factors (derived + enriched)
    previousPreeclampsia: extras.previousPreeclampsia,
    diabetes:             extras.diabetes,
    firstPregnancy:       extras.firstPregnancy,

    // New clinical fields from real data
    history:           p.history,
    severeBP:          p.severeBP,
    urineProtein:      p.urineProtein,
    headache:          p.headache,
    visualDisturbance: p.visualDisturbance,
    epigastricPain:    p.epigastricPain,
    plateletCount:     p.plateletCount,
    sgot:              p.sgot,
    sgpt:              p.sgpt,
    serumCreatinine:   p.serumCreatinine,
    seizures:          p.seizures,
    edema:             p.edema,

    // Clinical ground-truth diagnosis
    actualDiagnosis: p.actualDiagnosis,

    // App metadata
    lastVisitDate: new Date('2026-03-24'),
    ashaWorkerId:  `asha_0${(idx % 3) + 1}`,
    visits:        extras.visits,
  };
});

// Attach WHO-computed riskLevel to each patient
// For display we use the clinical diagnosis mapped to risk tiers,
// falling back to WHO rule engine to capture "moderate" cases
export const mockPatients = raw.map(p => ({
  ...p,
  riskLevel: p.actualDiagnosis === 'Severe Pre- Eclampsia' ? 'critical'
           : p.actualDiagnosis === 'Mild Pre-Eclampsia'    ? 'high'
           : computeRisk(p),   // WHO engine for Normal patients (catches moderate)
}));

// ── Convenience helpers ───────────────────────────────────────────────────────

export function getPatientsByAshaId(ashaId) {
  const riskOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  return mockPatients
    .filter(p => p.ashaWorkerId === ashaId)
    .sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
}

export function getAllPatientsSorted() {
  const riskOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
  return [...mockPatients].sort(
    (a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
  );
}

// First low-risk patient (for Mother Dashboard demo)
export const demoMotherPatient = mockPatients.find(p => p.riskLevel === 'low') ?? mockPatients[0];
