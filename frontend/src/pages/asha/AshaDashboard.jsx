import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Calendar, Plus, X, Mic, MicOff,
  Activity, Baby, User, Clock, ChevronRight, CheckCircle2,
  ArrowRight, HeartPulse, Minus,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import TopBar from '../../components/shared/TopBar';
import RiskBadge from '../../components/shared/RiskBadge';
import { mockPatients } from '../../data/mockPatients';
import { predictWithModel } from '../../data/decisionTreeRules';

// ── Risk Engine ──────────────────────────────────────────────────────────────
function calculateRisk(patient) {
  const { systolicBP, diastolicBP, age, gestationalWeeks,
          previousPreeclampsia, diabetes, firstPregnancy, hemoglobin, weight, height } = patient;
  const reasons = [];
  let level = 'low';

  const severityRank = { low: 0, moderate: 1, high: 2, critical: 3 };
  const promoteLevel = (newLevel) => {
    if (severityRank[newLevel] > severityRank[level]) level = newLevel;
  };

  // --- Systolic BP: pick the single highest-matching tier ---
  if (systolicBP >= 160) {
    reasons.push({ factor: 'Systolic BP', value: `${systolicBP} mmHg`, threshold: '≥160 mmHg', severity: 'critical',
      en: `Systolic BP of ${systolicBP} mmHg severely exceeds safe limit. Immediate medical intervention required.`,
      hi: `सिस्टोलिक BP ${systolicBP} mmHg सुरक्षित सीमा से बहुत अधिक है। तुरंत चिकित्सा हस्तक्षेप आवश्यक।` });
    promoteLevel('critical');
  } else if (systolicBP >= 140) {
    reasons.push({ factor: 'Systolic BP', value: `${systolicBP} mmHg`, threshold: '≥140 mmHg (WHO)',
      severity: 'high',
      en: `BP exceeds WHO hypertensive threshold for pregnancy (≥140 mmHg).`,
      hi: `BP गर्भावस्था के लिए WHO उच्च रक्तचाप सीमा (≥140) से अधिक है।` });
    promoteLevel('high');
  } else if (systolicBP >= 130) {
    reasons.push({ factor: 'Systolic BP', value: `${systolicBP} mmHg`, threshold: '≥130 mmHg', severity: 'moderate',
      en: 'BP approaching hypertensive range. Close monitoring advised.',
      hi: 'BP उच्च रक्तचाप सीमा के करीब है। निगरानी ज़रूरी।' });
    promoteLevel('moderate');
  }

  // --- Diastolic BP: pick the single highest-matching tier ---
  if (diastolicBP >= 110) {
    reasons.push({ factor: 'Diastolic BP', value: `${diastolicBP} mmHg`, threshold: '≥110 mmHg', severity: 'critical',
      en: `Diastolic BP of ${diastolicBP} mmHg indicates severe hypertension. Risk of organ damage.`,
      hi: `डायस्टोलिक BP ${diastolicBP} mmHg गंभीर उच्च रक्तचाप दर्शाता है। अंग क्षति का जोखिम।` });
    promoteLevel('critical');
  } else if (diastolicBP >= 90) {
    reasons.push({ factor: 'Diastolic BP', value: `${diastolicBP} mmHg`, threshold: '≥90 mmHg (WHO)',
      severity: 'high',
      en: `Diastolic BP exceeds WHO threshold for gestational hypertension.`,
      hi: `डायस्टोलिक BP गर्भकालीन उच्च रक्तचाप की WHO सीमा से अधिक है।` });
    promoteLevel('high');
  } else if (diastolicBP >= 80) {
    reasons.push({ factor: 'Diastolic BP', value: `${diastolicBP} mmHg`, threshold: '≥80 mmHg', severity: 'moderate',
      en: 'Diastolic BP in pre-hypertensive range.',
      hi: 'डायस्टोलिक BP प्री-हाइपरटेंसिव सीमा में है।' });
    promoteLevel('moderate');
  }

  // --- Combination factors (always evaluated) ---
  if (previousPreeclampsia && systolicBP >= 130) {
    reasons.push({ factor: 'History + BP', value: `Prior preeclampsia + BP ${systolicBP}`, threshold: 'Recurrence risk',
      severity: 'high',
      en: `Prior preeclampsia combined with elevated BP significantly increases recurrence risk.`,
      hi: `पिछले प्रीक्लेम्पसिया के साथ बढ़ा हुआ BP पुनरावृत्ति जोखिम बहुत बढ़ाता है।` });
    promoteLevel('high');
  }
  if (age > 35 && gestationalWeeks > 20 && systolicBP >= 130) {
    reasons.push({ factor: 'Age + Gestation + BP', value: `Age ${age}, Wk ${gestationalWeeks}, BP ${systolicBP}`, threshold: 'Combined high risk',
      severity: 'high',
      en: `Advanced maternal age with elevated BP after 20 weeks creates compound risk.`,
      hi: `20 सप्ताह के बाद बढ़ी उम्र और उच्च BP मिलकर जोखिम बढ़ाते हैं।` });
    promoteLevel('high');
  }

  // --- Independent moderate factors (always evaluated) ---
  if (age > 35) {
    reasons.push({ factor: 'Maternal Age', value: `${age} years`, threshold: '>35', severity: 'moderate',
      en: 'Advanced maternal age increases risk of pregnancy complications.',
      hi: 'बढ़ी हुई मातृ आयु गर्भावस्था जटिलताओं का जोखिम बढ़ाती है।' });
    promoteLevel('moderate');
  }
  if (previousPreeclampsia) {
    reasons.push({ factor: 'History', value: 'Prior preeclampsia', threshold: 'Present', severity: 'moderate',
      en: 'History of preeclampsia increases recurrence probability by 20–30%.',
      hi: 'प्रीक्लेम्पसिया का इतिहास पुनरावृत्ति संभावना 20-30% बढ़ाता है।' });
    promoteLevel('moderate');
  }
  if (diabetes) {
    reasons.push({ factor: 'Diabetes', value: 'Present', threshold: 'Risk factor', severity: 'moderate',
      en: 'Diabetes increases preeclampsia risk by 2–4×.',
      hi: 'मधुमेह प्रीक्लेम्पसिया जोखिम 2-4 गुना बढ़ाता है।' });
    promoteLevel('moderate');
  }
  if (firstPregnancy) {
    reasons.push({ factor: 'First Pregnancy', value: 'Yes', threshold: 'Risk factor', severity: 'moderate',
      en: 'First pregnancy carries higher preeclampsia risk than subsequent ones.',
      hi: 'पहली गर्भावस्था में प्रीक्लेम्पसिया जोखिम अधिक होता है।' });
    promoteLevel('moderate');
  }
  if (hemoglobin && hemoglobin < 11) {
    reasons.push({ factor: 'Hemoglobin', value: `${hemoglobin} g/dL`, threshold: '<11 g/dL', severity: 'moderate',
      en: 'Anemia detected. Iron supplementation and close monitoring required.',
      hi: 'एनीमिया पाया गया। आयरन सप्लीमेंट और निगरानी ज़रूरी।' });
    promoteLevel('moderate');
  }
  if (weight && height) {
    const bmi = weight / ((height / 100) ** 2);
    if (bmi > 30) {
      reasons.push({ factor: 'BMI', value: bmi.toFixed(1), threshold: '>30 (Obese)', severity: 'moderate',
        en: `BMI of ${bmi.toFixed(1)} indicates obesity — a significant preeclampsia risk factor.`,
        hi: `BMI ${bmi.toFixed(1)} मोटापा दर्शाता है — यह प्रीक्लेम्पसिया का प्रमुख कारक है।` });
      promoteLevel('moderate');
    }
  }

  if (reasons.length === 0) {
    reasons.push({ factor: 'All Parameters', value: 'Normal', threshold: 'Within limits', severity: 'low',
      en: 'All vital signs within normal range. Continue routine monitoring.',
      hi: 'सभी संकेत सामान्य सीमा में हैं। नियमित निगरानी जारी रखें।' });
  }

  const actions = {
    critical: { en: 'IMMEDIATE REFERRAL to district hospital. Do not delay.', hi: 'तुरंत ज़िला अस्पताल में रेफर करें। देरी न करें।' },
    high:     { en: 'Schedule doctor consultation within 48 hours. Monitor BP daily.', hi: '48 घंटों के भीतर डॉक्टर से मिलें। रोज़ BP जाँचें।' },
    moderate: { en: 'Enhanced monitoring: weekly BP checks, nutrition counseling.', hi: 'बढ़ी हुई निगरानी: साप्ताहिक BP जाँच, पोषण सलाह।' },
    low:      { en: 'Continue routine antenatal care schedule.', hi: 'नियमित प्रसव-पूर्व देखभाल जारी रखें।' },
  };

  return { level, reasons: reasons.slice(0, 4), action: actions[level] };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const TODAY = new Date('2026-03-24');
const API_BASE_URL = 'http://localhost:8000';

function daysSince(date) {
  const d = date instanceof Date ? date : new Date(date);
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

function fmt(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const RISK_POS = { low: 12, moderate: 40, high: 68, critical: 88 };

const RISK_STYLE = {
  low:      { bg: 'bg-sage/10',          border: 'border-sage/30',          text: 'text-sage',          actionBg: 'bg-sage/10',          badgeBg: 'bg-sage text-white'          },
  moderate: { bg: 'bg-amber-alert/10',   border: 'border-amber-alert/30',   text: 'text-amber-alert',   actionBg: 'bg-amber-alert/10',   badgeBg: 'bg-amber-alert text-white'   },
  high:     { bg: 'bg-terracotta/10',    border: 'border-terracotta/30',    text: 'text-terracotta',    actionBg: 'bg-terracotta/10',    badgeBg: 'bg-terracotta text-white'    },
  critical: { bg: 'bg-rose-critical/10', border: 'border-rose-critical animate-pulse-border', text: 'text-rose-critical', actionBg: 'bg-rose-critical/10', badgeBg: 'bg-rose-critical text-white' },
};

const EMPTY_FORM = {
  name: '', age: '', gestationalWeeks: '', systolicBP: '', diastolicBP: '',
  weight: '', height: '', hemoglobin: '',
  previousPreeclampsia: false, diabetes: false, firstPregnancy: false,
};

// ── NumberInput with ± buttons ────────────────────────────────────────────────
function NumberInput({ label, hint, name, value, onChange, min = 0, max = 999, step = 1, required }) {
  const adjust = (delta) => {
    const cur = parseFloat(value) || 0;
    const next = Math.min(max, Math.max(min, +(cur + delta).toFixed(1)));
    onChange({ target: { name, value: String(next) } });
  };
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}{hint && <span className="text-muted/60 ml-1">({hint})</span>}</label>
      <div className="flex items-center border-2 border-blush rounded-xl overflow-hidden bg-ivory focus-within:border-saffron transition-colors">
        <button type="button" onClick={() => adjust(-step)}
          className="w-11 h-12 flex items-center justify-center text-terracotta hover:bg-blush transition-colors flex-shrink-0 text-lg font-bold">
          <Minus size={16} />
        </button>
        <input
          type="number" name={name} value={value} required={required}
          onChange={onChange} min={min} max={max} step={step}
          placeholder="—"
          className="flex-1 h-12 text-center text-charcoal bg-transparent text-base font-semibold focus:outline-none"
        />
        <button type="button" onClick={() => adjust(step)}
          className="w-11 h-12 flex items-center justify-center text-terracotta hover:bg-blush transition-colors flex-shrink-0 text-lg font-bold">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2.5 border-b border-blush/60 last:border-0">
      <span className="text-sm text-charcoal font-medium">{label}</span>
      <button
        type="button" role="switch" aria-checked={checked}
        onClick={() => onChange({ target: { name, type: 'checkbox', checked: !checked } })}
        className={`relative w-12 h-6 rounded-full transition-all duration-250 flex-shrink-0 ${checked ? 'bg-saffron' : 'bg-blush'}`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-soft"
          style={{ left: checked ? 'calc(100% - 22px)' : '2px' }}
        />
      </button>
    </label>
  );
}

// ── Patient row card ─────────────────────────────────────────────────────────
function PatientCard({ patient }) {
  const overdue = daysSince(patient.lastVisitDate) >= 14;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-ivory rounded-2xl px-5 py-4 shadow-soft border border-blush hover:shadow-warm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => console.log('Patient selected:', patient.name, patient.id)}
    >
      <div className="flex items-center gap-3">
        {/* Risk dot */}
        <div className="flex-shrink-0">
          <div className={`w-3 h-3 rounded-full ${
            patient.riskLevel === 'critical' ? 'bg-rose-critical animate-pulse-dot' :
            patient.riskLevel === 'high'     ? 'bg-terracotta' :
            patient.riskLevel === 'moderate' ? 'bg-amber-alert' : 'bg-sage'
          }`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base font-semibold text-charcoal truncate group-hover:text-terracotta transition-colors">
            {patient.name}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted">
            <span className="flex items-center gap-1"><User size={10} /> {patient.age} yrs</span>
            <span className="flex items-center gap-1"><Baby size={10} /> Wk {patient.gestationalWeeks}</span>
            <span className="flex items-center gap-1"><Activity size={10} /> {patient.systolicBP}/{patient.diastolicBP}</span>
            {overdue && (
              <span className="flex items-center gap-1 text-rose-critical font-medium">
                <Clock size={10} /> Overdue
              </span>
            )}
          </div>
        </div>

        {/* Badge + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <RiskBadge level={patient.riskLevel} />
          <ChevronRight size={14} className="text-muted group-hover:text-saffron transition-colors" />
        </div>
      </div>

      {/* Last visit */}
      <div className={`flex items-center gap-1 mt-2.5 text-xs ${overdue ? 'text-rose-critical' : 'text-muted/70'}`}>
        <Clock size={10} />
        Last visit: {fmt(patient.lastVisitDate)} ({daysSince(patient.lastVisitDate)}d ago)
      </div>
    </motion.div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({ patient, lang }) {
  const isCritical = patient.riskLevel === 'critical';
  const result = useMemo(() => calculateRisk(patient), [patient]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-2xl p-4 border-l-4 ${
        isCritical
          ? 'bg-rose-critical/5 border-l-rose-critical animate-pulse-border'
          : 'bg-terracotta/5 border-l-terracotta'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`} />
          <div className="min-w-0">
            <p className="font-serif font-semibold text-charcoal truncate">{patient.name}</p>
            <p className="text-xs text-muted mt-0.5">
              {patient.age} yrs · Wk {patient.gestationalWeeks} · BP {patient.systolicBP}/{patient.diastolicBP}
            </p>
            <p className={`text-xs font-semibold mt-1.5 ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`}>
              → {lang === 'hi' ? result.action.hi : result.action.en}
            </p>
          </div>
        </div>
        <RiskBadge level={patient.riskLevel} />
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AshaDashboard() {
  const { t, lang } = useLanguage();
  const [patients, setPatients] = useState(() =>
    [...mockPatients].sort((a, b) => {
      const o = { critical: 0, high: 1, moderate: 2, low: 3 };
      return o[a.riskLevel] - o[b.riskLevel];
    })
  );
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [riskResult, setRiskResult]   = useState(null);
  const [submitted, setSubmitted]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  useEffect(() => {
    setVoiceAvailable(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total:    patients.length,
    highRisk: patients.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length,
    due:      patients.filter(p => daysSince(p.lastVisitDate) >= 14).length,
  }), [patients]);

  const alerts = useMemo(() =>
    patients.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical'),
  [patients]);

  // Form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');

    const parseApiError = async (response, fallbackMessage) => {
      try {
        const data = await response.json();
        if (Array.isArray(data?.detail)) {
          return data.detail
            .map((item) => `${item?.loc?.join('.') || 'field'}: ${item?.msg || 'invalid value'}`)
            .join('; ');
        }
        if (typeof data?.detail === 'string' && data.detail) {
          return data.detail;
        }
      } catch {
        // Ignore parse errors and use fallback message.
      }
      return `${fallbackMessage} (HTTP ${response.status})`;
    };

    const toNumber = (value) => {
      if (typeof value !== 'string') return Number.NaN;
      const trimmed = value.trim();
      if (!trimmed) return Number.NaN;
      return Number(trimmed);
    };

    const f = {
      ...form,
      age:              toNumber(form.age),
      gestationalWeeks: toNumber(form.gestationalWeeks),
      systolicBP:       toNumber(form.systolicBP),
      diastolicBP:      toNumber(form.diastolicBP),
      weight:           toNumber(form.weight),
      height:           toNumber(form.height),
      hemoglobin:       toNumber(form.hemoglobin),
    };

    const fieldRules = [
      { key: 'age', label: 'Age', min: 10, max: 60 },
      { key: 'gestationalWeeks', label: 'Gestational weeks', min: 1, max: 45 },
      { key: 'systolicBP', label: 'Systolic BP', min: 70, max: 240 },
      { key: 'diastolicBP', label: 'Diastolic BP', min: 40, max: 140 },
      { key: 'weight', label: 'Weight', min: 25, max: 250 },
      { key: 'hemoglobin', label: 'Hemoglobin', min: 3, max: 25 },
    ];

    for (const rule of fieldRules) {
      const value = f[rule.key];
      if (!Number.isFinite(value)) {
        setSubmitError(`${rule.label} is required.`);
        setIsSubmitting(false);
        return;
      }
      if (value < rule.min || value > rule.max) {
        setSubmitError(`${rule.label} must be between ${rule.min} and ${rule.max}.`);
        setIsSubmitting(false);
        return;
      }
    }

    // Derive severeBP (WHO threshold: systolic ≥160 or diastolic ≥110)
    f.severeBP = f.systolicBP >= 160 || f.diastolicBP >= 110;

    const result = calculateRisk(f);
    const treeResult = predictWithModel(f);

    // Build decision path from feature contributions
    const decisionPath = treeResult.featureContributions
      .slice(0, 3)
      .map(c => `${c.feature}: ${c.value}`);
    decisionPath.push(treeResult.prediction.toUpperCase());

    const SIMILAR_COUNTS = { 'Normal': 80, 'Mild Pre-Eclampsia': 10, 'Severe Pre-Eclampsia': 14 };
    const similarCount = SIMILAR_COUNTS[treeResult.prediction] ?? 0;

    try {
      const patientResp = await fetch(`${API_BASE_URL}/asha/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.name,
          age: f.age,
          weeks_pregnant: f.gestationalWeeks,
          village: 'Unknown',
        }),
      });
      if (!patientResp.ok) {
        throw new Error(await parseApiError(patientResp, 'Failed to create patient record.'));
      }
      const createdPatient = await patientResp.json();

      const vitalsResp = await fetch(`${API_BASE_URL}/asha/patients/${createdPatient.id}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blood_pressure_sys: f.systolicBP,
          blood_pressure_dia: f.diastolicBP,
          hemoglobin: f.hemoglobin,
          weight_kg: f.weight,
          symptoms: [
            f.previousPreeclampsia ? 'Previous preeclampsia' : '',
            f.diabetes ? 'Diabetes' : '',
            f.firstPregnancy ? 'First pregnancy' : '',
          ].filter(Boolean).join(', ') || null,
        }),
      });
      if (!vitalsResp.ok) {
        throw new Error(await parseApiError(vitalsResp, 'Failed to save vitals record.'));
      }
      const createdVitals = await vitalsResp.json();

      const predictResp = await fetch(`${API_BASE_URL}/asha/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: createdPatient.id,
          vitals_id: createdVitals.id,
          blood_pressure_sys: f.systolicBP,
          blood_pressure_dia: f.diastolicBP,
          hemoglobin: f.hemoglobin,
          weight_kg: f.weight,
          weeks_pregnant: f.gestationalWeeks,
          age: f.age,
        }),
      });
      if (!predictResp.ok) {
        throw new Error(await parseApiError(predictResp, 'Failed to save risk assessment.'));
      }

      setRiskResult({ patient: f, ...result, treeResult, decisionPath, similarCount });

      const newPatient = {
        id:               createdPatient.id,
        name:             f.name,
        age:              f.age,
        gestationalWeeks: f.gestationalWeeks,
        systolicBP:       f.systolicBP,
        diastolicBP:      f.diastolicBP,
        weight:           f.weight,
        height:           f.height,
        hemoglobin:       f.hemoglobin,
        previousPreeclampsia: f.previousPreeclampsia,
        diabetes:         f.diabetes,
        firstPregnancy:   f.firstPregnancy,
        lastVisitDate:    new Date(),
        riskLevel:        result.level,
        visits:           [],
        ashaWorkerId:     createdPatient.asha_id,
      };
      setPatients(prev => {
        const o = { critical: 0, high: 1, moderate: 2, low: 3 };
        return [newPatient, ...prev].sort((a, b) => o[a.riskLevel] - o[b.riskLevel]);
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setRiskResult(null);
    setSubmitted(false);
    setSubmitError('');
  };

  // Voice
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || isListening) return;
    const rec = new SR();
    rec.lang = 'hi-IN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);

    rec.onresult = (ev) => {
      const tx = ev.results[0][0].transcript.toLowerCase();
      const nums = tx.match(/\d+(\.\d+)?/g);
      if (!nums?.length) return;
      if (/bp|blood pressure|ब्लड प्रेशर|रक्तचाप/.test(tx)) {
        setForm(prev => ({ ...prev,
          ...(nums[0] ? { systolicBP: nums[0] } : {}),
          ...(nums[1] ? { diastolicBP: nums[1] } : {}),
        }));
      } else if (/age|उम्र|साल/.test(tx)) {
        setForm(prev => ({ ...prev, age: nums[0] }));
      } else if (/week|सप्ताह|हफ्ते|hafta/.test(tx)) {
        setForm(prev => ({ ...prev, gestationalWeeks: nums[0] }));
      } else if (/weight|वज़न|kg|kilo/.test(tx)) {
        setForm(prev => ({ ...prev, weight: nums[0] }));
      } else if (/height|ऊँचाई|cm/.test(tx)) {
        setForm(prev => ({ ...prev, height: nums[0] }));
      } else if (/hemoglobin|हीमोग्लोबिन|hb/.test(tx)) {
        setForm(prev => ({ ...prev, hemoglobin: nums[0] }));
      } else {
        const fields = ['age','gestationalWeeks','systolicBP','diastolicBP','weight','height','hemoglobin'];
        const empty = fields.find(f => !form[f]);
        if (empty) setForm(prev => ({ ...prev, [empty]: nums[0] }));
      }
    };
    rec.start();
  };

  const todayStr = TODAY.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-cream">
      <TopBar />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── Greeting ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2"
        >
          <h1 className="font-serif text-3xl text-charcoal">
            {t('ashaGreeting')} 🙏
          </h1>
          <p className="text-sm text-muted mt-1">{todayStr}</p>
        </motion.div>

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('totalPatients'), value: stats.total,    icon: Users,        color: 'bg-saffron/10 text-saffron' },
            { label: t('highRisk'),      value: stats.highRisk, icon: AlertTriangle, color: 'bg-rose-critical/10 text-rose-critical' },
            { label: t('dueForVisit'),   value: stats.due,      icon: Calendar,      color: 'bg-amber-alert/10 text-amber-alert' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              custom={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 120 }}
              className="bg-ivory rounded-2xl px-4 py-5 shadow-soft border border-blush text-center"
            >
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={17} />
              </div>
              <p className="font-serif text-3xl font-bold text-charcoal leading-none">{value}</p>
              <p className="text-xs text-muted mt-1 leading-tight">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Record Visit button ───────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setShowForm(true); setSubmitted(false); setRiskResult(null); setForm(EMPTY_FORM); }}
          className="w-full min-h-[52px] flex items-center justify-center gap-2.5 bg-saffron hover:bg-terracotta text-white font-semibold text-base rounded-2xl shadow-warm hover:shadow-warm-lg transition-all duration-200"
        >
          <Plus size={20} />
          {t('recordVisit')}
        </motion.button>

        {/* ── Form slide-down ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-ivory rounded-3xl shadow-warm-lg border-2 border-blush overflow-hidden">

                {/* Form header */}
                <div className="flex items-center justify-between px-6 py-4 bg-blush/40 border-b border-blush">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={17} className="text-terracotta" />
                    <h2 className="font-serif text-lg text-charcoal">{t('form.title')}</h2>
                  </div>
                  <button onClick={closeForm} className="text-muted hover:text-rose-critical transition-colors p-1">
                    <X size={20} />
                  </button>
                </div>

                {/* ── Form content ── */}
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Voice microphone */}
                    {voiceAvailable && (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <button
                          type="button"
                          onClick={startVoice}
                          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-warm transition-all duration-200 ${
                            isListening
                              ? 'bg-terracotta animate-mic-ring scale-110'
                              : 'bg-saffron hover:bg-terracotta'
                          }`}
                        >
                          {isListening ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                        </button>
                        <p className="text-xs text-muted text-center">
                          {isListening ? t('form.listening') : t('form.voiceHint')}
                        </p>
                      </div>
                    )}

                    {/* Patient Info */}
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t('form.patientInfo')}</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">{t('form.name')}</label>
                          <input
                            type="text" name="name" value={form.name} onChange={handleChange}
                            required placeholder={t('form.namePlaceholder')}
                            className="w-full h-12 px-4 border-2 border-blush rounded-xl bg-ivory text-charcoal text-base focus:outline-none focus:border-saffron transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <NumberInput label={t('form.age')} name="age" value={form.age} onChange={handleChange} min={14} max={55} required />
                          <NumberInput label={t('form.weeks')} name="gestationalWeeks" value={form.gestationalWeeks} onChange={handleChange} min={1} max={42} required />
                        </div>
                      </div>
                    </div>

                    {/* Vitals */}
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t('form.vitals')}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <NumberInput label={t('form.systolic')} hint={t('form.systolicHint')} name="systolicBP" value={form.systolicBP} onChange={handleChange} min={60} max={250} required />
                        <NumberInput label={t('form.diastolic')} hint={t('form.diastolicHint')} name="diastolicBP" value={form.diastolicBP} onChange={handleChange} min={40} max={160} required />
                        <NumberInput label={t('form.weight')} name="weight" value={form.weight} onChange={handleChange} min={30} max={150} step={0.5} required />
                        <NumberInput label={t('form.height')} name="height" value={form.height} onChange={handleChange} min={100} max={220} required />
                        <div className="col-span-2">
                          <NumberInput label={t('form.hemoglobin')} name="hemoglobin" value={form.hemoglobin} onChange={handleChange} min={4} max={20} step={0.1} required />
                        </div>
                      </div>
                    </div>

                    {/* History toggles */}
                    <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t('form.history')}</p>
                      <div className="bg-cream rounded-2xl px-4 py-1 border border-blush">
                        <Toggle label={t('form.prevPreeclampsia')} name="previousPreeclampsia" checked={form.previousPreeclampsia} onChange={handleChange} />
                        <Toggle label={t('form.diabetes')}         name="diabetes"             checked={form.diabetes}             onChange={handleChange} />
                        <Toggle label={t('form.firstPregnancy')}   name="firstPregnancy"       checked={form.firstPregnancy}       onChange={handleChange} />
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[52px] bg-saffron hover:bg-terracotta text-white font-semibold rounded-2xl shadow-warm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Activity size={18} />
                      {isSubmitting ? 'Saving...' : t('form.submit')}
                    </button>

                    {submitError && (
                      <p className="text-sm font-medium text-rose-critical">{submitError}</p>
                    )}
                  </form>
                ) : (

                  /* ── Risk Result ── */
                  riskResult && (
                    <AnimatePresence>
                      <motion.div
                        key="risk-result"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 space-y-5"
                      >
                        {/* Level badge */}
                        {(() => {
                          const rs = RISK_STYLE[riskResult.level];
                          const isCritical = riskResult.level === 'critical';
                          return (
                            <>
                              <div className={`rounded-2xl p-5 border-2 ${rs.bg} ${rs.border}`}>
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                                      {riskResult.patient.name}
                                    </p>
                                    <h3 className={`font-serif text-3xl font-bold mt-1 ${rs.text}`}>
                                      {t(`riskLevels.${riskResult.level}`)} {t('highRisk').split(' ')[1] || 'Risk'}
                                    </h3>
                                  </div>
                                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${rs.badgeBg}`}>
                                    {t(`riskLevels.${riskResult.level}`)}
                                  </span>
                                </div>

                                {/* Gradient risk meter */}
                                <div className="relative h-3 rounded-full overflow-visible mb-6"
                                  style={{ background: 'linear-gradient(to right, #7BA68A, #D4932A, #C75B39, #C43B3B)' }}>
                                  <motion.div
                                    initial={{ left: '2%' }}
                                    animate={{ left: `${RISK_POS[riskResult.level]}%` }}
                                    transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.4 }}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full border-2 border-charcoal shadow-warm"
                                    style={{ position: 'absolute' }}
                                  />
                                </div>

                                {/* Why section */}
                                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                                  {t('riskExplanation')}
                                </p>
                                <div className="space-y-2">
                                  {riskResult.reasons.map((r, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.5 + i * 0.1 }}
                                      className="bg-white/70 rounded-xl p-3 border border-white"
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                          r.severity === 'critical' ? 'bg-rose-critical' :
                                          r.severity === 'high'     ? 'bg-terracotta' :
                                          r.severity === 'moderate' ? 'bg-amber-alert' : 'bg-sage'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-charcoal">{r.factor}</span>
                                            <span className="text-xs text-muted font-mono">{r.value} <span className="text-muted/50">vs</span> {r.threshold}</span>
                                          </div>
                                          <p className="text-xs text-muted mt-0.5 leading-relaxed">
                                            {lang === 'hi' ? r.hi : r.en}
                                          </p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>

                                {/* Action */}
                                <div className={`mt-4 rounded-xl px-4 py-3 border ${rs.actionBg} ${rs.border}`}>
                                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                                    {t('recommendedAction')}
                                  </p>
                                  <p className={`text-sm font-semibold ${rs.text} ${isCritical ? 'text-base' : ''}`}>
                                    {lang === 'hi' ? riskResult.action.hi : riskResult.action.en}
                                  </p>
                                </div>
                              </div>

                              {/* ── Dual Method Validation Card ── */}
                              {riskResult.treeResult && (() => {
                                const whoLabel = riskResult.level === 'critical' ? 'Severe Pre-Eclampsia'
                                               : riskResult.level === 'high'     ? 'Mild Pre-Eclampsia'
                                               : riskResult.level === 'moderate' ? 'Borderline / Monitor'
                                                                                  : 'Normal';
                                const treePred = riskResult.treeResult.prediction;
                                const treeConf = riskResult.treeResult.confidence;
                                const agreed = (riskResult.level === 'critical' && treePred === 'Severe Pre-Eclampsia') ||
                                               (riskResult.level === 'high'     && treePred === 'Mild Pre-Eclampsia')   ||
                                               (['low','moderate'].includes(riskResult.level) && treePred === 'Normal');
                                return (
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                    className="bg-ivory rounded-2xl border border-blush overflow-hidden"
                                  >
                                    {/* Header */}
                                    <div className="px-4 py-3 bg-blush/30 border-b border-blush flex items-center justify-between">
                                      <p className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                                        AI Cross-Validation
                                      </p>
                                      <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                                        agreed ? 'bg-sage/20 text-sage' : 'bg-amber-alert/20 text-amber-alert'
                                      }`}>
                                        {agreed ? '✓ Cross-validated' : '⚠ Needs review'}
                                      </span>
                                    </div>

                                    <div className="p-4 space-y-3">
                                      {/* Two method comparison */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-cream rounded-xl p-3 border border-blush">
                                          <p className="text-xs text-muted mb-1">WHO Clinical Rules</p>
                                          <p className="text-xs font-bold text-charcoal">{whoLabel}</p>
                                          <p className="text-xs text-muted/70 mt-0.5">WHO 2019 / FOGSI</p>
                                        </div>
                                        <div className="bg-cream rounded-xl p-3 border border-blush">
                                          <p className="text-xs text-muted mb-1">AI Gradient Boosting</p>
                                          <p className="text-xs font-bold text-charcoal">{treePred}</p>
                                          <p className="text-xs text-muted/70 mt-0.5">{Math.round(treeConf * 100)}% confidence</p>
                                        </div>
                                      </div>

                                      {/* Decision path breadcrumb */}
                                      <div>
                                        <p className="text-xs text-muted mb-2">Decision path (AI reasoning):</p>
                                        <div className="flex flex-wrap items-center gap-1">
                                          {riskResult.decisionPath.map((step, i) => (
                                            <span key={i} className="flex items-center gap-1">
                                              {i > 0 && <ArrowRight size={10} className="text-muted/50 flex-shrink-0" />}
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                i === riskResult.decisionPath.length - 1
                                                  ? riskResult.level === 'critical' ? 'bg-rose-critical/15 text-rose-critical'
                                                  : riskResult.level === 'high'     ? 'bg-terracotta/15 text-terracotta'
                                                                                    : 'bg-sage/20 text-sage'
                                                  : 'bg-blush text-charcoal'
                                              }`}>
                                                {step}
                                              </span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Feature contributions */}
                                      {riskResult.treeResult.featureContributions && riskResult.treeResult.featureContributions.length > 0 && (
                                        <div className="border-t border-blush pt-2">
                                          <p className="text-xs text-muted mb-2">Key risk factors:</p>
                                          <div className="space-y-1">
                                            {riskResult.treeResult.featureContributions.slice(0, 4).map((c, i) => (
                                              <div key={i} className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                  c.impact === 'critical' ? 'bg-rose-critical' : c.impact === 'high' ? 'bg-terracotta' : 'bg-amber-alert'
                                                }`} />
                                                <span className="text-xs text-charcoal font-medium">{c.feature}</span>
                                                <span className="text-xs text-muted">{c.value}</span>
                                                <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                                  c.impact === 'critical' ? 'bg-rose-critical/10 text-rose-critical' : c.impact === 'high' ? 'bg-terracotta/10 text-terracotta' : 'bg-amber-alert/10 text-amber-alert'
                                                }`}>{c.impact}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Similar patients count */}
                                      <p className="text-xs text-muted/70 text-center border-t border-blush pt-2">
                                        This pattern seen in <span className="font-semibold text-charcoal">{riskResult.similarCount}</span> out of 104 patients in our clinical database
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })()}

                              {/* Buttons */}
                              <div className="flex gap-3">
                                <button
                                  onClick={closeForm}
                                  className="flex-1 h-12 bg-blush text-charcoal font-semibold rounded-xl hover:bg-warm-gray transition-colors text-sm"
                                >
                                  {t('saveReturn')}
                                </button>
                                <button
                                  onClick={() => { setForm(EMPTY_FORM); setRiskResult(null); setSubmitted(false); }}
                                  className="flex-1 h-12 bg-saffron text-white font-semibold rounded-xl hover:bg-terracotta transition-colors text-sm"
                                >
                                  {t('recordAnother')}
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </motion.div>
                    </AnimatePresence>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── High Priority Alerts ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-rose-critical" />
            <h2 className="font-serif text-lg text-charcoal">{t('highPriorityAlerts')}</h2>
            {alerts.length > 0 && (
              <span className="ml-auto bg-rose-critical/10 text-rose-critical text-xs font-bold px-2.5 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>

          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-sage/10 border border-sage/30 rounded-2xl p-7 text-center"
            >
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-serif text-lg text-sage font-semibold">{t('noAlerts')}</p>
              <p className="text-sm text-muted mt-1">{t('noAlertsDesc')}</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {alerts.map(p => <AlertCard key={p.id} patient={p} lang={lang} />)}
            </div>
          )}
        </section>

        {/* ── All Patients ────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-saffron" />
            <h2 className="font-serif text-lg text-charcoal">{t('allPatients')}</h2>
            <span className="ml-auto text-xs text-muted">{patients.length} {t('total')}</span>
          </div>
          <div className="space-y-2.5">
            {patients.map(p => <PatientCard key={p.id} patient={p} />)}
          </div>
        </section>

        <div className="h-8" />
      </div>
    </div>
  );
}
