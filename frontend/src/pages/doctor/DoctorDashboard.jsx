import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertTriangle, Stethoscope, Calendar, X,
  ChevronRight, Activity, ShieldCheck, Bell, RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import TopBar from '../../components/shared/TopBar';

const RISK_COLORS = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  elevated: 'bg-orange-100 text-orange-700 border border-orange-200',
  monitor: 'bg-blue-100 text-blue-700 border border-blue-200',
  safe: 'bg-green-100 text-green-700 border border-green-200',
};

const RISK_LABELS = {
  critical: { en: 'Critical', hi: 'गंभीर' },
  elevated: { en: 'Elevated', hi: 'उच्च' },
  monitor: { en: 'Monitor', hi: 'निगरानी' },
  safe: { en: 'Safe', hi: 'सुरक्षित' },
};

const STATUS_STYLES = {
  pending: 'bg-amber-alert/15 text-amber-alert border border-amber-alert/30',
  accepted: 'bg-sage/15 text-sage border border-sage/30',
  resolved: 'bg-terracotta/15 text-terracotta border border-terracotta/30',
};

const RISK_SORT_ORDER = { critical: 0, elevated: 1, monitor: 2, safe: 3, unknown: 4 };

const RISK_DOT_COLORS = {
  critical: 'bg-rose-critical',
  elevated: 'bg-terracotta',
  monitor: 'bg-saffron',
  safe: 'bg-sage',
  unknown: 'bg-muted',
};

const TAB_LABELS = {
  overview: { en: 'Overview', hi: 'ओवरव्यू' },
  labs: { en: 'Lab Values', hi: 'लैब वैल्यू' },
  history: { en: 'Visit History', hi: 'विज़िट हिस्ट्री' },
};

function normalizeRiskLevel(level) {
  const value = String(level || '').trim().toLowerCase();
  if (!value) return 'unknown';
  if (value === 'critical') return 'critical';
  if (value === 'high' || value === 'elevated') return 'elevated';
  if (value === 'medium' || value === 'moderate' || value === 'monitor') return 'monitor';
  if (value === 'low' || value === 'safe') return 'safe';
  return value;
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatBP(v) {
  const sys = v?.blood_pressure_sys ?? v?.latest_bp_sys;
  const dia = v?.blood_pressure_dia ?? v?.latest_bp_dia;
  return (sys && dia) ? `${sys}/${dia}` : '—';
}

function parseSymptoms(symptoms) {
  if (!symptoms) return [];
  if (Array.isArray(symptoms)) return symptoms;
  return String(symptoms)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function RiskPill({ level, lang }) {
  const normalized = normalizeRiskLevel(level);
  const colorClass = RISK_COLORS[normalized] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
  const label = RISK_LABELS[normalized]?.[lang] ?? normalized ?? '—';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT_COLORS[normalized] || RISK_DOT_COLORS.unknown}`} />
      {label}
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed top-4 right-4 z-[70]">
      <div className={`rounded-xl px-4 py-2 text-sm shadow-warm border ${toast.type === 'error'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-sage/15 text-sage border-sage/30'
      }`}>
        {toast.text}
      </div>
    </div>
  );
}

function PatientDetailPanel({
  detail,
  onClose,
  lang,
  loading,
  onUpdateStatus,
  onSaveNotes,
  onSaveLabs,
  onQuickRefer,
  actionLoading,
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [editingLabs, setEditingLabs] = useState(false);
  const [labs, setLabs] = useState({
    sgot: '',
    sgpt: '',
    platelet_count: '',
    serum_creatinine: '',
    proteinuria: 'Nil',
    edema: 'none',
    epigastric_pain: false,
    seizures: false,
  });

  useEffect(() => {
    if (!detail) return;
    setNotes(detail.referral?.notes || '');
    setLabs({
      sgot: detail.clinical_labs?.sgot ?? '',
      sgpt: detail.clinical_labs?.sgpt ?? '',
      platelet_count: detail.clinical_labs?.platelet_count ?? '',
      serum_creatinine: detail.clinical_labs?.serum_creatinine ?? '',
      proteinuria: detail.clinical_labs?.proteinuria ?? 'Nil',
      edema: detail.clinical_labs?.edema ?? 'none',
      epigastric_pain: Boolean(detail.clinical_labs?.epigastric_pain),
      seizures: Boolean(detail.clinical_labs?.seizures),
    });
    setEditingLabs(false);
    setActiveTab('overview');
  }, [detail]);

  const referral = detail?.referral;
  const patient = detail?.patient;
  const latestVitals = detail?.latest_vitals;
  const visits = detail?.vitals_history || [];
  const riskAssessments = detail?.risk_assessments || [];
  const latestRisk = normalizeRiskLevel(referral?.latest_risk_level || riskAssessments[0]?.risk_level);
  const status = referral?.status || 'pending';
  const week = patient?.weeks_pregnant ? `Wk ${patient.weeks_pregnant}` : '—';
  const bp = formatBP(latestVitals);
  const bmi = (latestVitals?.weight_kg && patient?.height_cm)
    ? (latestVitals.weight_kg / Math.pow(patient.height_cm / 100, 2)).toFixed(1)
    : '—';
  const scorePct = typeof riskAssessments[0]?.risk_score === 'number'
    ? Math.round(riskAssessments[0].risk_score * 100)
    : null;

  const assessmentFlags = Array.isArray(riskAssessments[0]?.flags)
    ? riskAssessments[0].flags.slice(0, 6)
    : [];

  const saveLabs = async () => {
    if (!patient?.id) return;
    const payload = {
      sgot: labs.sgot === '' ? null : Number(labs.sgot),
      sgpt: labs.sgpt === '' ? null : Number(labs.sgpt),
      platelet_count: labs.platelet_count === '' ? null : Number(labs.platelet_count),
      serum_creatinine: labs.serum_creatinine === '' ? null : Number(labs.serum_creatinine),
      proteinuria: labs.proteinuria || null,
      edema: labs.edema || null,
      epigastric_pain: Boolean(labs.epigastric_pain),
      seizures: Boolean(labs.seizures),
    };
    const ok = await onSaveLabs(patient.id, payload);
    if (ok) setEditingLabs(false);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="fixed inset-y-0 right-0 w-full max-w-xl bg-ivory shadow-warm-xl z-50 overflow-y-auto border-l border-blush"
    >
      <div className="sticky top-0 bg-ivory/95 backdrop-blur-sm border-b border-blush px-5 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-xl font-semibold text-charcoal tracking-tight">{patient?.name || 'Patient'}</h2>
          <p className="text-xs text-muted font-medium">
            {patient?.age || '—'} yrs • {week} • {patient?.village || '—'}
          </p>
        </div>
        <button onClick={onClose} className="text-muted hover:text-rose-critical transition-colors p-1.5">
          <X size={20} />
        </button>
      </div>

      {loading || !detail ? (
        <div className="p-5 text-sm text-muted">Loading patient details...</div>
      ) : (
        <div className="p-5 space-y-5 font-sans">
          <div className="bg-cream rounded-2xl border border-blush p-4 space-y-3 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {lang === 'hi' ? 'रेफरल' : 'Referral'}: {status}
              </span>
              <select
                value={status}
                onChange={(e) => onUpdateStatus(referral.id, e.target.value)}
                className="text-xs border border-blush rounded-lg px-2.5 py-1.5 bg-ivory text-charcoal font-medium"
                disabled={actionLoading}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <textarea
              placeholder="Add clinical notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm border border-blush rounded-lg p-3 resize-none h-20 mt-2 bg-ivory leading-relaxed"
            />
            <button
              onClick={() => onSaveNotes(referral.id, notes)}
              disabled={actionLoading}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-saffron text-white hover:bg-terracotta transition-colors disabled:opacity-50 shadow-soft"
            >
              Save Notes
            </button>
          </div>

          <div className="flex items-center gap-2 bg-cream rounded-xl border border-blush p-1.5">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'labs', label: 'Lab Values' },
              { key: 'history', label: 'Visit History' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 text-xs px-3 py-2 rounded-lg border transition-all font-medium ${activeTab === tab.key
                  ? 'bg-saffron/10 text-saffron border-saffron/40 shadow-soft'
                  : 'bg-ivory text-muted border-transparent hover:text-charcoal'
                }`}
              >
                {lang === 'hi' ? TAB_LABELS[tab.key].hi : TAB_LABELS[tab.key].en}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className={`rounded-2xl p-4 border shadow-soft ${RISK_COLORS[latestRisk] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1">{lang === 'hi' ? 'जोखिम स्तर' : 'Risk Level'}</p>
                <p className="text-2xl font-bold tracking-tight">{(RISK_LABELS[latestRisk]?.[lang] || latestRisk || '—')} {lang === 'hi' ? 'जोखिम' : 'Risk'}</p>
                <p className="text-xs mt-2 font-medium">{lang === 'hi' ? 'नवीनतम आकलन' : 'Latest assessment'}</p>
              </div>

              <div className="bg-cream rounded-2xl p-4 border border-blush shadow-soft">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{lang === 'hi' ? 'एक्लेम्पसिया आकलन' : 'Eclampsia Assessment'}</p>
                {visits.length < 3 ? (
                  <div className="text-xs text-muted">
                    <p className="font-medium">●●○ {visits.length}/3 {lang === 'hi' ? 'विज़िट - प्रेडिक्शन लॉक' : 'visits - prediction locked'}</p>
                    <p className="mt-1">{lang === 'hi' ? 'कम से कम 3 विज़िट के बाद प्रेडिक्शन उपलब्ध होगा।' : 'Need at least 3 recorded visits to unlock prediction.'}</p>
                  </div>
                ) : riskAssessments.length > 0 ? (
                  <div className={`rounded-xl p-3 border shadow-soft ${RISK_COLORS[latestRisk] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    <p className="text-sm font-semibold">Eclampsia Risk: {(RISK_LABELS[latestRisk]?.[lang] || latestRisk || '—').toUpperCase()}</p>
                    <p className="text-xs mt-1">Score: {scorePct ?? '—'}% · Based on {visits.length} visits</p>
                    {assessmentFlags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {assessmentFlags.map((flag) => (
                          <span key={flag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-white/60">
                            {String(flag).replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No risk assessment available yet.</p>
                )}
              </div>

              <div className="bg-cream rounded-2xl p-4 border border-blush shadow-soft">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{lang === 'hi' ? 'आशा डेटा' : 'ASHA Data'}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">Age</span><span className="text-xs font-semibold text-charcoal">{patient?.age || '—'} yrs</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">Week</span><span className="text-xs font-semibold text-charcoal">{week}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">BP</span><span className="text-xs font-mono font-bold text-charcoal">{bp}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">Hb</span><span className="text-xs font-semibold text-charcoal">{latestVitals?.hemoglobin ? `${latestVitals.hemoglobin} g/dL` : '—'}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">Gravida</span><span className="text-xs font-semibold text-charcoal">{patient?.gravida ?? '—'}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">Parity</span><span className="text-xs font-semibold text-charcoal">{patient?.parity ?? '—'}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">Diabetes</span><span className="text-xs font-semibold text-charcoal">{patient?.diabetic_history ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between col-span-1"><span className="text-xs text-muted">BMI</span><span className="text-xs font-semibold text-charcoal">{bmi}</span></div>
                  <div className="flex justify-between col-span-2"><span className="text-xs text-muted">Village</span><span className="text-xs font-semibold text-charcoal">{patient?.village || '—'}</span></div>
                  <div className="pt-1">
                    <p className="text-xs text-muted mb-1.5">Symptoms</p>
                    <div className="flex flex-wrap gap-1">
                      {parseSymptoms(latestVitals?.symptoms).length > 0 ? parseSymptoms(latestVitals?.symptoms).map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full border font-medium bg-terracotta/10 text-terracotta border-terracotta/30">
                          {s}
                        </span>
                      )) : <span className="text-xs text-muted">—</span>}
                    </div>
                  </div>
                </div>
              </div>

              {referral?.id ? (
                <div className="bg-cream rounded-2xl p-4 border border-blush shadow-soft">
                  <p className="text-xs text-muted">Referral Date: {formatDate(referral.referred_at)}</p>
                  <p className="text-xs mt-1">
                    Current Status: <span className="font-semibold text-charcoal">{referral.status || 'pending'}</span>
                  </p>
                </div>
              ) : (
                <button
                  className="w-full mt-4 bg-orange-500 text-white rounded-xl py-3 font-semibold"
                  disabled={actionLoading}
                  onClick={() => onQuickRefer(patient.id)}
                >
                  Refer to Doctor
                </button>
              )}
            </div>
          )}

          {activeTab === 'labs' && (
            <div className="bg-cream rounded-2xl p-4 border border-blush space-y-3 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Lab Values</p>
                <button
                  onClick={() => (editingLabs ? saveLabs() : setEditingLabs(true))}
                  disabled={actionLoading}
                  className="text-xs px-3 py-1.5 rounded-lg border border-saffron/30 text-saffron hover:bg-saffron/10 disabled:opacity-50"
                >
                  {editingLabs ? 'Save Labs' : 'Edit Labs'}
                </button>
              </div>

              {[
                { key: 'sgot', label: 'SGOT' },
                { key: 'sgpt', label: 'SGPT' },
                { key: 'platelet_count', label: 'Platelets' },
                { key: 'serum_creatinine', label: 'Creatinine' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">{field.label}</span>
                  {editingLabs ? (
                    <input
                      type="number"
                      placeholder="—"
                      value={labs[field.key] ?? ''}
                      onChange={(e) => setLabs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-20 border-b border-blush text-sm text-right bg-transparent focus:outline-none"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-charcoal">{labs[field.key] || '—'}</span>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Urine Protein</span>
                {editingLabs ? (
                  <select
                    value={labs.proteinuria || 'Nil'}
                    onChange={(e) => setLabs((prev) => ({ ...prev, proteinuria: e.target.value }))}
                    className="text-xs border border-blush rounded px-2 py-1 bg-ivory"
                  >
                    <option value="Nil">Nil</option>
                    <option value="1+">1+</option>
                    <option value="2+">2+</option>
                    <option value="3+">3+</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-charcoal">{labs.proteinuria || '—'}</span>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Edema</span>
                {editingLabs ? (
                  <select
                    value={labs.edema || 'none'}
                    onChange={(e) => setLabs((prev) => ({ ...prev, edema: e.target.value }))}
                    className="text-xs border border-blush rounded px-2 py-1 bg-ivory"
                  >
                    <option value="none">none</option>
                    <option value="mild">mild</option>
                    <option value="moderate">moderate</option>
                    <option value="severe">severe</option>
                  </select>
                ) : (
                  <span className="text-xs font-semibold text-charcoal">{labs.edema || '—'}</span>
                )}
              </div>

              {[
                { key: 'epigastric_pain', label: 'Epigastric Pain' },
                { key: 'seizures', label: 'Seizures' },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">{field.label}</span>
                  {editingLabs ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setLabs((prev) => ({ ...prev, [field.key]: true }))}
                        className={`text-xs px-2 py-1 rounded border ${labs[field.key] ? 'bg-sage/10 text-sage border-sage/30' : 'border-blush text-muted'}`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setLabs((prev) => ({ ...prev, [field.key]: false }))}
                        className={`text-xs px-2 py-1 rounded border ${!labs[field.key] ? 'bg-rose-critical/10 text-rose-critical border-rose-critical/30' : 'border-blush text-muted'}`}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-charcoal">{labs[field.key] ? 'Yes' : 'No'}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {visits.length === 0 && <p className="text-xs text-muted">No visits found.</p>}
              {visits.map((v) => {
                const visitRisk = normalizeRiskLevel(
                  riskAssessments.find((ra) => ra.vitals_id === v.id)?.risk_level || referral?.latest_risk_level,
                );
                const visitBP = (v?.blood_pressure_sys && v?.blood_pressure_dia)
                  ? `${v.blood_pressure_sys}/${v.blood_pressure_dia}`
                  : '—';
                const leftAccent = visitRisk === 'critical'
                  ? 'border-l-rose-critical'
                  : visitRisk === 'elevated'
                    ? 'border-l-terracotta'
                    : 'border-l-saffron';

                return (
                  <div key={v.id} className={`bg-ivory rounded-xl px-4 py-3 border border-blush border-l-4 ${leftAccent} shadow-soft`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-charcoal">{formatDate(v.recorded_at)}</p>
                        <p className="text-xs text-muted mt-0.5 font-medium">BP {visitBP} · Hb {v.hemoglobin ?? '—'}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {parseSymptoms(v.symptoms).length > 0 ? parseSymptoms(v.symptoms).map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border bg-blush text-muted border-blush">
                              {s}
                            </span>
                          )) : <span className="text-[10px] text-muted">No symptoms</span>}
                        </div>
                      </div>
                      <RiskPill level={visitRisk} lang={lang} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function DoctorDashboard() {
  const { t, lang } = useLanguage();
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/doctor/referrals');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReferrals(Array.isArray(data) ? data : []);
      setPatientsError('');
    } catch (err) {
      console.error('Error fetching doctor referrals:', err);
      setPatientsError('Failed to load doctor referrals. Please try again.');
      setReferrals([]);
    } finally {
      setLoadingReferrals(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && selectedReferralId) {
        setSelectedReferralId(null);
        setSelectedDetail(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedReferralId]);

  const openReferral = async (referralId) => {
    setSelectedReferralId(referralId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/referrals/${referralId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSelectedDetail(data);
    } catch (err) {
      console.error('Failed to fetch referral detail:', err);
      setSelectedDetail(null);
      setToast({ type: 'error', text: 'Failed to load patient detail' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const updateStatus = async (referralId, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/referrals/${referralId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setReferrals((prev) => prev.map((r) => (r.id === referralId ? { ...r, status: updated.status, notes: updated.notes, resolved_at: updated.resolved_at } : r)));
      setSelectedDetail((prev) => (prev ? { ...prev, referral: { ...prev.referral, status: updated.status, notes: updated.notes, resolved_at: updated.resolved_at } } : prev));
      setToast({ type: 'success', text: 'Status updated' });
    } catch (err) {
      console.error('Failed to update referral status:', err);
      setToast({ type: 'error', text: 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async (referralId, notes) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/referrals/${referralId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setReferrals((prev) => prev.map((r) => (r.id === referralId ? { ...r, notes: updated.notes, status: updated.status } : r)));
      setSelectedDetail((prev) => (prev ? { ...prev, referral: { ...prev.referral, notes: updated.notes, status: updated.status } } : prev));
      setToast({ type: 'success', text: 'Notes saved' });
    } catch (err) {
      console.error('Failed to save notes:', err);
      setToast({ type: 'error', text: 'Failed to save notes' });
    } finally {
      setActionLoading(false);
    }
  };

  const saveLabs = async (patientId, labsPayload) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/patients/${patientId}/labs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(labsPayload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = await res.json();
      setSelectedDetail((prev) => (prev ? { ...prev, clinical_labs: saved } : prev));
      setToast({ type: 'success', text: 'Labs saved' });
      return true;
    } catch (err) {
      console.error('Failed to save labs:', err);
      setToast({ type: 'error', text: 'Failed to save labs' });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const quickRefer = async (patientId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/doctor/patients/${patientId}/refer`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      setReferrals((prev) => {
        const already = prev.some((r) => r.id === created.id);
        return already ? prev : [created, ...prev];
      });
      if (selectedDetail) {
        setSelectedDetail((prev) => (prev ? { ...prev, referral: created } : prev));
      }
      setToast({ type: 'success', text: 'Referral created' });
    } catch (err) {
      console.error('Failed to create referral:', err);
      setToast({ type: 'error', text: 'Failed to create referral' });
    } finally {
      setActionLoading(false);
    }
  };

  const sorted = useMemo(() => {
    return [...referrals]
      .map((r) => ({ ...r, latest_risk_level: normalizeRiskLevel(r.latest_risk_level) }))
      .sort((a, b) => {
        const aOrder = RISK_SORT_ORDER[normalizeRiskLevel(a.latest_risk_level)] ?? RISK_SORT_ORDER.unknown;
        const bOrder = RISK_SORT_ORDER[normalizeRiskLevel(b.latest_risk_level)] ?? RISK_SORT_ORDER.unknown;
        if (aOrder !== bOrder) return aOrder - bOrder;
        const ad = new Date(a.referred_at || 0).getTime();
        const bd = new Date(b.referred_at || 0).getTime();
        return bd - ad;
      });
  }, [referrals]);

  const visibleRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return sorted.filter((row) => {
      if (quickFilter === 'critical' && normalizeRiskLevel(row.latest_risk_level) !== 'critical') return false;
      if (quickFilter === 'elevated' && normalizeRiskLevel(row.latest_risk_level) !== 'elevated') return false;
      if (quickFilter === 'accepted' && row.status !== 'accepted') return false;
      if (riskFilter !== 'all' && normalizeRiskLevel(row.latest_risk_level) !== riskFilter) return false;
      if (!query) return true;
      const haystack = [
        row.patient_name,
        row.village,
        row.patient_age,
        row.weeks_pregnant,
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [sorted, searchText, riskFilter, quickFilter]);

  const stats = useMemo(() => {
    const critical = sorted.filter((p) => normalizeRiskLevel(p.latest_risk_level) === 'critical').length;
    const highRisk = sorted.filter((p) => normalizeRiskLevel(p.latest_risk_level) === 'elevated').length;
    return {
      total: sorted.length,
      critical,
      high: highRisk,
      consults: sorted.filter((p) => p.status === 'accepted').length,
    };
  }, [sorted]);

  const alertPatients = useMemo(
    () => visibleRows.filter((p) => {
      const level = normalizeRiskLevel(p.latest_risk_level);
      return level === 'critical' || level === 'elevated';
    }),
    [visibleRows],
  );

  const riskCounts = useMemo(() => {
    const counts = { critical: 0, elevated: 0, monitor: 0, safe: 0 };
    for (const row of visibleRows) {
      const level = normalizeRiskLevel(row.latest_risk_level);
      if (level in counts) counts[level] += 1;
    }
    return counts;
  }, [visibleRows]);

  const totalRiskRows = Math.max(visibleRows.length, 1);

  return (
    <div className="min-h-screen bg-cream">
      <TopBar />
      <Toast toast={toast} />

      <AnimatePresence>
        {selectedReferralId && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/20 z-40 backdrop-blur-sm"
              onClick={() => {
                setSelectedReferralId(null);
                setSelectedDetail(null);
              }}
            />
            <PatientDetailPanel
              detail={selectedDetail}
              loading={loadingDetail}
              onClose={() => {
                setSelectedReferralId(null);
                setSelectedDetail(null);
              }}
              lang={lang}
              onUpdateStatus={updateStatus}
              onSaveNotes={saveNotes}
              onSaveLabs={saveLabs}
              onQuickRefer={quickRefer}
              actionLoading={actionLoading}
            />
          </>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-5 py-6 space-y-7">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 flex items-start justify-between gap-3"
        >
          <div>
            <h1 className="text-3xl font-semibold text-charcoal tracking-tight">{t('doctorGreeting')} 🩺</h1>
            <p className="text-sm text-muted mt-1">
              {new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-xl border border-blush bg-ivory text-muted hover:text-charcoal transition-colors flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                fetchReferrals();
                if (selectedReferralId) openReferral(selectedReferralId);
              }}
              className="h-10 px-3 rounded-xl border border-blush bg-ivory text-muted hover:text-charcoal transition-colors flex items-center gap-2"
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={15} />
              <span className="text-xs font-semibold">{lang === 'hi' ? 'रीफ्रेश' : 'Refresh'}</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'all', label: t('totalUnderCare'), value: stats.total, icon: Users, color: 'bg-saffron/10 text-saffron', topBorder: 'border-t-saffron' },
            { key: 'critical', label: t('criticalAlerts'), value: stats.critical, icon: AlertTriangle, color: 'bg-rose-critical/10 text-rose-critical', topBorder: 'border-t-rose-critical' },
            { key: 'elevated', label: t('highRisk'), value: stats.high, icon: Activity, color: 'bg-terracotta/10 text-terracotta', topBorder: 'border-t-terracotta' },
            { key: 'accepted', label: t('consultationsToday'), value: stats.consults, icon: Calendar, color: 'bg-sage/10 text-sage', topBorder: 'border-t-sage' },
          ].map(({ key, label, value, icon: Icon, color, topBorder }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 120 }}
              onClick={() => setQuickFilter(key)}
              className={`bg-ivory rounded-2xl px-4 py-4 shadow-soft border transition-colors cursor-pointer border-t-[3px] ${topBorder} ${quickFilter === key ? 'border-saffron/60 bg-saffron/5' : 'border-blush hover:border-saffron/40'}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-3xl font-bold text-charcoal tracking-tight">{loadingReferrals ? '…' : value}</p>
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon size={15} />
                </div>
              </div>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <section className="bg-ivory rounded-2xl border border-blush shadow-soft p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex-1">
              <label className="block text-xs text-muted font-semibold mb-1">
                {lang === 'hi' ? 'मरीज़ खोजें' : 'Search Patients'}
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={lang === 'hi' ? 'नाम, गांव, उम्र...' : 'Name, village, age...'}
                className="w-full h-10 px-3 rounded-lg border border-blush bg-cream text-sm text-charcoal focus:outline-none focus:border-saffron"
              />
            </div>
            <div>
              <p className="text-xs text-muted font-semibold mb-1">{lang === 'hi' ? 'जोखिम फ़िल्टर' : 'Risk Filter'}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: lang === 'hi' ? 'सभी' : 'All' },
                  { key: 'critical', label: lang === 'hi' ? 'गंभीर' : 'Critical' },
                  { key: 'elevated', label: lang === 'hi' ? 'उच्च जोखिम' : 'High Risk' },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setRiskFilter(pill.key)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-colors ${riskFilter === pill.key
                      ? 'bg-saffron/10 text-saffron border-saffron/30'
                      : 'bg-cream text-muted border-blush hover:text-charcoal'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            {lang === 'hi'
              ? `सूची में ${visibleRows.length} मरीज़ दिख रहे हैं`
              : `${visibleRows.length} patients in current view`}
          </p>
          {quickFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setQuickFilter('all')}
              className="mt-2 text-xs text-saffron font-semibold hover:text-terracotta transition-colors"
            >
              {lang === 'hi' ? 'क्विक फ़िल्टर हटाएं' : 'Clear quick filter'}
            </button>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-[14px] items-start">
          <div className="bg-ivory rounded-2xl border border-blush shadow-soft overflow-hidden">
            <div className="px-4 py-3 border-b border-blush flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-critical" />
              <h2 className="text-xl font-semibold text-charcoal tracking-tight">
                {lang === 'hi' ? 'तत्काल ध्यान दें' : 'Critical Alerts'}
              </h2>
              <span className="ml-auto bg-rose-critical/10 text-rose-critical text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-critical/20">
                {alertPatients.length}
              </span>
            </div>
            <div>
              {alertPatients.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted">
                  {lang === 'hi' ? 'कोई गंभीर अलर्ट नहीं' : 'No critical alerts in current view'}
                </div>
              )}
              {alertPatients.slice(0, 6).map((p, idx) => {
                const level = normalizeRiskLevel(p.latest_risk_level);
                const isCritical = level === 'critical';
                return (
                  <motion.div key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`px-4 py-3 ${idx < Math.min(alertPatients.length, 6) - 1 ? 'border-b border-blush' : ''} cursor-pointer hover:bg-cream/60 transition-colors`}
                    onClick={() => openReferral(p.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-charcoal tracking-tight">{p.patient_name || '—'}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${isCritical ? 'bg-rose-critical/10 text-rose-critical border-rose-critical/30' : 'bg-terracotta/10 text-terracotta border-terracotta/30'}`}>
                            {isCritical ? (lang === 'hi' ? 'गंभीर' : 'CRITICAL') : (lang === 'hi' ? 'उच्च जोखिम' : 'HIGH RISK')}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {p.patient_age || '—'} yrs · {p.weeks_pregnant ? `Wk ${p.weeks_pregnant}` : '—'} · BP {formatBP(p)}
                        </p>
                      </div>
                      <RiskPill level={level} lang={lang} />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] px-2 py-1 rounded-full border border-blush bg-cream text-charcoal">SBP {p.latest_bp_sys ?? '—'}</span>
                      <span className="text-[11px] px-2 py-1 rounded-full border border-blush bg-cream text-charcoal">DBP {p.latest_bp_dia ?? '—'}</span>
                    </div>

                    <div className={`mt-2 rounded-lg px-3 py-2 border-l-4 ${isCritical ? 'border-l-rose-critical bg-rose-critical/5' : 'border-l-terracotta bg-terracotta/5'}`}>
                      <p className={`text-xs font-semibold ${isCritical ? 'text-rose-critical' : 'text-terracotta'}`}>
                        {lang === 'hi' ? 'तुरंत समीक्षा करें और प्रबंधन शुरू करें' : 'Review immediately and begin management'}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="space-y-[14px]">
            <div className="bg-ivory rounded-2xl border border-blush shadow-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-charcoal">{lang === 'hi' ? 'जोखिम वितरण' : 'Risk Distribution'}</h3>
                <Stethoscope size={14} className="text-saffron" />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { key: 'critical', label: lang === 'hi' ? 'गंभीर' : 'Critical', color: 'bg-rose-critical' },
                  { key: 'elevated', label: lang === 'hi' ? 'उच्च जोखिम' : 'High Risk', color: 'bg-terracotta' },
                  { key: 'monitor', label: lang === 'hi' ? 'निगरानी' : 'Monitor', color: 'bg-saffron' },
                  { key: 'safe', label: lang === 'hi' ? 'सुरक्षित' : 'Safe', color: 'bg-sage' },
                ].map((item) => (
                  <div key={item.key} className="bg-cream rounded-lg border border-blush px-2.5 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-muted">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-charcoal">{riskCounts[item.key]}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { key: 'critical', label: lang === 'hi' ? 'गंभीर' : 'Critical', color: 'bg-rose-critical' },
                  { key: 'elevated', label: lang === 'hi' ? 'उच्च जोखिम' : 'High Risk', color: 'bg-terracotta' },
                  { key: 'monitor', label: lang === 'hi' ? 'निगरानी' : 'Monitor', color: 'bg-saffron' },
                  { key: 'safe', label: lang === 'hi' ? 'सुरक्षित' : 'Safe', color: 'bg-sage' },
                ].map((item) => {
                  const width = `${Math.max(4, (riskCounts[item.key] / totalRiskRows) * 100)}%`;
                  return (
                    <div key={`bar-${item.key}`}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted">{item.label}</span>
                        <span className="font-semibold text-charcoal">{riskCounts[item.key]}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-cream border border-blush overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-ivory rounded-2xl border border-blush shadow-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-charcoal">{lang === 'hi' ? 'मॉडल वैलिडेशन' : 'Model Validation'}</h3>
                <ShieldCheck size={14} className="text-sage" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-cream rounded-lg p-3 border border-blush text-center">
                  <p className="text-[11px] text-muted">Accuracy</p>
                  <p className="text-base font-semibold text-charcoal">98.1%</p>
                </div>
                <div className="bg-cream rounded-lg p-3 border border-blush text-center">
                  <p className="text-[11px] text-muted">Validation</p>
                  <p className="text-base font-semibold text-charcoal">104</p>
                </div>
                <div className="bg-cream rounded-lg p-3 border border-blush text-center">
                  <p className="text-[11px] text-muted">Recall</p>
                  <p className="text-base font-semibold text-charcoal">100%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope size={15} className="text-saffron" />
            <h2 className="text-xl font-semibold text-charcoal tracking-tight">
              {lang === 'hi' ? 'सभी मरीज़' : 'All Patients'}
            </h2>
            <span className="ml-2 bg-saffron/10 text-saffron text-xs font-bold px-2 py-0.5 rounded-full border border-saffron/20">
              {visibleRows.length}
            </span>
          </div>

          <div className="bg-ivory rounded-2xl border border-blush overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-blush bg-cream sticky top-0 z-[1]">
                    {['patient', 'age', 'week', 'bp', 'risk', 'bpTrend', 'date', 'action'].map((col) => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                        {col === 'bpTrend'
                          ? (lang === 'hi' ? 'BP ट्रेंड' : 'BP Trend')
                          : t(`tableHeaders.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patientsError && (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-sm text-rose-critical">{patientsError}</td>
                    </tr>
                  )}
                  {!patientsError && !loadingReferrals && visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <p className="text-sm font-semibold text-charcoal">
                          {lang === 'hi' ? 'कोई मरीज़ नहीं मिला' : 'No patients found'}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {lang === 'hi'
                            ? 'फ़िल्टर या खोज शब्द बदलकर देखें।'
                            : 'Try changing your filters or search term.'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {!patientsError && loadingReferrals && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                        {lang === 'hi' ? 'मरीज़ लोड हो रहे हैं...' : 'Loading patients...'}
                      </td>
                    </tr>
                  )}
                  {!patientsError && !loadingReferrals && visibleRows.map((p, i) => {
                    const week = p?.weeks_pregnant ? `Wk ${p.weeks_pregnant}` : '—';
                    const level = normalizeRiskLevel(p.latest_risk_level);
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => openReferral(p.id)}
                        className={`border-b border-blush/60 cursor-pointer hover:bg-blush/30 transition-colors ${selectedReferralId === p.id ? 'bg-blush/40' : (i % 2 === 0 ? '' : 'bg-cream/50')}`}
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-sm text-charcoal font-semibold">
                            <span className={`w-2 h-2 rounded-full ${RISK_DOT_COLORS[level] || RISK_DOT_COLORS.unknown}`} />
                            {p.patient_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{p.patient_age ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted">{week}</td>
                        <td className="px-4 py-3 text-sm font-mono text-charcoal">{formatBP(p)}</td>
                        <td className="px-4 py-3"><RiskPill level={level} lang={lang} /></td>
                        <td className="px-4 py-3"><span className="text-xs text-muted">{p.visit_count > 1 ? `${p.visit_count} visits` : '—'}</span></td>
                        <td className="px-4 py-3 text-xs text-muted">{formatDate(p.last_visit_date || p.referred_at)}</td>
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

        <div className="h-8" />
      </div>
    </div>
  );
}
