// ── Risk engine (mirrors the one in AshaDashboard) ──────────────────────────
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

// ── 20 Patients ─────────────────────────────────────────────────────────────
const raw = [
  // ── LOW RISK (10) ──────────────────────────────────────────────────────────
  {
    id: 'p_001', name: 'Priya Sharma',
    age: 26, gestationalWeeks: 24,
    systolicBP: 112, diastolicBP: 72,
    weight: 58, height: 157, hemoglobin: 12.5,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-18'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-18', 112, 72, 58, 'Routine checkup. All normal.'),
      visit('2026-03-04', 110, 70, 57, 'Iron supplements continued.'),
      visit('2026-02-18', 108, 68, 56, 'First trimester screen normal.'),
    ],
  },
  {
    id: 'p_002', name: 'Sunita Devi',
    age: 23, gestationalWeeks: 16,
    systolicBP: 108, diastolicBP: 68,
    weight: 54, height: 155, hemoglobin: 11.8,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: true,
    lastVisitDate: new Date('2026-03-20'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-20', 108, 68, 54, 'All normal. Folic acid advised.'),
      visit('2026-03-06', 106, 66, 53, 'First visit recorded.'),
    ],
  },
  {
    id: 'p_003', name: 'Geeta Yadav',
    age: 28, gestationalWeeks: 30,
    systolicBP: 118, diastolicBP: 76,
    weight: 62, height: 160, hemoglobin: 12.2,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-15'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-15', 118, 76, 62, 'Slight edema observed in feet. Normal.'),
      visit('2026-03-01', 116, 74, 61, 'Third trimester monitoring started.'),
      visit('2026-02-15', 114, 72, 60, 'Glucose tolerance test normal.'),
    ],
  },
  {
    id: 'p_004', name: 'Rekha Kumari',
    age: 22, gestationalWeeks: 12,
    systolicBP: 105, diastolicBP: 65,
    weight: 51, height: 152, hemoglobin: 12.8,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: true,
    lastVisitDate: new Date('2026-03-21'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-21', 105, 65, 51, 'First trimester. All clear.'),
      visit('2026-03-07', 104, 64, 50, 'Enrollment visit completed.'),
    ],
  },
  {
    id: 'p_005', name: 'Anita Gupta',
    age: 30, gestationalWeeks: 28,
    systolicBP: 116, diastolicBP: 74,
    weight: 64, height: 162, hemoglobin: 11.9,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-17'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-17', 116, 74, 64, 'Well-nourished. BP stable.'),
      visit('2026-03-03', 114, 72, 63, 'Counseled on birth preparedness.'),
      visit('2026-02-17', 112, 70, 62, 'Mid-pregnancy checkup normal.'),
    ],
  },
  {
    id: 'p_006', name: 'Kavita Singh',
    age: 25, gestationalWeeks: 20,
    systolicBP: 110, diastolicBP: 70,
    weight: 56, height: 158, hemoglobin: 12.4,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-19'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-19', 110, 70, 56, 'Anomaly scan booked.'),
      visit('2026-03-05', 108, 68, 55, 'All vitals normal.'),
    ],
  },
  {
    id: 'p_007', name: 'Savitri Patel',
    age: 27, gestationalWeeks: 34,
    systolicBP: 114, diastolicBP: 73,
    weight: 66, height: 159, hemoglobin: 12.1,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-16'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-16', 114, 73, 66, 'Late pregnancy checkup. Baby position cephalic.'),
      visit('2026-03-02', 112, 71, 65, 'Birth plan discussed.'),
      visit('2026-02-16', 110, 70, 64, 'Haemoglobin rechecked — normal.'),
    ],
  },
  {
    id: 'p_008', name: 'Lakshmi Verma',
    age: 24, gestationalWeeks: 10,
    systolicBP: 106, diastolicBP: 66,
    weight: 52, height: 154, hemoglobin: 13.0,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: true,
    lastVisitDate: new Date('2026-03-22'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-22', 106, 66, 52, 'Early pregnancy confirmed. Enrollment complete.'),
    ],
  },
  {
    id: 'p_009', name: 'Nirmala Joshi',
    age: 29, gestationalWeeks: 26,
    systolicBP: 115, diastolicBP: 75,
    weight: 60, height: 161, hemoglobin: 12.3,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-18'),
    ashaWorkerId: 'asha_03',
    visits: [
      visit('2026-03-18', 115, 75, 60, 'Routine visit. No concerns.'),
      visit('2026-03-04', 113, 73, 59, 'Protein intake counseled.'),
    ],
  },
  {
    id: 'p_010', name: 'Rani Chauhan',
    age: 26, gestationalWeeks: 22,
    systolicBP: 111, diastolicBP: 71,
    weight: 57, height: 156, hemoglobin: 12.6,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-19'),
    ashaWorkerId: 'asha_03',
    visits: [
      visit('2026-03-19', 111, 71, 57, 'All good. Nutrition counseling.'),
      visit('2026-03-05', 109, 69, 56, 'Second trimester check complete.'),
    ],
  },

  // ── MODERATE RISK (5) ──────────────────────────────────────────────────────
  {
    id: 'p_011', name: 'Meena Pandey',
    age: 33, gestationalWeeks: 30,
    systolicBP: 128, diastolicBP: 82,
    weight: 72, height: 158, hemoglobin: 10.2,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-10'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-10', 128, 82, 72, 'BP slightly elevated. Monitoring weekly.'),
      visit('2026-02-24', 124, 80, 71, 'Haemoglobin low — iron infusion advised.'),
      visit('2026-02-10', 122, 78, 70, 'Borderline BP. Rest advised.'),
    ],
  },
  {
    id: 'p_012', name: 'Radha Mishra',
    age: 29, gestationalWeeks: 36,
    systolicBP: 126, diastolicBP: 80,
    weight: 70, height: 160, hemoglobin: 11.1,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: true,
    lastVisitDate: new Date('2026-03-09'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-09', 126, 80, 70, 'Near term. Weekly monitoring.'),
      visit('2026-02-23', 124, 78, 69, 'First pregnancy — risk counseling done.'),
      visit('2026-02-09', 120, 76, 68, 'Glucose screen normal.'),
    ],
  },
  {
    id: 'p_013', name: 'Parvati Thakur',
    age: 36, gestationalWeeks: 28,
    systolicBP: 132, diastolicBP: 84,
    weight: 74, height: 156, hemoglobin: 10.8,
    previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-08'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-08', 132, 84, 74, 'Age >35. BP borderline. Doctor referral letter given.'),
      visit('2026-02-22', 128, 82, 73, 'Advanced age monitoring protocol started.'),
      visit('2026-02-08', 126, 80, 72, 'Third pregnancy, advanced age.'),
    ],
  },
  {
    id: 'p_014', name: 'Kamla Rawat',
    age: 30, gestationalWeeks: 34,
    systolicBP: 130, diastolicBP: 83,
    weight: 71, height: 157, hemoglobin: 10.5,
    previousPreeclampsia: true, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-07'),
    ashaWorkerId: 'asha_03',
    visits: [
      visit('2026-03-07', 130, 83, 71, 'Prior preeclampsia history. Borderline BP. Referred to PHC.'),
      visit('2026-02-21', 128, 80, 70, 'Urine protein — trace. Monitoring intensified.'),
      visit('2026-02-07', 126, 78, 69, 'Second pregnancy. History of preeclampsia noted.'),
    ],
  },
  {
    id: 'p_015', name: 'Durga Nair',
    age: 34, gestationalWeeks: 26,
    systolicBP: 129, diastolicBP: 81,
    weight: 78, height: 162, hemoglobin: 10.9,
    previousPreeclampsia: false, diabetes: true, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-12'),
    ashaWorkerId: 'asha_03',
    visits: [
      visit('2026-03-12', 129, 81, 78, 'Diabetes history. BP monitoring twice weekly.'),
      visit('2026-02-26', 127, 79, 77, 'HbA1c checked — controlled. Continue monitoring.'),
      visit('2026-02-12', 125, 77, 76, 'Gestational diabetes screen done.'),
    ],
  },

  // ── HIGH RISK (3) ──────────────────────────────────────────────────────────
  {
    id: 'p_016', name: 'Sarita Chaudhary',
    age: 37, gestationalWeeks: 32,
    systolicBP: 142, diastolicBP: 92,
    weight: 78, height: 155, hemoglobin: 9.8,
    previousPreeclampsia: true, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-06'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-06', 142, 92, 78, 'High BP. Referred to district hospital urgently.'),
      visit('2026-02-20', 138, 90, 77, 'Doctor visit completed. Medication started.'),
      visit('2026-02-06', 134, 88, 76, 'BP rising trend. History of preeclampsia.'),
    ],
  },
  {
    id: 'p_017', name: 'Babita Agarwal',
    age: 34, gestationalWeeks: 36,
    systolicBP: 138, diastolicBP: 90,
    weight: 80, height: 158, hemoglobin: 10.2,
    previousPreeclampsia: true, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-05'),
    ashaWorkerId: 'asha_03',
    visits: [
      visit('2026-03-05', 138, 90, 80, 'Near term + prior preeclampsia. Hospitalization discussed.'),
      visit('2026-02-19', 135, 88, 79, 'Fetal kick count teaching done.'),
      visit('2026-02-05', 132, 86, 78, 'Antihypertensive dose adjusted by doctor.'),
    ],
  },
  {
    id: 'p_018', name: 'Sushila Pandey',
    age: 38, gestationalWeeks: 26,
    systolicBP: 145, diastolicBP: 95,
    weight: 82, height: 160, hemoglobin: 9.5,
    previousPreeclampsia: false, diabetes: true, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-04'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-04', 145, 95, 82, 'Age >35 + diabetes + high BP. Urgent referral issued.'),
      visit('2026-02-18', 140, 92, 81, 'BP rising. Antihypertensive started.'),
      visit('2026-02-04', 136, 88, 80, 'Advanced age + diabetes risk counseling.'),
    ],
  },

  // ── CRITICAL RISK (2) ─────────────────────────────────────────────────────
  {
    id: 'p_019', name: 'Pushpa Saxena',
    age: 39, gestationalWeeks: 35,
    systolicBP: 162, diastolicBP: 108,
    weight: 84, height: 156, hemoglobin: 8.8,
    previousPreeclampsia: true, diabetes: false, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-10'),
    ashaWorkerId: 'asha_02',
    visits: [
      visit('2026-03-10', 162, 108, 84, 'CRITICAL. Ambulance called. Admitted to district hospital.'),
      visit('2026-02-24', 155, 102, 83, 'Severe hypertension. Labetalol given. Emergency referral.'),
      visit('2026-02-10', 148, 98, 82, 'BP critically high. Doctor notified.'),
    ],
  },
  {
    id: 'p_020', name: 'Malti Verma',
    age: 41, gestationalWeeks: 33,
    systolicBP: 168, diastolicBP: 115,
    weight: 86, height: 153, hemoglobin: 9.2,
    previousPreeclampsia: true, diabetes: true, firstPregnancy: false,
    lastVisitDate: new Date('2026-03-08'),
    ashaWorkerId: 'asha_01',
    visits: [
      visit('2026-03-08', 168, 115, 86, 'CRITICAL. Multiple risk factors. Emergency admission.'),
      visit('2026-02-22', 160, 110, 85, 'BP severely elevated. Magnesium sulphate admin. Referred.'),
      visit('2026-02-08', 152, 105, 84, 'Preeclampsia with severe features. Urgent referral.'),
    ],
  },
];

// Attach computed riskLevel to each patient
export const mockPatients = raw.map(p => ({
  ...p,
  riskLevel: computeRisk(p),
}));

// ── Convenience helpers ──────────────────────────────────────────────────────

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

export const demoMotherPatient = mockPatients[0]; // Priya Sharma — low risk, week 24
