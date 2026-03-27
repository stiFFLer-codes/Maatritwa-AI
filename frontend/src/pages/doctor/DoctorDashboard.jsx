import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Stethoscope, Calendar, X,
  ChevronRight, Activity, TrendingUp, ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import TopBar from '../../components/shared/TopBar';
import RiskBadge from '../../components/shared/RiskBadge';

// ── Risk engine (same logic as ASHA dashboard) ──────────────────────────────
function calculateRisk(p) {
  const { systolicBP, diastolicBP, age, gestationalWeeks,
          previousPreeclampsia, diabetes, firstPregnancy, hemoglobin, weight, height } = p;
  const reasons = [];
  let level = 'low';

  if (systolicBP >= 160) {
    reasons.push({ factor: 'Systolic BP', value: `${systolicBP} mmHg`, threshold: '≥160 (WHO Critical)',
      en: `Severely elevated systolic BP (${systolicBP} mmHg). Risk of eclampsia and end-organ damage.`,
      hi: `अत्यधिक उच्च सिस्टोलिक BP। एक्लेम्पसिया का जोखिम।` });
    level = 'critical';
  }
  if (diastolicBP >= 110) {
    reasons.push({ factor: 'Diastolic BP', value: `${diastolicBP} mmHg`, threshold: '≥110 (WHO Critical)',
      en: `Severely elevated diastolic BP (${diastolicBP} mmHg). Immediate antihypertensive indicated.`,
      hi: `गंभीर उच्च डायस्टोलिक BP। तत्काल उपचार आवश्यक।` });
    level = 'critical';
  }
  if (level !== 'critical') {
    if (systolicBP >= 140) {
      reasons.push({ factor: 'Systolic BP', value: `${systolicBP} mmHg`, threshold: '≥140 (WHO High)',
        en: `Systolic BP (${systolicBP} mmHg) meets WHO criteria for gestational hypertension.`,
        hi: `सिस्टोलिक BP गर्भकालीन उच्च रक्तचाप की WHO कसौटी को पूरा करता है।` });
      level = 'high';
    }
    if (diastolicBP >= 90) {
      reasons.push({ factor: 'Diastolic BP', value: `${diastolicBP} mmHg`, threshold: '≥90 (WHO High)',
        en: `Diastolic BP (${diastolicBP} mmHg) meets WHO gestational hypertension threshold.`,
        hi: `डायस्टोलिक BP WHO गर्भकालीन उच्च रक्तचाप सीमा पर है।` });
      if (level !== 'high') level = 'high';
    }
    if (previousPreeclampsia && systolicBP >= 130) {
      reasons.push({ factor: 'Recurrence Risk', value: `H/O Preeclampsia + BP ${systolicBP}`, threshold: '≥130 with history',
        en: `H/O preeclampsia with borderline BP — recurrence risk ~30%. Low-dose aspirin prophylaxis indicated.`,
        hi: `प्रीक्लेम्पसिया इतिहास + बढ़ा हुआ BP — लो-डोज़ एस्पिरिन की सलाह।` });
      if (level !== 'high') level = 'high';
    }
    if (age > 35 && gestationalWeeks > 20 && systolicBP >= 130) {
      reasons.push({ factor: 'Compound Risk', value: `Age ${age}, Wk ${gestationalWeeks}, BP ${systolicBP}`, threshold: 'WHO Combined',
        en: `AMA (age ${age}) + midtrimester BP elevation = compound risk profile per FOGSI 2019.`,
        hi: `उन्नत मातृ आयु और मध्य-तिमाही BP — FOGSI 2019 के अनुसार संयुक्त जोखिम।` });
      if (level !== 'critical' && level !== 'high') level = 'high';
    }
  }
  if (level !== 'critical' && level !== 'high') {
    if (systolicBP >= 130) { reasons.push({ factor: 'Systolic BP', value: `${systolicBP} mmHg`, threshold: '≥130', en: 'Pre-hypertensive range. 24h ABPM recommended.', hi: 'प्री-हाइपरटेंसिव। 24-घंटे BP मॉनिटरिंग सुझावित।' }); level = 'moderate'; }
    if (diastolicBP >= 80) { reasons.push({ factor: 'Diastolic BP', value: `${diastolicBP} mmHg`, threshold: '≥80', en: 'Stage 1 pre-hypertension.', hi: 'स्टेज 1 प्री-हाइपरटेंशन।' }); if (level === 'low') level = 'moderate'; }
    if (age > 35) { reasons.push({ factor: 'Advanced Maternal Age', value: `${age} yrs`, threshold: '>35', en: 'AMA — increased risk of hypertensive disorders.', hi: 'उन्नत मातृ आयु — उच्च रक्तचाप संबंधी जटिलताओं का जोखिम।' }); if (level === 'low') level = 'moderate'; }
    if (previousPreeclampsia) { reasons.push({ factor: 'H/O Preeclampsia', value: 'Present', threshold: 'Risk factor', en: 'Prior preeclampsia — 20–30% recurrence risk. Prophylactic aspirin from 12–16 wks.', hi: 'पिछला प्रीक्लेम्पसिया — 20-30% पुनरावृत्ति जोखिम।' }); if (level === 'low') level = 'moderate'; }
    if (diabetes) { reasons.push({ factor: 'Diabetes Mellitus', value: 'Present', threshold: 'Risk factor', en: 'DM increases preeclampsia risk 2–4×. Monitor HbA1c and renal function.', hi: 'मधुमेह से प्रीक्लेम्पसिया जोखिम 2-4 गुना बढ़ता है।' }); if (level === 'low') level = 'moderate'; }
    if (firstPregnancy) { reasons.push({ factor: 'Nulliparity', value: 'Primigravida', threshold: 'Risk factor', en: 'Nulliparous women have 3–4× higher preeclampsia incidence.', hi: 'पहली गर्भावस्था में प्रीक्लेम्पसिया 3-4 गुना अधिक सामान्य।' }); if (level === 'low') level = 'moderate'; }
    if (hemoglobin && hemoglobin < 11) { reasons.push({ factor: 'Haemoglobin', value: `${hemoglobin} g/dL`, threshold: '<11 g/dL (WHO)', en: 'Anaemia (Hb <11) increases maternal morbidity risk. Iron therapy indicated.', hi: 'एनीमिया। आयरन थेरेपी आवश्यक।' }); if (level === 'low') level = 'moderate'; }
    if (weight && height) {
      const bmi = weight / ((height / 100) ** 2);
      if (bmi > 30) { reasons.push({ factor: 'BMI', value: `${bmi.toFixed(1)} kg/m²`, threshold: '>30 (Obese)', en: `Obesity (BMI ${bmi.toFixed(1)}) — independent risk factor for preeclampsia and GDM.`, hi: `मोटापा (BMI ${bmi.toFixed(1)}) — स्वतंत्र जोखिम कारक।` }); if (level === 'low') level = 'moderate'; }
    }
  }
  if (!reasons.length) {
    reasons.push({ factor: 'All parameters', value: 'Normal', threshold: 'Within range', en: 'No significant risk factors identified. Continue standard ANC schedule.', hi: 'कोई महत्वपूर्ण जोखिम कारक नहीं। मानक ANC जारी रखें।' });
  }
  const actions = {
    critical: { en: 'Admit immediately. IV antihypertensives + MgSO₄ prophylaxis. Expedite delivery if ≥34 wks.', hi: 'तत्काल भर्ती। IV एंटीहाइपरटेंसिव + MgSO₄। ≥34 सप्ताह में प्रसव।' },
    high:     { en: 'Start oral antihypertensives. Twice-weekly BP + urine protein. Consider hospitalization.', hi: 'ओरल एंटीहाइपरटेंसिव शुरू करें। सप्ताह में दो बार BP + यूरिन प्रोटीन।' },
    moderate: { en: 'Weekly BP monitoring. Low-dose aspirin (75–150 mg/day) from 16 wks if risk persists.', hi: 'साप्ताहिक BP निगरानी। लो-डोज़ एस्पिरिन 16 सप्ताह से।' },
    low:      { en: 'Standard ANC. Monthly BP monitoring. Reassess risk at each visit.', hi: 'मानक ANC। मासिक BP निगरानी।' },
  };
  return { level, reasons: reasons.slice(0, 5), action: actions[level] };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── BP Trend SVG ─────────────────────────────────────────────────────────────
function BPTrend({ visits }) {
  if (!visits?.length) return null;
  const W = 280, H = 90;
  const pad = { t: 8, r: 8, b: 18, l: 30 };
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;
  const allBP = visits.flatMap(v => [v.systolicBP, v.diastolicBP]);
  const minV = Math.min(...allBP) - 8;
  const maxV = Math.max(...allBP) + 8;
  const n = visits.length;
  const gx = (i) => pad.l + (n < 2 ? cw / 2 : (i / (n - 1)) * cw);
  const gy = (v) => H - pad.b - ((v - minV) / (maxV - minV)) * ch;
  const sys = visits.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)},${gy(v.systolicBP).toFixed(1)}`).join(' ');
  const dia = visits.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)},${gy(v.diastolicBP).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[120, 140, 160].filter(v => v > minV && v < maxV).map(v => (
        <line key={v} x1={pad.l} y1={gy(v)} x2={W - pad.r} y2={gy(v)} stroke="#F2DDD0" strokeWidth="1" />
      ))}
      <path d={sys} fill="none" stroke="#C75B39" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={dia} fill="none" stroke="#E8863A" strokeWidth="2"   strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
      {visits.map((v, i) => (
        <g key={i}>
          <circle cx={gx(i)} cy={gy(v.systolicBP)}  r="4" fill="#C75B39" />
          <circle cx={gx(i)} cy={gy(v.diastolicBP)} r="3" fill="#E8863A" />
          <text x={gx(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#8A8580">{fmt(v.date).split(' ')[0]}</text>
        </g>
      ))}
      <text x={pad.l - 2} y={gy(visits[0]?.systolicBP ?? 120)} textAnchor="end" fontSize="8" fill="#C75B39">S</text>
      <text x={pad.l - 2} y={gy(visits[0]?.diastolicBP ?? 80)} textAnchor="end" fontSize="8" fill="#E8863A">D</text>
    </svg>
  );
}

// ── Risk Distribution Bar ─────────────────────────────────────────────────────
function RiskDistBar({ patients }) {
  const n = patients.length || 1;
  const c = {
    low:      patients.filter(p => p.riskLevel === 'low').length,
    moderate: patients.filter(p => p.riskLevel === 'moderate').length,
    high:     patients.filter(p => p.riskLevel === 'high').length,
    critical: patients.filter(p => p.riskLevel === 'critical').length,
  };
  const segments = [
    { key: 'low',      color: 'bg-sage',          count: c.low      },
    { key: 'moderate', color: 'bg-amber-alert',   count: c.moderate },
    { key: 'high',     color: 'bg-terracotta',    count: c.high     },
    { key: 'critical', color: 'bg-rose-critical', count: c.critical },
  ].filter(s => s.count > 0);

  return (
    <div>
      <div className="flex h-7 rounded-xl overflow-hidden gap-0.5">
        {segments.map(({ key, color, count }) => (
          <motion.div
            key={key}
            initial={{ width: 0 }}
            animate={{ width: `${(count / n) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className={`${color} flex items-center justify-center`}
            title={`${key}: ${count}`}
          >
            {(count / n) > 0.08 && <span className="text-white text-xs font-bold">{count}</span>}
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
        {[
          { label: 'Low', color: 'bg-sage', count: c.low },
          { label: 'Moderate', color: 'bg-amber-alert', count: c.moderate },
          { label: 'High', color: 'bg-terracotta', count: c.high },
          { label: 'Critical', color: 'bg-rose-critical', count: c.critical },
        ].map(({ label, color, count }) => (
          <span key={label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />{label}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Patient Detail Slide-in ───────────────────────────────────────────────────
function PatientDetailPanel({ patient, onClose, lang }) {
  const result = useMemo(() => calculateRisk(patient), [patient]);
  const rs = {
    low:      { text: 'text-sage',          bg: 'bg-sage/10',          border: 'border-sage/30'          },
    moderate: { text: 'text-amber-alert',   bg: 'bg-amber-alert/10',   border: 'border-amber-alert/30'   },
    high:     { text: 'text-terracotta',    bg: 'bg-terracotta/10',    border: 'border-terracotta/30'    },
    critical: { text: 'text-rose-critical', bg: 'bg-rose-critical/10', border: 'border-rose-critical/30' },
  }[result.level];
  const bmi = patient.weight && patient.height
    ? (patient.weight / ((patient.height / 100) ** 2)).toFixed(1)
    : '—';

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-ivory shadow-warm-xl z-50 overflow-y-auto border-l border-blush"
    >
      {/* Header */}
      <div className="sticky top-0 bg-ivory/95 backdrop-blur-sm border-b border-blush px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-charcoal">{patient.name}</h2>
          <p className="text-xs text-muted">{patient.age} yrs · Wk {patient.gestationalWeeks} · {patient.ashaWorkerId}</p>
        </div>
        <button onClick={onClose} className="text-muted hover:text-rose-critical transition-colors p-1.5">
          <X size={20} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Risk level */}
        <div className={`rounded-2xl p-4 border ${rs.bg} ${rs.border}`}>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Risk Level</p>
          <p className={`font-serif text-2xl font-bold ${rs.text}`}>
            {result.level.charAt(0).toUpperCase() + result.level.slice(1)} Risk
          </p>
          <p className={`text-sm font-medium mt-2 ${rs.text}`}>
            → {lang === 'hi' ? result.action.hi : result.action.en}
          </p>
        </div>

        {/* Two-column clinical overview */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left — ASHA-Collected Data */}
          <div className="bg-cream rounded-2xl p-4 border border-blush">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">ASHA Data</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-muted">Age</span>
                <span className="text-xs font-semibold text-charcoal">{patient.age} yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Week</span>
                <span className="text-xs font-semibold text-charcoal">Wk {patient.gestationalWeeks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Village</span>
                <span className="text-xs font-semibold text-charcoal">{patient.village || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">BP</span>
                <span className="text-xs font-mono font-bold text-charcoal">{patient.systolicBP}/{patient.diastolicBP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Hb</span>
                <span className="text-xs font-semibold text-charcoal">{patient.hemoglobin ? `${patient.hemoglobin} g/dL` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Gravida</span>
                <span className="text-xs font-semibold text-charcoal">{patient.gravida || (patient.firstPregnancy ? 'G1' : '—')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted">Diabetes</span>
                <span className="text-xs font-semibold text-charcoal">{patient.diabetes ? 'Yes' : 'No'}</span>
              </div>
              <div className="pt-1">
                <p className="text-xs text-muted mb-1.5">Symptoms</p>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Headache', key: 'headache' },
                    { label: 'Visual', key: 'visualDisturbance' },
                    { label: 'Edema', key: 'edema' },
                  ].map(({ label, key }) => (
                    <span key={key} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      patient[key]
                        ? 'bg-terracotta/10 text-terracotta border-terracotta/30'
                        : 'bg-blush text-muted border-blush'
                    }`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Lab Values */}
          <div className="bg-cream rounded-2xl p-4 border border-blush">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Lab Values</p>
            <div className="space-y-2">
              {[
                { label: 'SGOT', value: patient.sgot ? `${patient.sgot} U/L` : '—' },
                { label: 'SGPT', value: patient.sgpt ? `${patient.sgpt} U/L` : '—' },
                { label: 'Platelets', value: patient.platelets ? `${patient.platelets}k/µL` : '—' },
                { label: 'Creatinine', value: patient.creatinine ? `${patient.creatinine} mg/dL` : '—' },
                { label: 'Urine Protein', value: patient.urineProtein || '—' },
                { label: 'Epigastric Pain', value: patient.epigastricPain ? 'Present' : patient.epigastricPain === false ? 'Absent' : '—' },
                { label: 'Seizures', value: patient.seizures ? 'Present' : patient.seizures === false ? 'Absent' : '—' },
                { label: 'BMI', value: bmi },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-muted">{label}</span>
                  <span className={`text-xs font-semibold ${value === '—' ? 'text-muted/50' : 'text-charcoal'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Risk Factors</p>
          <div className="space-y-2">
            {result.reasons.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-cream rounded-xl p-3 border border-blush">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-charcoal">{r.factor}</span>
                  <span className="text-xs font-mono text-muted shrink-0">{r.value}</span>
                </div>
                {/* Contribution bar */}
                <div className="h-1.5 bg-blush rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: r.severity === 'critical' ? '95%' : r.severity === 'high' ? '75%' : r.severity === 'moderate' ? '50%' : '20%' }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      r.severity === 'critical' ? 'bg-rose-critical' :
                      r.severity === 'high'     ? 'bg-terracotta' :
                      r.severity === 'moderate' ? 'bg-amber-alert' : 'bg-sage'
                    }`}
                  />
                </div>
                <p className="text-xs text-muted leading-relaxed">{lang === 'hi' ? r.hi : r.en}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted/60 mt-2 text-center">Based on WHO 2019 & FOGSI clinical guidelines</p>
        </div>

        {/* Visit history */}
        {patient.visits?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">BP Trend (mmHg)</p>
            <div className="bg-cream rounded-2xl p-4 border border-blush mb-3">
              <BPTrend visits={patient.visits.slice(0, 4)} />
              <div className="flex gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1 text-xs text-muted"><span className="w-4 h-0.5 bg-terracotta inline-block rounded" /> Systolic</span>
                <span className="flex items-center gap-1 text-xs text-muted"><span className="w-4 h-0.5 bg-saffron inline-block rounded border-dashed" /> Diastolic</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Visit History</p>
            <div className="space-y-2">
              {patient.visits.map((v, i) => (
                <div key={i} className="bg-cream rounded-xl px-4 py-3 border border-blush flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-charcoal">{fmt(v.date)}</p>
                    {v.notes && <p className="text-xs text-muted mt-0.5 leading-relaxed">{v.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-semibold text-charcoal">{v.systolicBP}/{v.diastolicBP}</p>
                    <p className="text-xs text-muted">{v.weight} kg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { t, lang } = useLanguage();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const [showModelInfo, setShowModelInfo] = useState(false);

  // Fetch patients from backend API
  useEffect(() => {
    setLoadingPatients(true);
    fetch('http://127.0.0.1:8000/asha/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(Array.isArray(data) ? data : []);
        setPatientsError('');
      })
      .catch(err => {
        console.error('Error fetching patients:', err);
        setPatientsError('Failed to load patients. Please try again.');
        setPatients([]);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  const sorted = useMemo(() => {
    const o = { critical: 0, high: 1, moderate: 2, low: 3 };
    return [...patients].sort((a, b) => o[a.riskLevel] - o[b.riskLevel]);
  }, [patients]);

  const stats = useMemo(() => ({
    total:    sorted.length,
    critical: sorted.filter(p => p.riskLevel === 'critical').length,
    high:     sorted.filter(p => p.riskLevel === 'high').length,
    consults: 3, // mock
  }), [sorted]);

  const alertPatients = sorted.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');

  return (
    <div className="min-h-screen bg-cream">
      <TopBar />

      {/* Overlay for panel */}
      <AnimatePresence>
        {selectedPatient && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/20 z-40 backdrop-blur-sm"
              onClick={() => setSelectedPatient(null)}
            />
            <PatientDetailPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} lang={lang} />
          </>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-7">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
          <h1 className="font-serif text-3xl text-charcoal">{t('doctorGreeting')} 🩺</h1>
          <p className="text-sm text-muted mt-1">
            {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('totalUnderCare'), value: stats.total,    icon: Users,          color: 'bg-saffron/10 text-saffron'              },
            { label: t('criticalAlerts'), value: stats.critical, icon: AlertTriangle,  color: 'bg-rose-critical/10 text-rose-critical'  },
            { label: t('highRisk'),        value: stats.high,    icon: Activity,       color: 'bg-terracotta/10 text-terracotta'        },
            { label: t('consultationsToday'), value: stats.consults, icon: Calendar,   color: 'bg-sage/10 text-sage'                    },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 120 }}
              className="bg-ivory rounded-2xl px-4 py-5 shadow-soft border border-blush"
            >
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
                <Icon size={15} />
              </div>
              <p className="font-serif text-3xl font-bold text-charcoal">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Urgent Cases: Critical + High Risk */}
        {alertPatients.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-rose-critical" />
              <h2 className="font-serif text-xl text-charcoal">
                {lang === 'hi' ? 'तत्काल ध्यान दें' : 'Urgent Cases'}
              </h2>
              <span className="ml-auto bg-rose-critical/10 text-rose-critical text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse-border border border-rose-critical/20">
                {alertPatients.length}
              </span>
            </div>
            <div className="space-y-3">
              {alertPatients.slice(0, 4).map(p => {
                const r = calculateRisk(p);
                const isCritical = p.riskLevel === 'critical';
                return (
                  <motion.div key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-ivory rounded-2xl border-2 shadow-warm p-5 ${
                      isCritical
                        ? 'border-rose-critical/40 animate-pulse-border'
                        : 'border-terracotta/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-rose-critical animate-pulse-dot' : 'bg-terracotta'}`} />
                          <h3 className="font-serif text-lg text-charcoal">{p.name}</h3>
                        </div>
                        <p className="text-xs text-muted">{p.age} yrs · Wk {p.gestationalWeeks} · BP {p.systolicBP}/{p.diastolicBP}</p>
                      </div>
                      <RiskBadge level={p.riskLevel} size="md" />
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {r.reasons.slice(0, 2).map((reason, i) => (
                        <div key={i} className="text-xs text-muted flex gap-2">
                          <span className={`mt-0.5 ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`}>▸</span>
                          <span>{lang === 'hi' ? reason.hi : reason.en}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`rounded-xl px-4 py-2.5 border mb-3 ${
                      isCritical
                        ? 'bg-rose-critical/5 border-rose-critical/20'
                        : 'bg-terracotta/5 border-terracotta/20'
                    }`}>
                      <p className={`text-sm font-semibold ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`}>
                        {lang === 'hi' ? r.action.hi : r.action.en}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="flex items-center gap-2 text-xs font-semibold text-saffron hover:text-terracotta transition-colors"
                    >
                      {t('viewReport')} <ChevronRight size={12} />
                    </button>
                  </motion.div>
                );
              })}
              {alertPatients.length > 4 && (
                <p className="text-xs text-center text-saffron font-semibold cursor-pointer hover:text-terracotta transition-colors py-1">
                  {lang === 'hi'
                    ? `सभी ${alertPatients.length} तत्काल मामले देखें`
                    : `View all ${alertPatients.length} urgent cases`}
                </p>
              )}
            </div>
          </section>
        )}

        {/* All Patients Table */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope size={15} className="text-saffron" />
            <h2 className="font-serif text-xl text-charcoal">
              {lang === 'hi' ? 'सभी मरीज़' : 'All Patients'}
            </h2>
            <span className="ml-2 bg-saffron/10 text-saffron text-xs font-bold px-2 py-0.5 rounded-full border border-saffron/20">
              {sorted.length}
            </span>
          </div>
          <div className="bg-ivory rounded-2xl border border-blush overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-blush bg-cream">
                    {['patient','age','week','bp','risk','bpTrend','date','action'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                        {col === 'bpTrend'
                          ? (lang === 'hi' ? 'BP ट्रेंड' : 'BP Trend')
                          : t(`tableHeaders.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => {
                    const visits = p.visits || [];
                    const latestSys = visits.length > 0 ? visits[visits.length - 1].systolicBP : null;
                    const prevSys = visits.length > 1 ? visits[visits.length - 2].systolicBP : null;
                    const trendDir = latestSys && prevSys
                      ? latestSys - prevSys > 5 ? 'up'
                        : prevSys - latestSys > 5 ? 'down'
                        : 'stable'
                      : 'none';
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedPatient(p)}
                        className={`border-b border-blush/60 cursor-pointer hover:bg-blush/30 transition-colors ${i % 2 === 0 ? '' : 'bg-cream/50'}`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-serif text-sm text-charcoal font-semibold">{p.name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{p.age}</td>
                        <td className="px-4 py-3 text-sm text-muted">{p.gestationalWeeks}</td>
                        <td className="px-4 py-3 text-sm font-mono text-charcoal">{p.systolicBP}/{p.diastolicBP}</td>
                        <td className="px-4 py-3"><RiskBadge level={p.riskLevel} /></td>
                        <td className="px-4 py-3">
                          {visits.length > 1 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-20 h-7">
                                <BPTrend visits={visits.slice(-4)} />
                              </div>
                              <span className={`text-xs font-bold ${
                                trendDir === 'up'   ? 'text-rose-critical' :
                                trendDir === 'down' ? 'text-sage' : 'text-muted'
                              }`}>
                                {trendDir === 'up' ? '⬆' : trendDir === 'down' ? '⬇' : '—'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{fmt(p.lastVisitDate)}</td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-saffron font-semibold hover:text-terracotta transition-colors flex items-center gap-1">
                            {t('viewReport')} <ChevronRight size={10} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* AI Trust Badge — collapsed by default */}
        <section className="bg-ivory rounded-2xl border border-blush overflow-hidden shadow-soft">
          <button
            onClick={() => setShowModelInfo(!showModelInfo)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-cream/50 transition-colors"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck size={14} className="text-sage" />
              <span className="text-sm text-charcoal">
                AI Model: <span className="font-semibold text-sage">98.1%</span> validated on 104 real patients
              </span>
              <span className="text-xs text-muted mx-1">·</span>
              <span className="text-xs text-muted">WHO/FOGSI aligned</span>
              <span className="text-xs text-muted mx-1">·</span>
              <span className="text-xs text-muted">Severe PE recall: 100%</span>
            </div>
            <ChevronRight size={14} className={`text-muted transition-transform shrink-0 ml-2 ${showModelInfo ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showModelInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-blush px-5 py-4"
              >
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-cream rounded-xl p-3 border border-blush">
                    <p className="text-xs text-muted">Training</p>
                    <p className="text-sm font-semibold text-charcoal">2,006 synthetic patients</p>
                  </div>
                  <div className="bg-cream rounded-xl p-3 border border-blush">
                    <p className="text-xs text-muted">Validation</p>
                    <p className="text-sm font-semibold text-charcoal">104 real hospital patients</p>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Gradient Boosting · 11 ASHA-collectible features · Zero data leakage · Top predictors: diastolic BP, systolic BP, visual disturbance
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="h-8" />
      </div>
    </div>
  );
}
