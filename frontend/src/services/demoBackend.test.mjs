/**
 * Self-check for the demo backend. No test framework — run it with:
 *
 *   npm run test:demo
 *
 * which bundles through the esbuild that already ships with Vite and pipes it
 * into node. If this passes, a fresh clone with no backend still shows working
 * dashboards.
 */

import assert from 'node:assert/strict';
import { handleDemoRequest, resetDemoData, DemoHttpError } from './demoBackend.js';

const get = (path) => handleDemoRequest('GET', path);
const post = (path, body) => handleDemoRequest('POST', path, body);
const patch = (path, body) => handleDemoRequest('PATCH', path, body);

resetDemoData();

// ── Seed ──────────────────────────────────────────────────────────────────────
const patients = get('/asha/patients');
assert.equal(patients.length, 104, 'all clinical records are seeded');
assert.ok(
  ['critical', 'high'].includes(patients[0].risk_level),
  'highest risk sorts first, so the ASHA sees the urgent cases at the top',
);
assert.equal(patients.at(-1).risk_level, 'low', 'low risk sorts last');

// Every patient carries the fields normalizePatient() reads.
for (const p of patients) {
  for (const field of ['id', 'name', 'age', 'weeks_pregnant', 'village', 'risk_level']) {
    assert.ok(p[field] !== undefined, `patient ${p.id} has ${field}`);
  }
}

// ── Details ───────────────────────────────────────────────────────────────────
const details = get('/asha/patients/CP001/details');
assert.equal(details.patient.id, 'CP001');
assert.equal(details.visits.length, 3, 'three visits so the eclampsia gate is satisfiable');
assert.ok(
  new Date(details.visits[0].recorded_at) > new Date(details.visits[2].recorded_at),
  'visits come back newest first',
);

assert.throws(() => get('/asha/patients/NOPE/details'), DemoHttpError, 'unknown patient 404s');
try {
  get('/asha/patients/NOPE/details');
} catch (err) {
  assert.equal(err.status, 404);
}

// ── Eclampsia gate ────────────────────────────────────────────────────────────
const ecl = get('/asha/patients/CP002/eclampsia-risk');
assert.equal(ecl.eligible, true, 'three visits clears the minimum');
assert.equal(ecl.min_visits_required, 3);
// CP002 is 170/110 with headache + visual disturbance — the severe end of the set.
assert.ok(['high', 'critical'].includes(ecl.risk_level), `CP002 should be high, got ${ecl.risk_level}`);

// A patient created just now has no visit history and must be refused, not guessed at.
const fresh = post('/asha/patients', {
  name: 'Test Patient', age: 24, weeks_pregnant: 20, village: 'Padra',
});
const freshEcl = get(`/asha/patients/${fresh.id}/eclampsia-risk`);
assert.equal(freshEcl.eligible, false, 'no history means no trend prediction');
assert.equal(freshEcl.available_visits, 0);
assert.equal(freshEcl.risk_level, undefined, 'ineligible responses carry no risk level');

// ── Risk prediction mirrors backend/app/ml.py thresholds ──────────────────────
const severe = post('/asha/predict', {
  patient_id: 'CP001', blood_pressure_sys: 165, blood_pressure_dia: 112,
  hemoglobin: 10.5, weight_kg: 55, weeks_pregnant: 30, age: 28,
});
assert.equal(severe.risk_level, 'high', '>=160/110 is a hypertensive crisis');
assert.ok(severe.flags.includes('hypertensive_crisis'));

const normal = post('/asha/predict', {
  patient_id: 'CP001', blood_pressure_sys: 118, blood_pressure_dia: 74,
  hemoglobin: 12.5, weight_kg: 58, weeks_pregnant: 24, age: 26,
});
assert.equal(normal.risk_level, 'low', 'normal readings stay low');
assert.deepEqual(normal.flags, [], 'and raise no flags');

// Severe anaemia must escalate off low even when BP is fine.
const anaemic = post('/asha/predict', {
  patient_id: 'CP001', blood_pressure_sys: 115, blood_pressure_dia: 72,
  hemoglobin: 6.2, weight_kg: 52, weeks_pregnant: 22, age: 25,
});
assert.notEqual(anaemic.risk_level, 'low', 'Hb 6.2 must not read as low risk');
assert.ok(anaemic.flags.includes('severe_anemia'));

// ── ASHA referral reaches the doctor inbox ────────────────────────────────────
const inboxBefore = get('/doctor/referrals').length;
const referral = post('/asha/referrals', { patient_id: 'CP003', notes: 'BP climbing.' });
assert.equal(referral.status, 'pending');

const inboxAfter = get('/doctor/referrals');
assert.equal(inboxAfter.length, inboxBefore + 1, 'the referral crosses from ASHA to doctor');

const mine = inboxAfter.find((r) => r.id === referral.id);
assert.equal(mine.patient_name, get('/asha/patients/CP003/details').patient.name);
assert.equal(mine.latest_risk_level, 'safe', 'doctor view uses safe/monitor/elevated/critical');
assert.ok(mine.latest_bp_sys > 0, 'inbox rows carry the latest vitals for triage');

assert.equal(
  get('/asha/patients').find((p) => p.id === 'CP003').pending_referral_count,
  1,
  'the ASHA list shows the referral is outstanding',
);

// ── Doctor works the referral ─────────────────────────────────────────────────
const detail = get(`/doctor/referrals/${referral.id}`);
assert.equal(detail.patient.id, 'CP003');
assert.ok(detail.clinical_labs, 'labs are attached for the doctor');
assert.ok(detail.vitals_history.length >= 3);

const saved = post('/doctor/patients/CP003/labs', { sgot: 42, proteinuria: '2+' });
assert.equal(saved.sgot, 42);
assert.equal(saved.proteinuria, '2+');
assert.equal(
  get(`/doctor/referrals/${referral.id}`).clinical_labs.sgot, 42,
  'saved labs are readable back',
);

const resolved = patch(`/doctor/referrals/${referral.id}/status`, { status: 'resolved' });
assert.equal(resolved.status, 'resolved');
assert.ok(resolved.resolved_at, 'resolving stamps a time');
assert.equal(
  get('/asha/patients').find((p) => p.id === 'CP003').pending_referral_count,
  0,
  'resolving clears the outstanding count',
);

// Notes update without touching status.
const noted = patch(`/doctor/referrals/${referral.id}/status`, { notes: 'Admitted.' });
assert.equal(noted.notes, 'Admitted.');
assert.equal(noted.status, 'resolved', 'a notes-only patch leaves status alone');

// ── Visits recorded by the ASHA move the patient forward ──────────────────────
const before = get('/asha/patients/CP003/details');
post('/asha/patients/CP003/visits', {
  weeks_pregnant: before.patient.weeks_pregnant + 4,
  blood_pressure_sys: 150, blood_pressure_dia: 96, symptoms: 'Headache',
});
const after = get('/asha/patients/CP003/details');
assert.equal(after.visits.length, before.visits.length + 1);
assert.equal(after.patient.blood_pressure_sys, 150, 'latest reading is promoted to the patient row');
assert.equal(after.patient.weeks_pregnant, before.patient.weeks_pregnant + 4);

// ── Reset ─────────────────────────────────────────────────────────────────────
resetDemoData();
assert.equal(get('/asha/patients').length, 104, 'reset restores the seed');
assert.equal(get('/doctor/referrals').length, inboxBefore, 'including the referral list');

console.log('demoBackend self-check: all assertions passed');
