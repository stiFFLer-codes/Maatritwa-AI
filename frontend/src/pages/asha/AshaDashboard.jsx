import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Calendar, Plus, X, Mic, MicOff,
  Activity, Baby, User, Clock, ChevronRight, CheckCircle2,
  ArrowRight, HeartPulse, Minus,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import TopBar from '../../components/shared/TopBar';
import RiskBadge from '../../components/shared/RiskBadge';
import { predictWithModel } from '../../data/decisionTreeRules';

// ── Risk Engine ──────────────────────────────────────────────────────────────
function calculateRisk(patient) {
  const { systolicBP, diastolicBP, age, gestationalWeeks,
          previousPreeclampsia, diabeticHistory, firstPregnancy, hemoglobin, weight, height } = patient;
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
  // Use diabeticHistory (unified field for both local risk engine and API)
  if (diabeticHistory) {
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

const RISK_MAP = {
  low: 'low',
  safe: 'low',
  moderate: 'moderate',
  medium: 'moderate',
  monitor: 'moderate',
  elevated: 'high',
  high: 'high',
  critical: 'critical',
};

function toRiskLevel(level) {
  if (!level || typeof level !== 'string') return 'low';
  return RISK_MAP[level.toLowerCase()] || 'low';
}

function splitSymptoms(symptoms) {
  if (!symptoms || typeof symptoms !== 'string') return [];
  return symptoms.split(',').map((item) => item.trim()).filter(Boolean);
}

function normalizePatient(row) {
  const bpSys = Number(row?.blood_pressure_sys);
  const bpDia = Number(row?.blood_pressure_dia);
  const weeksPregnant = Number(row?.weeks_pregnant);
  return {
    id: row?.id,
    name: row?.name || 'Unknown',
    age: Number(row?.age) || 0,
    gestationalWeeks: Number.isFinite(weeksPregnant) ? weeksPregnant : 0,
    village: row?.village || '',
    systolicBP: Number.isFinite(bpSys) ? bpSys : null,
    diastolicBP: Number.isFinite(bpDia) ? bpDia : null,
    riskLevel: toRiskLevel(row?.risk_level),
    lastVisitDate: row?.last_visit_date || row?.created_at || null,
    visitCount: Number(row?.visit_count) || 0,
    riskAssessmentCount: Number(row?.risk_assessment_count) || 0,
    pendingReferralCount: Number(row?.pending_referral_count) || 0,
    symptoms: splitSymptoms(row?.symptoms),
    visits: [],
  };
}

function daysSince(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((TODAY - d) / (1000 * 60 * 60 * 24));
}

function fmt(date) {
  if (!date) return '--';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '--';
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
  // Patient fields (POST /asha/patients)
  name: '', age: '', gestationalWeeks: '', village: '',
  gravida: '', parity: '', diabeticHistory: false,
  // Vitals fields (POST /asha/patients/{id}/vitals)
  systolicBP: '', diastolicBP: '',
  weight: '', height: '', hemoglobin: '',
  pulseRate: '',
  symptoms: [], // string[] — will be joined to comma-sep string for API
  // Local risk engine fields (not sent to API)
  previousPreeclampsia: false, firstPregnancy: false,
};

const EMPTY_VISIT_FORM = {
  patientId: '',
  visitDate: '',
  gestationalWeeks: '',
  systolicBP: '',
  diastolicBP: '',
  symptoms: [],
};

const SYMPTOM_OPTIONS = [
  { value: 'Headache', labelKey: 'form.symptom_headache' },
  { value: 'Blurred Vision', labelKey: 'form.symptom_blurred_vision' },
  { value: 'Swelling', labelKey: 'form.symptom_swelling' },
  { value: 'Seizures', labelKey: 'form.symptom_seizures' },
];

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
function PatientCard({
  patient,
  expanded,
  onToggle,
  onRefer,
  details,
  loadingDetails,
  detailsError,
  eclampsiaResult,
  eclampsiaLoading,
  onPredictEclampsia,
  referralLoading,
  referralMessage,
}) {
  const visitDays = daysSince(patient.lastVisitDate);
  const overdue = visitDays !== null && visitDays >= 14;
  const bpText = patient.systolicBP && patient.diastolicBP
    ? `${patient.systolicBP}/${patient.diastolicBP}`
    : '--/--';
  const showRefer = patient.riskLevel === 'critical' || patient.riskLevel === 'high' || patient.riskLevel === 'elevated';
  const accentClass = patient.riskLevel === 'critical'
    ? 'border-l-4 border-l-red-400'
    : (patient.riskLevel === 'high' || patient.riskLevel === 'elevated')
      ? 'border-l-4 border-l-amber-400'
      : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-ivory rounded-2xl px-5 py-4 shadow-soft border border-blush hover:shadow-warm transition-all duration-200 group ${accentClass}`}
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
          <p className="text-xs text-muted mt-0.5 truncate">{patient.village || '--'}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted">
            <span className="flex items-center gap-1"><User size={10} /> {patient.age} yrs</span>
            <span className="flex items-center gap-1"><Baby size={10} /> Wk {patient.gestationalWeeks}</span>
            <span className="flex items-center gap-1"><Activity size={10} /> {bpText}</span>
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
          <button
            type="button"
            onClick={onToggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-saffron hover:bg-blush/50 transition-colors"
            aria-label={expanded ? 'Collapse patient details' : 'Expand patient details'}
          >
            <ChevronRight
              size={16}
              className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Last visit */}
      <div className={`flex items-center gap-1 mt-2.5 text-xs ${overdue ? 'text-rose-critical' : 'text-muted/70'}`}>
        <Clock size={10} />
        Last visit: {fmt(patient.lastVisitDate)} {visitDays !== null ? `(${visitDays}d ago)` : '(No visit yet)'}
      </div>
      {showRefer && (
        <div className="mt-2.5 flex justify-end">
          <button
            type="button"
            onClick={onRefer}
            disabled={referralLoading}
            className="h-8 px-3 rounded-lg border border-terracotta/50 text-terracotta text-xs font-semibold hover:bg-terracotta/10 disabled:opacity-60 transition-colors"
          >
            {referralLoading ? 'Referring...' : 'Refer to Doctor'}
          </button>
        </div>
      )}
      {referralMessage && (
        <p className={`mt-1 text-xs ${referralMessage.type === 'success' ? 'text-sage' : 'text-rose-critical'}`}>
          {referralMessage.text}
        </p>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-blush bg-cream/70 p-3 space-y-3">
              {loadingDetails && (
                <p className="text-xs text-muted">Loading patient details...</p>
              )}

              {detailsError && (
                <p className="text-xs text-rose-critical font-medium">{detailsError}</p>
              )}

              {!loadingDetails && !detailsError && details && (
                <>
                  {(() => {
                    const minVisits = 3;
                    const visitCount = details.visits.length;
                    const visitsLeft = Math.max(0, minVisits - visitCount);
                    const hasPrediction = !!(eclampsiaResult && eclampsiaResult.eligible && eclampsiaResult.risk_level);
                    const riskLevel = hasPrediction ? eclampsiaResult.risk_level : null;
                    const riskTheme = {
                      critical: {
                        wrap: 'bg-rose-critical/10 border-rose-critical/40',
                        title: 'text-rose-critical',
                        chip: 'bg-rose-critical text-white',
                        cta: 'Refer to Doctor Now',
                        icon: '🔴',
                      },
                      high: {
                        wrap: 'bg-terracotta/10 border-terracotta/40',
                        title: 'text-terracotta',
                        chip: 'bg-terracotta text-white',
                        cta: 'Urgent Doctor Review',
                        icon: '🟠',
                      },
                      moderate: {
                        wrap: 'bg-amber-alert/10 border-amber-alert/40',
                        title: 'text-amber-alert',
                        chip: 'bg-amber-alert text-white',
                        cta: 'Schedule Doctor Follow-up',
                        icon: '🟡',
                      },
                      low: {
                        wrap: 'bg-sage/10 border-sage/40',
                        title: 'text-sage',
                        chip: 'bg-sage text-white',
                        cta: 'Continue Routine Monitoring',
                        icon: '🟢',
                      },
                    };
                    const currentTheme = riskTheme[riskLevel] || riskTheme.low;
                    const flags = Array.isArray(eclampsiaResult?.flags) ? eclampsiaResult.flags : [];

                    return (
                      <div className="rounded-xl border border-blush bg-ivory p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-charcoal uppercase tracking-wider">Eclampsia Prediction</p>
                            <p className="text-[11px] text-muted">Unlocks after 3 visits</p>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-blush text-charcoal">
                            {visitCount}/{minVisits} visits
                          </span>
                        </div>

                        {visitCount < minVisits && (
                          <div className="rounded-xl border border-blush bg-cream px-3 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              {[1, 2, 3].map((idx) => (
                                <span
                                  key={idx}
                                  className={`w-3 h-3 rounded-full ${idx <= visitCount ? 'bg-saffron' : 'bg-blush'}`}
                                />
                              ))}
                              <p className="text-xs font-medium text-charcoal">{visitCount} of 3 visits recorded</p>
                            </div>
                            <div className="w-full h-2 rounded-full bg-blush overflow-hidden">
                              <div
                                className="h-full bg-saffron transition-all duration-300"
                                style={{ width: `${Math.min(100, (visitCount / minVisits) * 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted mt-2">
                              Add {visitsLeft} more visit{visitsLeft > 1 ? 's' : ''} to unlock prediction.
                            </p>
                          </div>
                        )}

                        {visitCount >= minVisits && !hasPrediction && (
                          <button
                            type="button"
                            onClick={onPredictEclampsia}
                            disabled={eclampsiaLoading}
                            className="w-full h-11 rounded-xl bg-saffron text-white font-semibold text-sm hover:bg-terracotta disabled:opacity-60 transition-colors"
                          >
                            {eclampsiaLoading ? 'Running Eclampsia Prediction...' : 'Run Eclampsia Prediction'}
                          </button>
                        )}

                        {hasPrediction && (
                          <div className={`rounded-xl border px-3 py-3 ${currentTheme.wrap}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-sm font-bold uppercase tracking-wide ${currentTheme.title}`}>
                                  {currentTheme.icon} Eclampsia Risk: {riskLevel}
                                </p>
                                <p className="text-xs text-charcoal mt-1">
                                  Score {Math.round((eclampsiaResult.risk_score || 0) * 100)}% · Based on {visitCount} visits
                                </p>
                              </div>
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-full uppercase ${currentTheme.chip}`}>
                                {riskLevel}
                              </span>
                            </div>

                            {flags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {flags.map((flag) => (
                                  <span key={flag} className="text-[11px] px-2 py-1 rounded-full bg-white/80 text-charcoal border border-blush">
                                    {flag.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-xs font-semibold text-charcoal">{currentTheme.cta}</p>
                              <button
                                type="button"
                                onClick={onPredictEclampsia}
                                disabled={eclampsiaLoading}
                                className="text-xs font-semibold text-charcoal hover:text-terracotta transition-colors"
                              >
                                Re-run →
                              </button>
                            </div>
                          </div>
                        )}

                        {eclampsiaResult && !eclampsiaResult.eligible && visitCount >= minVisits && (
                          <p className="text-xs text-rose-critical font-medium">{eclampsiaResult.message}</p>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="rounded-lg bg-ivory border border-blush p-2">
                      <p className="text-[11px] text-muted">Current Week</p>
                      <p className="text-sm font-semibold text-charcoal">{details.patient.gestationalWeeks || '--'}</p>
                    </div>
                    <div className="rounded-lg bg-ivory border border-blush p-2">
                      <p className="text-[11px] text-muted">Current BP</p>
                      <p className="text-sm font-semibold text-charcoal">{details.patient.systolicBP && details.patient.diastolicBP ? `${details.patient.systolicBP}/${details.patient.diastolicBP}` : '--/--'}</p>
                    </div>
                    <div className="rounded-lg bg-ivory border border-blush p-2">
                      <p className="text-[11px] text-muted">Total Visits</p>
                      <p className="text-sm font-semibold text-charcoal">{details.visits.length}</p>
                    </div>
                    <div className="rounded-lg bg-ivory border border-blush p-2">
                      <p className="text-[11px] text-muted">Latest Risk</p>
                      <p className="text-sm font-semibold capitalize text-charcoal">{details.patient.riskLevel}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Visit Timeline</p>
                    {details.visits.length === 0 ? (
                      <p className="text-xs text-muted">No visits recorded yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-auto pr-1">
                        {details.visits.map((visit) => (
                          <div key={visit.id} className="rounded-lg bg-ivory border border-blush p-2.5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold text-charcoal">{fmt(visit.recordedAt)}</p>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blush text-charcoal capitalize">{visit.riskLevel}</span>
                            </div>
                            <p className="text-xs text-muted">BP: {visit.bloodPressureSys ?? '--'}/{visit.bloodPressureDia ?? '--'}</p>
                            <p className="text-xs text-muted mt-0.5">Symptoms: {visit.symptoms.length ? visit.symptoms.join(', ') : 'None'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────
function AlertCard({ patient, lang, onOpenDetails }) {
  const isCritical = patient.riskLevel === 'critical';
  const result = useMemo(() => calculateRisk(patient), [patient]);
  const bpText = patient.systolicBP && patient.diastolicBP
    ? `${patient.systolicBP}/${patient.diastolicBP}`
    : '--/--';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onOpenDetails(patient.id)}
      className={`rounded-2xl p-4 border-l-4 ${
        isCritical
          ? 'bg-rose-critical/5 border-l-rose-critical animate-pulse-border'
          : 'bg-terracotta/5 border-l-terracotta'
      } cursor-pointer hover:shadow-soft transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle size={16} className={`mt-0.5 flex-shrink-0 ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`} />
          <div className="min-w-0">
            <p className="font-serif font-semibold text-charcoal truncate">{patient.name}</p>
            <p className="text-xs text-muted mt-0.5">
              {patient.age} yrs · Wk {patient.gestationalWeeks} · BP {bpText}
            </p>
            <p className={`text-xs font-semibold mt-1.5 ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`}>
              → {lang === 'hi' ? result.action.hi : result.action.en}
            </p>
            <p className="text-[11px] text-muted/80 mt-1 flex items-center gap-1">
              <ChevronRight size={12} />
              {lang === 'hi' ? 'विवरण देखने के लिए टैप करें' : 'Tap to view patient details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={patient.riskLevel} />
          <ChevronRight size={14} className="text-muted" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AshaDashboard() {
  const { t, lang } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const [formMode, setFormMode] = useState('new-patient');
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [visitForm, setVisitForm]     = useState(EMPTY_VISIT_FORM);
  const [riskResult, setRiskResult]   = useState(null);
  const [submitted, setSubmitted]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [expandedPatientId, setExpandedPatientId] = useState(null);
  const [patientDetails, setPatientDetails] = useState({});
  const [loadingDetailsById, setLoadingDetailsById] = useState({});
  const [detailsErrorById, setDetailsErrorById] = useState({});
  const [eclampsiaById, setEclampsiaById] = useState({});
  const [eclampsiaLoadingById, setEclampsiaLoadingById] = useState({});
  const [referralLoadingById, setReferralLoadingById] = useState({});
  const [referralMessageById, setReferralMessageById] = useState({});
  const patientsSectionRef = useRef(null);
  const alertsSectionRef = useRef(null);
  const [activeSummaryFilter, setActiveSummaryFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  // Fetch patients from backend API
  useEffect(() => {
    setLoadingPatients(true);
    fetch(`${API_BASE_URL}/asha/patients`)
      .then(res => res.json())
      .then(data => {
        const normalized = (Array.isArray(data) ? data : []).map(normalizePatient);
        const sorted = [...normalized].sort((a, b) => {
          const o = { critical: 0, high: 1, moderate: 2, low: 3 };
          return (o[a.riskLevel] ?? 99) - (o[b.riskLevel] ?? 99);
        });
        setPatients(sorted);
        setPatientsError('');
      })
      .catch(err => {
        console.error('Error fetching patients:', err);
        setPatientsError('Failed to load patients. Please try again.');
        setPatients([]);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  const fetchPatientDetails = async (patientId) => {
    if (!patientId || patientDetails[patientId]) return;

    setLoadingDetailsById((prev) => ({ ...prev, [patientId]: true }));
    setDetailsErrorById((prev) => ({ ...prev, [patientId]: '' }));

    try {
      const response = await fetch(`${API_BASE_URL}/asha/patients/${patientId}/details`);
      if (!response.ok) {
        throw new Error(`Failed to load patient details (HTTP ${response.status})`);
      }

      const payload = await response.json();
      const normalizedPatient = normalizePatient(payload.patient || {});
      const normalizedVisits = (Array.isArray(payload.visits) ? payload.visits : []).map((visit) => ({
        id: visit.id,
        recordedAt: visit.recorded_at,
        bloodPressureSys: visit.blood_pressure_sys,
        bloodPressureDia: visit.blood_pressure_dia,
        symptoms: splitSymptoms(visit.symptoms),
        riskLevel: toRiskLevel(visit.risk_level),
      }));

      setPatientDetails((prev) => ({
        ...prev,
        [patientId]: {
          patient: normalizedPatient,
          visits: normalizedVisits,
        },
      }));
    } catch (error) {
      setDetailsErrorById((prev) => ({
        ...prev,
        [patientId]: error?.message || 'Failed to load details',
      }));
    } finally {
      setLoadingDetailsById((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  const handleTogglePatient = (patientId) => {
    setExpandedPatientId((prev) => {
      const next = prev === patientId ? null : patientId;
      if (next) {
        fetchPatientDetails(next);
      }
      return next;
    });
  };

  const handleOpenFromAlert = (patientId) => {
    setExpandedPatientId(patientId);
    fetchPatientDetails(patientId);
    patientsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePredictEclampsia = async (patientId) => {
    setEclampsiaLoadingById((prev) => ({ ...prev, [patientId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/asha/patients/${patientId}/eclampsia-risk`);
      if (!response.ok) {
        throw new Error(`Failed to predict (HTTP ${response.status})`);
      }
      const payload = await response.json();
      setEclampsiaById((prev) => ({ ...prev, [patientId]: payload }));
    } catch (error) {
      setEclampsiaById((prev) => ({
        ...prev,
        [patientId]: {
          eligible: false,
          min_visits_required: 3,
          available_visits: 0,
          message: error?.message || 'Prediction failed',
        },
      }));
    } finally {
      setEclampsiaLoadingById((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  const handleCreateReferral = async (patientId, riskLevel) => {
    setReferralLoadingById((prev) => ({ ...prev, [patientId]: true }));
    setReferralMessageById((prev) => ({ ...prev, [patientId]: null }));
    try {
      const response = await fetch(`${API_BASE_URL}/asha/referrals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          notes: `Auto-referral from ASHA dashboard (${riskLevel} risk).`,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Referral failed (HTTP ${response.status})`);
      }
      setPatients((prev) => prev.map((p) => (
        p.id === patientId
          ? { ...p, pendingReferralCount: (p.pendingReferralCount || 0) + 1 }
          : p
      )));
      setReferralMessageById((prev) => ({
        ...prev,
        [patientId]: { type: 'success', text: 'Referral sent to doctor.' },
      }));
    } catch (error) {
      setReferralMessageById((prev) => ({
        ...prev,
        [patientId]: { type: 'error', text: error?.message || 'Failed to create referral.' },
      }));
    } finally {
      setReferralLoadingById((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  useEffect(() => {
    setVoiceAvailable(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Stats
  const stats = useMemo(() => {
    const visitsDue = patients.filter((p) => {
      if (!p.lastVisitDate) return true;
      const d = new Date(p.lastVisitDate);
      if (Number.isNaN(d.getTime())) return true;
      const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 14;
    }).length;

    return {
      total: patients.length,
      critical: patients.filter((p) => p.riskLevel === 'critical').length,
      elevated: patients.filter((p) => p.riskLevel === 'high' || p.riskLevel === 'elevated').length,
      due: visitsDue,
    };
  }, [patients]);

  const listPatients = useMemo(() => {
    const rank = { critical: 0, high: 1, elevated: 1, moderate: 2, low: 3, safe: 3 };
    const query = searchText.trim().toLowerCase();

    return [...patients]
      .filter((p) => {
        if (!query) return true;
        return [p.name, p.village].some((v) => String(v || '').toLowerCase().includes(query));
      })
      .filter((p) => {
        if (riskFilter === 'all') return true;
        if (riskFilter === 'critical') return p.riskLevel === 'critical';
        if (riskFilter === 'elevated') return p.riskLevel === 'high' || p.riskLevel === 'elevated';
        if (riskFilter === 'safe') return p.riskLevel === 'low' || p.riskLevel === 'safe';
        return true;
      })
      .sort((a, b) => {
        const r = (rank[a.riskLevel] ?? 99) - (rank[b.riskLevel] ?? 99);
        if (r !== 0) return r;
        return (b.lastVisitDate ? new Date(b.lastVisitDate).getTime() : 0) - (a.lastVisitDate ? new Date(a.lastVisitDate).getTime() : 0);
      });
  }, [patients, searchText, riskFilter]);

  const readyPredictions = useMemo(
    () => listPatients.filter((p) => {
      const details = patientDetails[p.id];
      const prediction = eclampsiaById[p.id];
      return details?.visits?.length >= 3 && prediction?.eligible;
    }),
    [listPatients, patientDetails, eclampsiaById],
  );

  const todaysActions = useMemo(() => {
    const actions = [];

    for (const patient of patients) {
      const days = patient.lastVisitDate ? ((Date.now() - new Date(patient.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24)) : null;
      const overdue = patient.visitCount === 0 || days === null || Number.isNaN(days) || days > 14;

      if (patient.riskLevel === 'critical' && (patient.pendingReferralCount || 0) === 0) {
        actions.push({
          patientId: patient.id,
          rule: 1,
          colorDot: 'bg-rose-critical',
          colorText: 'text-rose-critical',
          text: lang === 'hi' ? `→ ${patient.name} को डॉक्टर के पास भेजें` : `→ Refer ${patient.name} to doctor`,
          onClick: () => handleCreateReferral(patient.id, patient.riskLevel),
        });
        continue;
      }

      if (overdue) {
        actions.push({
          patientId: patient.id,
          rule: 2,
          colorDot: 'bg-amber-alert',
          colorText: 'text-amber-alert',
          text: lang === 'hi' ? `→ ${patient.name} की विज़िट करें` : `→ Visit ${patient.name}`,
          onClick: () => handleOpenFromAlert(patient.id),
        });
        continue;
      }

      if (patient.visitCount === 3 && (patient.riskAssessmentCount || 0) === 0) {
        actions.push({
          patientId: patient.id,
          rule: 3,
          colorDot: 'bg-saffron',
          colorText: 'text-terracotta',
          text: lang === 'hi' ? `→ ${patient.name} की भविष्यवाणी चलाएं` : `→ Run prediction for ${patient.name}`,
          onClick: () => handlePredictEclampsia(patient.id),
        });
        continue;
      }

      if (patient.visitCount === 1 || patient.visitCount === 2) {
        actions.push({
          patientId: patient.id,
          rule: 4,
          colorDot: 'bg-warm-gray',
          colorText: 'text-muted',
          text: lang === 'hi'
            ? `→ ${patient.name} की विज़िट जोड़ें (${patient.visitCount}/3)`
            : `→ Add visit for ${patient.name} (${patient.visitCount}/3)`,
          onClick: () => {
            setShowForm(true);
            setFormMode('existing-visit');
            setSubmitted(false);
            setRiskResult(null);
            setSubmitError('');
            setVisitForm((prev) => ({ ...EMPTY_VISIT_FORM, patientId: patient.id, visitDate: prev.visitDate }));
          },
        });
      }
    }

    return actions.sort((a, b) => a.rule - b.rule).slice(0, 5);
  }, [patients, lang]);

  // Form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Symptoms multi-select: toggle item in array
    if (name === 'symptoms') {
      setForm(prev => ({
        ...prev,
        symptoms: prev.symptoms.includes(value)
          ? prev.symptoms.filter(s => s !== value)
          : [...prev.symptoms, value],
      }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleVisitChange = (e) => {
    const { name, value } = e.target;
    if (name === 'symptoms') {
      setVisitForm(prev => ({
        ...prev,
        symptoms: prev.symptoms.includes(value)
          ? prev.symptoms.filter(s => s !== value)
          : [...prev.symptoms, value],
      }));
      return;
    }
    setVisitForm(prev => ({ ...prev, [name]: value }));
  };

  const handleVisitSubmit = async (e) => {
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

    const selectedPatient = patients.find((p) => p.id === visitForm.patientId);
    if (!selectedPatient) {
      setSubmitError('Please select an existing patient.');
      setIsSubmitting(false);
      return;
    }
    if (!visitForm.visitDate) {
      setSubmitError('Visit date is required.');
      setIsSubmitting(false);
      return;
    }

    const gestationalWeeks = toNumber(visitForm.gestationalWeeks);
    const systolicBP = toNumber(visitForm.systolicBP);
    const diastolicBP = toNumber(visitForm.diastolicBP);

    if (!Number.isFinite(gestationalWeeks) || gestationalWeeks < 1 || gestationalWeeks > 45) {
      setSubmitError('Gestational weeks must be between 1 and 45.');
      setIsSubmitting(false);
      return;
    }
    if (!Number.isFinite(systolicBP) || systolicBP < 70 || systolicBP > 240) {
      setSubmitError('Systolic BP must be between 70 and 240.');
      setIsSubmitting(false);
      return;
    }
    if (!Number.isFinite(diastolicBP) || diastolicBP < 40 || diastolicBP > 140) {
      setSubmitError('Diastolic BP must be between 40 and 140.');
      setIsSubmitting(false);
      return;
    }

    const symptomsString = visitForm.symptoms.length > 0 ? visitForm.symptoms.join(', ') : null;

    try {
      const visitResp = await fetch(`${API_BASE_URL}/asha/patients/${visitForm.patientId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recorded_at: `${visitForm.visitDate}T09:00:00`,
          weeks_pregnant: gestationalWeeks,
          blood_pressure_sys: systolicBP,
          blood_pressure_dia: diastolicBP,
          symptoms: symptomsString,
        }),
      });

      if (!visitResp.ok) {
        throw new Error(await parseApiError(visitResp, 'Failed to save visit record.'));
      }

      const createdVisit = await visitResp.json();
      const updatedPatient = {
        ...selectedPatient,
        gestationalWeeks,
        systolicBP,
        diastolicBP,
        symptoms: visitForm.symptoms,
        lastVisitDate: createdVisit.recorded_at || `${visitForm.visitDate}T09:00:00`,
      };
      const result = calculateRisk(updatedPatient);
      setRiskResult({ patient: updatedPatient, ...result, treeResult: null, decisionPath: [], similarCount: 0 });

      setPatients(prev => {
        const o = { critical: 0, high: 1, moderate: 2, low: 3 };
        const nextPatients = prev.map((p) => {
          if (p.id !== visitForm.patientId) return p;
          return { ...updatedPatient, riskLevel: result.level };
        });
        return nextPatients.sort((a, b) => (o[a.riskLevel] ?? 99) - (o[b.riskLevel] ?? 99));
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to submit visit data.');
    } finally {
      setIsSubmitting(false);
    }
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
      // Optional numeric fields — NaN is acceptable (will become null)
      gravida:    form.gravida.trim()   ? toNumber(form.gravida)   : null,
      parity:     form.parity.trim()    ? toNumber(form.parity)    : null,
      pulseRate:  form.pulseRate.trim() ? toNumber(form.pulseRate) : null,
    };

    // Validate required fields
    if (!form.name.trim()) {
      setSubmitError('Patient name is required.');
      setIsSubmitting(false);
      return;
    }
    if (!form.village.trim()) {
      setSubmitError('Village is required. / गाँव का नाम ज़रूरी है।');
      setIsSubmitting(false);
      return;
    }

    const fieldRules = [
      { key: 'age',              label: 'Age',              min: 10,  max: 60  },
      { key: 'gestationalWeeks', label: 'Gestational weeks', min: 1,   max: 45  },
      { key: 'systolicBP',       label: 'Systolic BP',      min: 70,  max: 240 },
      { key: 'diastolicBP',      label: 'Diastolic BP',     min: 40,  max: 140 },
      { key: 'weight',           label: 'Weight',           min: 25,  max: 250 },
      { key: 'hemoglobin',       label: 'Hemoglobin',       min: 3,   max: 25  },
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

    // Validate optional numeric ranges if provided
    if (f.pulseRate !== null && (f.pulseRate < 40 || f.pulseRate > 200)) {
      setSubmitError('Pulse rate must be between 40 and 200 bpm.');
      setIsSubmitting(false);
      return;
    }
    if (f.gravida !== null && (f.gravida < 1 || f.gravida > 20)) {
      setSubmitError('Gravida must be between 1 and 20.');
      setIsSubmitting(false);
      return;
    }
    if (f.parity !== null && (f.parity < 0 || f.parity > 20)) {
      setSubmitError('Parity must be between 0 and 20.');
      setIsSubmitting(false);
      return;
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
      // ── Step 1: Create patient record ─────────────────────────────────────
      const patientResp = await fetch(`${API_BASE_URL}/asha/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             form.name.trim(),
          age:              f.age,
          weeks_pregnant:   f.gestationalWeeks,
          village:          form.village.trim(),
          gravida:          f.gravida,          // null if not provided
          parity:           f.parity,           // null if not provided
          diabetic_history: form.diabeticHistory,
          height_cm:        Number.isFinite(f.height) ? f.height : null,
        }),
      });
      if (!patientResp.ok) {
        throw new Error(await parseApiError(patientResp, 'Failed to create patient record.'));
      }
      const createdPatient = await patientResp.json();

      // ── Step 2: Submit vitals for the created patient ────────────────────
      const symptomsString = form.symptoms.length > 0 ? form.symptoms.join(', ') : null;
      const vitalsResp = await fetch(`${API_BASE_URL}/asha/patients/${createdPatient.id}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blood_pressure_sys: f.systolicBP,
          blood_pressure_dia: f.diastolicBP,
          hemoglobin:         f.hemoglobin,
          weight_kg:          f.weight,
          pulse_rate:         f.pulseRate,   // null if not provided
          symptoms:           symptomsString,
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
        id:                  createdPatient.id,
        name:                form.name.trim(),
        age:                 f.age,
        gestationalWeeks:    f.gestationalWeeks,
        village:             form.village.trim(),
        gravida:             f.gravida,
        parity:              f.parity,
        diabeticHistory:     form.diabeticHistory,
        systolicBP:          f.systolicBP,
        diastolicBP:         f.diastolicBP,
        weight:              f.weight,
        height:              f.height,
        hemoglobin:          f.hemoglobin,
        pulseRate:           f.pulseRate,
        symptoms:            form.symptoms,
        previousPreeclampsia: form.previousPreeclampsia,
        firstPregnancy:      form.firstPregnancy,
        lastVisitDate:       new Date(),
        riskLevel:           result.level,
        visits:              [],
        ashaWorkerId:        createdPatient.asha_id,
      };
      setPatients(prev => {
        const o = { critical: 0, high: 1, moderate: 2, low: 3 };
        return [newPatient, ...prev].sort((a, b) => (o[a.riskLevel] ?? 99) - (o[b.riskLevel] ?? 99));
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
    setFormMode('new-patient');
    setForm(EMPTY_FORM);
    setVisitForm(EMPTY_VISIT_FORM);
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

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

        <div className="flex flex-col lg:flex-row lg:items-start gap-6 mt-6">
          <div className="flex-1 min-w-0" ref={patientsSectionRef}>
            <div className="bg-ivory rounded-2xl border border-blush shadow-soft p-4 mb-4">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="मरीज़ खोजें..."
                className="w-full h-11 px-4 rounded-xl border-2 border-blush bg-cream text-charcoal focus:outline-none focus:border-saffron transition-colors"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { key: 'all', label: 'सभी' },
                  { key: 'critical', label: 'गंभीर' },
                  { key: 'elevated', label: 'उच्च जोखिम' },
                  { key: 'safe', label: 'सुरक्षित' },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setRiskFilter(pill.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      riskFilter === pill.key
                        ? 'bg-saffron text-white border-saffron'
                        : 'bg-cream text-charcoal border-blush hover:border-saffron/60'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-saffron" />
                <h2 className="font-serif text-lg text-charcoal">{t('allPatients')}</h2>
                <span className="ml-auto text-xs text-muted">{listPatients.length} {t('total')}</span>
              </div>
              <div className="space-y-2.5">
                {listPatients.map((p) => (
                  <PatientCard
                    key={p.id}
                    patient={p}
                    expanded={expandedPatientId === p.id}
                    onToggle={() => handleTogglePatient(p.id)}
                    onRefer={() => handleCreateReferral(p.id, p.riskLevel)}
                    details={patientDetails[p.id]}
                    loadingDetails={!!loadingDetailsById[p.id]}
                    detailsError={detailsErrorById[p.id]}
                    eclampsiaResult={eclampsiaById[p.id]}
                    eclampsiaLoading={!!eclampsiaLoadingById[p.id]}
                    onPredictEclampsia={() => handlePredictEclampsia(p.id)}
                    referralLoading={!!referralLoadingById[p.id]}
                    referralMessage={referralMessageById[p.id]}
                  />
                ))}
                {listPatients.length === 0 && (
                  <div className="rounded-xl border border-blush bg-ivory px-4 py-5 text-center">
                    <p className="text-sm text-muted">{lang === 'hi' ? 'कोई मरीज़ नहीं मिला।' : 'No patients found.'}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="w-full lg:w-[340px] shrink-0 self-start">
            <div className="lg:sticky lg:top-20 space-y-4">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowForm(true);
                  setFormMode('new-patient');
                  setSubmitted(false);
                  setRiskResult(null);
                  setSubmitError('');
                  setForm(EMPTY_FORM);
                  setVisitForm(EMPTY_VISIT_FORM);
                }}
                className="w-full min-h-[52px] flex items-center justify-center gap-2.5 bg-saffron hover:bg-terracotta text-white font-semibold text-base rounded-2xl shadow-warm hover:shadow-warm-lg transition-all duration-200"
              >
                <Plus size={20} />
                {t('recordVisit')}
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'कुल मरीज़', value: stats.total },
                  { label: 'गंभीर', value: stats.critical },
                  { label: 'उच्च जोखिम', value: stats.elevated },
                  { label: 'विज़िट बाकी', value: stats.due },
                ].map((card) => (
                  <div key={card.label} className="bg-ivory rounded-xl p-4 border border-blush shadow-soft">
                    <p className="font-serif text-2xl font-bold text-charcoal leading-none">{card.value}</p>
                    <p className="text-xs text-muted mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-ivory rounded-2xl p-4 border border-blush shadow-soft">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-charcoal text-sm">{lang === 'hi' ? 'आज के काम' : "Today's Actions"}</h3>
                  {todaysActions.length === 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sage/15 text-sage">
                      <CheckCircle2 size={12} />
                      0
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-saffron/15 text-saffron">
                      {todaysActions.length}
                    </span>
                  )}
                </div>

                {todaysActions.length === 0 ? (
                  <p className="text-xs text-sage font-medium">{lang === 'hi' ? 'सब ठीक है! आज कोई काम नहीं' : 'All caught up!'}</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {todaysActions.map((action, idx) => (
                      <button
                        key={`${action.patientId}-${action.rule}-${idx}`}
                        type="button"
                        onClick={action.onClick}
                        className="w-full text-left flex items-start gap-2 py-2 border-b border-gray-100 last:border-0"
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${action.colorDot}`} />
                        <span className={`text-sm ${action.colorText}`}>{action.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Form modal ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form-panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeForm();
              }}
            >
              <div
                className="bg-ivory rounded-2xl shadow-warm-lg border-2 border-blush overflow-hidden w-full max-w-lg max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >

                {/* Form header */}
                <div className="flex items-center justify-between px-6 py-4 bg-blush/40 border-b border-blush">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={17} className="text-terracotta" />
                    <h2 className="font-serif text-lg text-charcoal">
                      {formMode === 'new-patient' ? t('form.title') : t('form.titleExistingVisit')}
                    </h2>
                  </div>
                  <button onClick={closeForm} className="text-muted hover:text-rose-critical transition-colors p-1">
                    <X size={20} />
                  </button>
                </div>

                {/* Form mode switch */}
                {!submitted && (
                  <div className="px-6 pt-4">
                    <div className="grid grid-cols-2 gap-2 bg-cream rounded-xl p-1 border border-blush">
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('new-patient');
                          setSubmitError('');
                        }}
                        className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                          formMode === 'new-patient'
                            ? 'bg-saffron text-white'
                            : 'text-charcoal hover:bg-blush/70'
                        }`}
                      >
                        {t('form.modeNewPatient')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormMode('existing-visit');
                          setSubmitError('');
                        }}
                        className={`h-10 rounded-lg text-sm font-semibold transition-colors ${
                          formMode === 'existing-visit'
                            ? 'bg-saffron text-white'
                            : 'text-charcoal hover:bg-blush/70'
                        }`}
                      >
                        {t('form.modeExistingVisit')}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Form content ── */}
                {!submitted ? (
                  <form
                    onSubmit={formMode === 'new-patient' ? handleSubmit : handleVisitSubmit}
                    className="p-6 space-y-6"
                  >

                    {formMode === 'new-patient' ? (
                      <>

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

                        {/* Name */}
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">{t('form.name')}</label>
                          <input
                            type="text" name="name" value={form.name} onChange={handleChange}
                            required placeholder={t('form.namePlaceholder')}
                            className="w-full h-12 px-4 border-2 border-blush rounded-xl bg-ivory text-charcoal text-base focus:outline-none focus:border-saffron transition-colors"
                          />
                        </div>

                        {/* Age + Gestational Weeks */}
                        <div className="grid grid-cols-2 gap-3">
                          <NumberInput label={t('form.age')} name="age" value={form.age} onChange={handleChange} min={14} max={55} required />
                          <NumberInput label={t('form.weeks')} name="gestationalWeeks" value={form.gestationalWeeks} onChange={handleChange} min={1} max={42} required />
                        </div>

                        {/* Village — required */}
                        <div>
                          <label className="block text-xs font-medium text-muted mb-1">
                            {t('form.village')} <span className="text-rose-critical">*</span>
                          </label>
                          <input
                            type="text" name="village" value={form.village} onChange={handleChange}
                            required placeholder={t('form.villagePlaceholder')}
                            className="w-full h-12 px-4 border-2 border-blush rounded-xl bg-ivory text-charcoal text-base focus:outline-none focus:border-saffron transition-colors"
                          />
                        </div>

                        {/* Gravida + Parity — optional with Hindi helper text */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <NumberInput
                              label={t('form.gravida')}
                              name="gravida"
                              value={form.gravida}
                              onChange={handleChange}
                              min={1} max={20}
                            />
                            <p className="text-[11px] text-muted/70 mt-1 leading-snug">
                              {t('form.gravida_hint')}
                            </p>
                          </div>
                          <div>
                            <NumberInput
                              label={t('form.parity')}
                              name="parity"
                              value={form.parity}
                              onChange={handleChange}
                              min={0} max={20}
                            />
                            <p className="text-[11px] text-muted/70 mt-1 leading-snug">
                              {t('form.parity_hint')}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted/60 -mt-1 italic">{t('form.gravidaParityNote')}</p>

                        {/* Diabetes History toggle — unified field */}
                        <div className="bg-cream rounded-2xl px-4 py-1 border border-blush">
                          <Toggle
                            label={t('form.diabeticHistory')}
                            name="diabeticHistory"
                            checked={form.diabeticHistory}
                            onChange={handleChange}
                          />
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
                        {/* Pulse Rate — optional */}
                        <div className="col-span-2">
                          <NumberInput
                            label={t('form.pulseRate')}
                            name="pulseRate"
                            value={form.pulseRate}
                            onChange={handleChange}
                            min={40} max={200}
                          />
                        </div>
                      </div>

                      {/* Symptoms multi-select */}
                      <div className="mt-4">
                        <p className="text-xs font-medium text-muted mb-2">{t('form.symptoms')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {SYMPTOM_OPTIONS.map(({ value, labelKey }) => (
                            <label
                              key={value}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                                form.symptoms.includes(value)
                                  ? 'border-saffron bg-saffron/10 text-charcoal'
                                  : 'border-blush bg-cream text-muted hover:border-saffron/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name="symptoms"
                                value={value}
                                checked={form.symptoms.includes(value)}
                                onChange={handleChange}
                                className="sr-only"
                              />
                              <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                form.symptoms.includes(value) ? 'bg-saffron' : 'bg-white border border-blush'
                              }`}>
                                {form.symptoms.includes(value) && (
                                  <CheckCircle2 size={12} className="text-white" />
                                )}
                              </span>
                              <span className="text-sm font-medium">{t(labelKey)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      </div>

                      {/* History toggles (local risk engine factors only) */}
                      <div>
                      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{t('form.history')}</p>
                      <div className="bg-cream rounded-2xl px-4 py-1 border border-blush">
                        <Toggle label={t('form.prevPreeclampsia')} name="previousPreeclampsia" checked={form.previousPreeclampsia} onChange={handleChange} />
                        <Toggle label={t('form.firstPregnancy')}   name="firstPregnancy"       checked={form.firstPregnancy}       onChange={handleChange} />
                      </div>
                      </div>

                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t('form.existingVisitSection')}</p>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-muted mb-1">{t('form.selectPatient')}</label>
                              <select
                                name="patientId"
                                value={visitForm.patientId}
                                onChange={handleVisitChange}
                                required
                                className="w-full h-12 px-4 border-2 border-blush rounded-xl bg-ivory text-charcoal text-base focus:outline-none focus:border-saffron transition-colors"
                              >
                                <option value="">{t('form.selectPatientPlaceholder')}</option>
                                {patients.map((patient) => (
                                  <option key={patient.id} value={patient.id}>
                                    {patient.name} ({patient.village || t('form.villageUnknown')})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-muted mb-1">{t('form.visitDate')}</label>
                              <input
                                type="date"
                                name="visitDate"
                                value={visitForm.visitDate}
                                onChange={handleVisitChange}
                                required
                                className="w-full h-12 px-4 border-2 border-blush rounded-xl bg-ivory text-charcoal text-base focus:outline-none focus:border-saffron transition-colors"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <NumberInput
                                label={t('form.gestationWeek')}
                                name="gestationalWeeks"
                                value={visitForm.gestationalWeeks}
                                onChange={handleVisitChange}
                                min={1}
                                max={45}
                                required
                              />
                              <div />
                              <NumberInput
                                label="Systolic BP"
                                hint="mmHg"
                                name="systolicBP"
                                value={visitForm.systolicBP}
                                onChange={handleVisitChange}
                                min={70}
                                max={240}
                                required
                              />
                              <NumberInput
                                label="Diastolic BP"
                                hint="mmHg"
                                name="diastolicBP"
                                value={visitForm.diastolicBP}
                                onChange={handleVisitChange}
                                min={40}
                                max={140}
                                required
                              />
                            </div>

                            <div>
                              <p className="text-xs font-medium text-muted mb-2">Symptoms</p>
                              <div className="grid grid-cols-2 gap-2">
                                {SYMPTOM_OPTIONS.map(({ value, labelKey }) => (
                                  <label
                                    key={value}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                                      visitForm.symptoms.includes(value)
                                        ? 'border-saffron bg-saffron/10 text-charcoal'
                                        : 'border-blush bg-cream text-muted hover:border-saffron/50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      name="symptoms"
                                      value={value}
                                      checked={visitForm.symptoms.includes(value)}
                                      onChange={handleVisitChange}
                                      className="sr-only"
                                    />
                                    <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                      visitForm.symptoms.includes(value) ? 'bg-saffron' : 'bg-white border border-blush'
                                    }`}>
                                      {visitForm.symptoms.includes(value) && (
                                        <CheckCircle2 size={12} className="text-white" />
                                      )}
                                    </span>
                                    <span className="text-sm font-medium">{t(labelKey)}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full min-h-[52px] bg-saffron hover:bg-terracotta disabled:opacity-60 text-white font-semibold rounded-2xl shadow-warm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          {lang === 'hi' ? 'सेव हो रहा है…' : 'Saving…'}
                        </>
                      ) : (
                        <>
                          <Activity size={18} />
                          {formMode === 'new-patient' ? t('form.submit') : t('form.submitVisit')}
                        </>
                      )}
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
                        {/* Success confirmation banner */}
                        <div className="flex items-center gap-2.5 bg-sage/15 border border-sage/40 text-sage rounded-xl px-4 py-3">
                          <CheckCircle2 size={18} className="flex-shrink-0" />
                          <p className="text-sm font-semibold">{t('form.successMessage')}</p>
                        </div>

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

        <div className="h-8" />
      </div>
    </div>
  );
}
