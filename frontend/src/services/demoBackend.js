/**
 * In-browser stand-in for the FastAPI backend.
 *
 * The real backend needs a Supabase project, a service-role key and a seeded
 * database. Nobody cloning this repo has those, so without this module every
 * dashboard renders an error state and the project looks broken rather than
 * finished. This serves the same endpoints, in the same shapes, from memory.
 *
 * Response shapes mirror the Pydantic models in backend/app/routers/ exactly,
 * so the dashboards cannot tell the difference. If you change a model there,
 * change it here.
 *
 * State lives for one page session. Creating a referral in /asha and then
 * navigating to /doctor shows it, because both routes share this module —
 * but a browser reload resets everything to seed.
 *
 * Everything is derived deterministically. No Math.random, no Date.now inside
 * record bodies, so two people running the demo see identical data and a
 * screenshot stays reproducible.
 */

import clinicalPatients from '../data/clinicalPatients.json';

const ASHA_ID = '550e8400-e29b-41d4-a716-446655440000';
const DOCTOR_ID = '550e8400-e29b-41d4-a716-446655440002';

// Vadodara district, Gujarat — the source hospital's catchment.
const VILLAGES = [
  'Waghodia', 'Dabhoi', 'Padra', 'Karjan', 'Savli',
  'Sinor', 'Desar', 'Sankheda', 'Jetpur Pavi', 'Kawant',
];

// The dataset's clinical diagnosis is the risk label. Mapped into the
// vocabulary the ASHA dashboard reads (see RISK_MAP in AshaDashboard.jsx).
const DIAGNOSIS_TO_RISK = {
  'Normal': 'low',
  'Mild Pre-Eclampsia': 'high',
  'Severe Pre- Eclampsia': 'critical',
};

const RISK_SCORE = { low: 0.22, moderate: 0.55, high: 0.74, critical: 0.93 };

// Fixed clock so generated dates are stable within a session.
const NOW = new Date();

function daysAgo(n) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Deterministic small integer from a string — stands in for a seeded RNG. */
function hashInt(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return h % mod;
}

function symptomsOf(record) {
  const s = [];
  if (record.headache) s.push('Headache');
  if (record.visualDisturbance) s.push('Blurred Vision');
  if (record.edema) s.push('Swelling');
  if (record.seizures) s.push('Seizures');
  return s.join(', ');
}

/**
 * The clinical dataset has no weight or haemoglobin — it was collected for a
 * preeclampsia study, not a general antenatal one. The dashboards display both,
 * so derive plausible values from age and gestation. These are FABRICATED and
 * exist only so the demo UI has something to render.
 */
function deriveWeight(record) {
  const base = 48 + (record.age - 18) * 0.4 + record.gestationalWeeks * 0.3;
  return Math.round((base + (hashInt(record.id, 14) - 7)) * 10) / 10;
}

function deriveHemoglobin(record) {
  // Anaemia is common in this population; skew low but keep it plausible.
  return Math.round((8.5 + hashInt(record.id + 'hb', 40) / 10) * 10) / 10;
}

function derivePulse(record) {
  return 68 + hashInt(record.id + 'p', 28);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

function buildSeed() {
  const patients = [];
  const visits = [];
  const referrals = [];
  const labs = {};
  const assessments = [];

  clinicalPatients.forEach((record, idx) => {
    const risk = DIAGNOSIS_TO_RISK[record.actualDiagnosis] || 'low';
    const weight = deriveWeight(record);
    const hemoglobin = deriveHemoglobin(record);
    const pulse = derivePulse(record);
    const symptoms = symptomsOf(record);
    const lastVisitOffset = hashInt(record.id + 'v', 21);

    // Three visits per patient: the eclampsia endpoint needs three to be eligible,
    // and a trend needs more than one point to exist.
    const visitDates = [lastVisitOffset + 56, lastVisitOffset + 28, lastVisitOffset];
    visitDates.forEach((offset, vIdx) => {
      // Walk BP backwards from the recorded value so the trend leads to today.
      const decay = (visitDates.length - 1 - vIdx) * (risk === 'low' ? 2 : 9);
      visits.push({
        id: `${record.id}-V${vIdx + 1}`,
        patient_id: record.id,
        weeks_pregnant: Math.max(1, record.gestationalWeeks - (visitDates.length - 1 - vIdx) * 4),
        recorded_at: daysAgo(offset),
        blood_pressure_sys: record.systolicBP - decay,
        blood_pressure_dia: record.diastolicBP - Math.round(decay / 2),
        hemoglobin,
        weight_kg: Math.round((weight - (visitDates.length - 1 - vIdx) * 1.2) * 10) / 10,
        pulse_rate: pulse,
        // Symptoms only present at the most recent visit.
        symptoms: vIdx === visitDates.length - 1 ? symptoms : '',
        risk_level: vIdx === visitDates.length - 1 ? risk : 'low',
        risk_score: vIdx === visitDates.length - 1 ? RISK_SCORE[risk] : RISK_SCORE.low,
      });
    });

    patients.push({
      id: record.id,
      asha_id: ASHA_ID,
      mother_id: null,
      name: record.name,
      age: record.age,
      weeks_pregnant: record.gestationalWeeks,
      village: VILLAGES[idx % VILLAGES.length],
      created_at: daysAgo(lastVisitOffset + 84),
      risk_level: risk,
      risk_score: RISK_SCORE[risk],
      blood_pressure_sys: record.systolicBP,
      blood_pressure_dia: record.diastolicBP,
      last_visit_date: daysAgo(lastVisitOffset),
      visit_count: visitDates.length,
      risk_assessment_count: 1,
      pending_referral_count: 0,
      // Extra fields the doctor view reads.
      gravida: record.gravida,
      parity: record.parity,
      diabetic_history: /dm\b|diabet|gdm/i.test(record.history || ''),
      height_cm: 150 + hashInt(record.id + 'h', 18),
    });

    labs[record.id] = {
      id: `${record.id}-LAB`,
      patient_id: record.id,
      sgot: record.sgot,
      sgpt: record.sgpt,
      platelet_count: record.plateletCount,
      serum_creatinine: record.serumCreatinine,
      proteinuria: record.urineProtein,
      edema: record.edema ? 'Present' : 'Nil',
      epigastric_pain: record.epigastricPain,
      seizures: record.seizures,
      recorded_at: daysAgo(lastVisitOffset),
    };

    assessments.push({
      id: `${record.id}-RA1`,
      patient_id: record.id,
      vitals_id: `${record.id}-V3`,
      risk_level: risk,
      risk_score: RISK_SCORE[risk],
      flags: flagsFor(record, hemoglobin, weight),
      model_version: 'demo-rules-v1',
      assessed_at: daysAgo(lastVisitOffset),
    });
  });

  // Pre-refer the severe cases so the doctor inbox is not empty on first load.
  patients
    .filter((p) => p.risk_level === 'critical')
    .slice(0, 6)
    .forEach((p, i) => {
      referrals.push({
        id: `REF-${String(i + 1).padStart(3, '0')}`,
        patient_id: p.id,
        asha_id: ASHA_ID,
        doctor_id: DOCTOR_ID,
        assessment_id: `${p.id}-RA1`,
        status: i === 0 ? 'accepted' : 'pending',
        notes: 'Referred from ASHA dashboard — severe BP with symptoms.',
        referred_at: daysAgo(hashInt(p.id + 'r', 9)),
        resolved_at: null,
      });
      p.pending_referral_count = i === 0 ? 0 : 1;
    });

  return { patients, visits, referrals, labs, assessments };
}

/** Mirrors _compute_flags in backend/app/ml.py so demo and real agree. */
function flagsFor(record, hemoglobin, weight) {
  const flags = [];
  const sys = record.systolicBP;
  const dia = record.diastolicBP;

  if (sys >= 160 || dia >= 110) flags.push('hypertensive_crisis');
  else if (sys >= 140 || dia >= 90) flags.push('high_bp');

  if (hemoglobin < 7) flags.push('severe_anemia');
  else if (hemoglobin < 11) flags.push('anemia');

  if (weight < 45) flags.push('low_weight');

  if (record.age < 19) flags.push('teen_pregnancy');
  else if (record.age >= 35) flags.push('advanced_maternal_age');

  if (record.gestationalWeeks > 40) flags.push('post_term');

  return flags;
}

let db = buildSeed();

export function resetDemoData() {
  db = buildSeed();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class DemoHttpError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

function patientOr404(id) {
  const patient = db.patients.find((p) => p.id === id);
  if (!patient) throw new DemoHttpError(404, 'Patient not found.');
  return patient;
}

function visitsFor(patientId) {
  return db.visits
    .filter((v) => v.patient_id === patientId)
    .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
}

/** Mirrors _normalize_risk_level in backend/app/routers/doctor.py. */
function toDoctorRisk(level) {
  if (!level) return null;
  const n = String(level).trim().toLowerCase();
  if (n === 'critical') return 'critical';
  if (n === 'high' || n === 'elevated') return 'elevated';
  if (n === 'medium' || n === 'moderate' || n === 'monitor') return 'monitor';
  if (n === 'low' || n === 'safe') return 'safe';
  return n;
}

function referralListItem(referral) {
  const patient = db.patients.find((p) => p.id === referral.patient_id) || {};
  const latest = visitsFor(referral.patient_id)[0] || {};
  return {
    ...referral,
    patient_name: patient.name ?? null,
    latest_risk_level: toDoctorRisk(patient.risk_level),
    patient_age: patient.age ?? null,
    weeks_pregnant: patient.weeks_pregnant ?? null,
    village: patient.village ?? null,
    gravida: patient.gravida ?? null,
    parity: patient.parity ?? null,
    diabetic_history: patient.diabetic_history ?? null,
    latest_bp_sys: latest.blood_pressure_sys ?? null,
    latest_bp_dia: latest.blood_pressure_dia ?? null,
    latest_hemoglobin: latest.hemoglobin ?? null,
    latest_weight_kg: latest.weight_kg ?? null,
    latest_symptoms: latest.symptoms || null,
    last_visit_date: patient.last_visit_date ?? null,
    visit_count: patient.visit_count ?? 0,
  };
}

/** Mirrors _rule_based_prediction in backend/app/ml.py. */
function predictRisk({ blood_pressure_sys: sys, blood_pressure_dia: dia, hemoglobin: hb }, flags) {
  if (sys >= 160 || dia >= 110 || hb < 7) return ['high', 0.9];
  if (sys >= 140 || dia >= 90 || hb < 9) return ['medium', 0.7];
  if (flags.length) return ['medium', 0.6];
  return ['low', 0.25];
}

/** Mirrors _rule_based_eclampsia_prediction in backend/app/ml.py. */
function predictEclampsia(patientVisits) {
  const count = (term) =>
    patientVisits.filter((v) => (v.symptoms || '').toLowerCase().includes(term)).length;

  const headache = count('headache');
  const blurred = count('blurred');
  const seizures = count('seizure');
  const severeBpVisits = patientVisits.filter(
    (v) => v.blood_pressure_sys >= 160 || v.blood_pressure_dia >= 110,
  ).length;
  const avgSys = patientVisits.reduce((a, v) => a + v.blood_pressure_sys, 0) / patientVisits.length;
  const avgDia = patientVisits.reduce((a, v) => a + v.blood_pressure_dia, 0) / patientVisits.length;

  const flags = [];
  if (seizures > 0) flags.push('seizure_history');
  if (severeBpVisits >= 2) flags.push('repeated_severe_bp');
  if (blurred >= 2) flags.push('recurrent_visual_disturbance');
  if (headache >= 2) flags.push('recurrent_headache');

  if (seizures >= 1) return ['critical', 0.95, flags];
  if (severeBpVisits >= 2 && (headache >= 1 || blurred >= 1)) return ['high', 0.82, flags];
  if (avgSys >= 150 || avgDia >= 100) return ['high', 0.75, flags];
  if (severeBpVisits >= 1 || flags.length >= 2) return ['moderate', 0.62, flags];
  return ['low', 0.28, flags];
}

// ── Route table ───────────────────────────────────────────────────────────────
// Each entry: [method, RegExp over the path, handler(params, body)]

const ROUTES = [
  ['GET', /^\/asha\/patients$/, () =>
    [...db.patients].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, moderate: 2, low: 3 };
      return (order[a.risk_level] ?? 99) - (order[b.risk_level] ?? 99);
    })],

  ['GET', /^\/asha\/patients\/([^/]+)\/details$/, ([id]) => ({
    patient: patientOr404(id),
    visits: visitsFor(id),
  })],

  ['GET', /^\/asha\/patients\/([^/]+)\/eclampsia-risk$/, ([id]) => {
    patientOr404(id);
    const patientVisits = visitsFor(id);
    const MIN_VISITS = 3;
    if (patientVisits.length < MIN_VISITS) {
      return {
        eligible: false,
        min_visits_required: MIN_VISITS,
        available_visits: patientVisits.length,
        flags: [],
        message: `Needs at least ${MIN_VISITS} visits to assess trend.`,
      };
    }
    const [level, score, flags] = predictEclampsia(patientVisits);
    return {
      eligible: true,
      min_visits_required: MIN_VISITS,
      available_visits: patientVisits.length,
      risk_level: level,
      risk_score: score,
      flags,
      model_version: 'demo-rules-v1',
      message: 'Trend assessed across recorded visits.',
    };
  }],

  ['POST', /^\/asha\/referrals$/, (_p, body) => {
    const patient = patientOr404(body.patient_id);
    const referral = {
      id: `REF-${String(db.referrals.length + 1).padStart(3, '0')}`,
      patient_id: patient.id,
      asha_id: ASHA_ID,
      doctor_id: DOCTOR_ID,
      assessment_id: null,
      status: 'pending',
      notes: body.notes ?? null,
      referred_at: new Date().toISOString(),
      resolved_at: null,
    };
    db.referrals.unshift(referral);
    patient.pending_referral_count += 1;
    return referral;
  }],

  ['POST', /^\/asha\/patients$/, (_p, body) => {
    const patient = {
      id: `NEW-${String(db.patients.length + 1).padStart(3, '0')}`,
      asha_id: ASHA_ID,
      mother_id: body.mother_id ?? null,
      name: body.name,
      age: body.age,
      weeks_pregnant: body.weeks_pregnant,
      village: body.village,
      created_at: new Date().toISOString(),
      risk_level: null,
      risk_score: null,
      blood_pressure_sys: null,
      blood_pressure_dia: null,
      last_visit_date: null,
      visit_count: 0,
      risk_assessment_count: 0,
      pending_referral_count: 0,
      gravida: body.gravida ?? null,
      parity: body.parity ?? null,
      diabetic_history: body.diabetic_history ?? false,
      height_cm: body.height_cm ?? null,
    };
    db.patients.unshift(patient);
    return patient;
  }],

  ['POST', /^\/asha\/patients\/([^/]+)\/vitals$/, ([id], body) => {
    const patient = patientOr404(id);
    const vitals = {
      id: `${id}-V${visitsFor(id).length + 1}`,
      patient_id: id,
      blood_pressure_sys: body.blood_pressure_sys,
      blood_pressure_dia: body.blood_pressure_dia,
      hemoglobin: body.hemoglobin,
      weight_kg: body.weight_kg,
      pulse_rate: body.pulse_rate ?? null,
      symptoms: body.symptoms ?? null,
      recorded_at: new Date().toISOString(),
      weeks_pregnant: patient.weeks_pregnant,
      risk_level: null,
      risk_score: null,
    };
    db.visits.push(vitals);
    patient.visit_count += 1;
    patient.last_visit_date = vitals.recorded_at;
    patient.blood_pressure_sys = vitals.blood_pressure_sys;
    patient.blood_pressure_dia = vitals.blood_pressure_dia;
    return vitals;
  }],

  ['POST', /^\/asha\/patients\/([^/]+)\/visits$/, ([id], body) => {
    const patient = patientOr404(id);
    const visit = {
      id: `${id}-V${visitsFor(id).length + 1}`,
      patient_id: id,
      weeks_pregnant: body.weeks_pregnant,
      blood_pressure_sys: body.blood_pressure_sys,
      blood_pressure_dia: body.blood_pressure_dia,
      hemoglobin: null,
      weight_kg: null,
      pulse_rate: null,
      symptoms: body.symptoms ?? null,
      recorded_at: body.recorded_at || new Date().toISOString(),
      risk_level: null,
      risk_score: null,
    };
    db.visits.push(visit);
    patient.visit_count += 1;
    patient.weeks_pregnant = body.weeks_pregnant;
    patient.last_visit_date = visit.recorded_at;
    patient.blood_pressure_sys = visit.blood_pressure_sys;
    patient.blood_pressure_dia = visit.blood_pressure_dia;
    return visit;
  }],

  ['POST', /^\/asha\/predict$/, (_p, body) => {
    const patient = patientOr404(body.patient_id);
    const flags = flagsFor(
      {
        id: patient.id,
        systolicBP: body.blood_pressure_sys,
        diastolicBP: body.blood_pressure_dia,
        age: body.age,
        gestationalWeeks: body.weeks_pregnant,
        history: '',
      },
      body.hemoglobin,
      body.weight_kg,
    );
    let [level, score] = predictRisk(body, flags);
    if (flags.includes('severe_anemia') && level === 'low') level = 'medium';
    if (flags.includes('hypertensive_crisis')) level = 'high';

    const assessment = {
      id: `${patient.id}-RA${db.assessments.length + 1}`,
      patient_id: patient.id,
      vitals_id: body.vitals_id ?? null,
      risk_level: level,
      risk_score: score,
      flags,
      model_version: 'demo-rules-v1',
      assessed_at: new Date().toISOString(),
    };
    db.assessments.push(assessment);
    patient.risk_level = level;
    patient.risk_score = score;
    patient.risk_assessment_count += 1;
    return assessment;
  }],

  ['GET', /^\/doctor\/referrals$/, () => db.referrals.map(referralListItem)],

  ['GET', /^\/doctor\/referrals\/([^/]+)$/, ([id]) => {
    const referral = db.referrals.find((r) => r.id === id);
    if (!referral) throw new DemoHttpError(404, 'Referral not found for this doctor.');
    const patient = patientOr404(referral.patient_id);
    const history = visitsFor(patient.id);
    return {
      referral: referralListItem(referral),
      patient,
      latest_vitals: history[0] || null,
      clinical_labs: db.labs[patient.id] || null,
      vitals_history: history,
      risk_assessments: db.assessments.filter((a) => a.patient_id === patient.id),
    };
  }],

  ['PATCH', /^\/doctor\/referrals\/([^/]+)\/status$/, ([id], body) => {
    const referral = db.referrals.find((r) => r.id === id);
    if (!referral) throw new DemoHttpError(404, 'Referral not found for this doctor.');
    if (body.status) {
      referral.status = body.status;
      referral.resolved_at = body.status === 'resolved' ? new Date().toISOString() : null;
      const patient = db.patients.find((p) => p.id === referral.patient_id);
      if (patient && body.status !== 'pending') {
        patient.pending_referral_count = Math.max(0, patient.pending_referral_count - 1);
      }
    }
    if (body.notes !== undefined) referral.notes = body.notes;
    return {
      id: referral.id,
      status: referral.status,
      notes: referral.notes,
      resolved_at: referral.resolved_at,
    };
  }],

  ['POST', /^\/doctor\/patients\/([^/]+)\/labs$/, ([id], body) => {
    patientOr404(id);
    db.labs[id] = {
      ...(db.labs[id] || {}),
      ...body,
      id: db.labs[id]?.id || `${id}-LAB`,
      patient_id: id,
      recorded_at: new Date().toISOString(),
    };
    return db.labs[id];
  }],

  ['POST', /^\/doctor\/patients\/([^/]+)\/refer$/, ([id]) => {
    const patient = patientOr404(id);
    const existing = db.referrals.find((r) => r.patient_id === id && r.status === 'pending');
    if (existing) return referralListItem(existing);
    const referral = {
      id: `REF-${String(db.referrals.length + 1).padStart(3, '0')}`,
      patient_id: id,
      asha_id: ASHA_ID,
      doctor_id: DOCTOR_ID,
      assessment_id: null,
      status: 'pending',
      notes: 'Re-referred by doctor.',
      referred_at: new Date().toISOString(),
      resolved_at: null,
    };
    db.referrals.unshift(referral);
    patient.pending_referral_count += 1;
    return referralListItem(referral);
  }],
];

/**
 * Serve one request. Returns the decoded body, or throws DemoHttpError.
 * @param {string} method
 * @param {string} path e.g. "/asha/patients/CP001/details"
 * @param {object|undefined} body
 */
export function handleDemoRequest(method, path, body) {
  for (const [routeMethod, pattern, handler] of ROUTES) {
    if (routeMethod !== method) continue;
    const match = pattern.exec(path);
    if (match) {
      const result = handler(match.slice(1).map(decodeURIComponent), body);
      // Handlers return live references into the store. Clone on the way out so
      // a caller holding a response cannot mutate demo state by editing it —
      // a real HTTP backend hands back a copy, and so should this.
      return structuredClone(result);
    }
  }
  throw new DemoHttpError(404, `No demo route for ${method} ${path}`);
}

export { DemoHttpError };
