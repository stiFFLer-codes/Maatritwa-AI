import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Heart, Leaf, Droplets, Sun, Apple } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import TopBar from '../../components/shared/TopBar';
import { chatWithAmma } from '../../services/sarvamChat';

// ── Demo patient state ─────────────────────────────────────────────────────────
// In production, this would be fetched from /mother/profile or authenticated endpoint
const DEFAULT_PATIENT = {
  id: 'MOT-001',
  name: 'Priya Sharma',
  age: 28,
  phone: '9876543210',
  gestationalWeeks: 24,
  riskLevel: 'low',
  systolicBP: 118,
  diastolicBP: 76,
  hemoglobin: 11.8,
  weight: 65,
  height: 162,
};

// ── Pregnancy ring SVG ────────────────────────────────────────────────────────
function PregnancyRing({ week = 24, total = 40, lang = 'hi' }) {
  const R  = 80;
  const SW = 10;
  const r  = R - SW / 2;
  const C  = 2 * Math.PI * r;
  const progress  = week / total;
  const remaining = total - week;

  const SIZE_BY_WEEK = {
    8:  { en: ['Cherry 🍒', '1.6 cm'],         hi: ['चेरी 🍒', '1.6 cm'] },
    10: { en: ['Kumquat 🍊', '3.1 cm'],        hi: ['कुमकुआट 🍊', '3.1 cm'] },
    12: { en: ['Lime 🍋', '5.4 cm'],           hi: ['नींबू 🍋', '5.4 cm'] },
    14: { en: ['Lemon 🍋', '8.7 cm'],          hi: ['नींबू 🍋', '8.7 cm'] },
    16: { en: ['Avocado 🥑', '11.6 cm'],       hi: ['एवोकाडो 🥑', '11.6 cm'] },
    18: { en: ['Sweet Potato 🍠', '14.2 cm'],  hi: ['शकरकंद 🍠', '14.2 cm'] },
    20: { en: ['Mango 🥭', '16.4 cm'],         hi: ['आम 🥭', '16.4 cm'] },
    22: { en: ['Papaya 🥭', '19 cm'],          hi: ['पपीता 🥭', '19 cm'] },
    24: { en: ['Eggplant 🍆', '21 cm'],        hi: ['बैंगन 🍆', '21 cm'] },
    26: { en: ['Cucumber 🥒', '23 cm'],        hi: ['खीरा 🥒', '23 cm'] },
    28: { en: ['Coconut 🥥', '25 cm'],         hi: ['नारियल 🥥', '25 cm'] },
    30: { en: ['Cabbage 🥬', '27 cm'],         hi: ['पत्ता गोभी 🥬', '27 cm'] },
    32: { en: ['Squash 🎃', '28.9 cm'],        hi: ['कद्दू 🎃', '28.9 cm'] },
    34: { en: ['Cantaloupe 🍈', '30 cm'],      hi: ['खरबूजा 🍈', '30 cm'] },
    36: { en: ['Honeydew 🍈', '33 cm'],        hi: ['हनीड्यू 🍈', '33 cm'] },
    38: { en: ['Pumpkin 🎃', '36 cm'],         hi: ['कद्दू 🎃', '36 cm'] },
    40: { en: ['Watermelon 🍉', '38 cm'],      hi: ['तरबूज 🍉', '38 cm'] },
  };
  const closest = Object.keys(SIZE_BY_WEEK).reduce((a, b) =>
    Math.abs(b - week) < Math.abs(a - week) ? b : a
  );
  const sizeData = SIZE_BY_WEEK[closest][lang] || SIZE_BY_WEEK[closest].en;
  const [name, size] = sizeData;
  const emoji = name.split(' ')[0];
  const fruitName = name.split(' ').slice(1).join(' ');

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          <circle cx="90" cy="90" r={r} fill="none" stroke="#F2DDD0" strokeWidth={SW} />
          <motion.circle
            cx="90" cy="90" r={r}
            fill="none"
            stroke="#E8863A"
            strokeWidth={SW}
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - progress * C }}
            transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.4 }}
          />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * 2 * Math.PI;
            const x = 90 + (r + 14) * Math.cos(a);
            const y = 90 + (r + 14) * Math.sin(a);
            const wk = Math.round((i / 8) * total);
            return (
              <circle key={i} cx={x} cy={y} r="3"
                fill={wk <= week ? '#E8863A' : '#F2DDD0'} />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl font-bold text-charcoal">{week}</span>
          <span className="text-xs text-muted font-medium">
            {lang === 'hi' ? 'सप्ताह' : 'weeks'}
          </span>
          <span className="text-xs text-muted mt-0.5">
            {lang === 'hi' ? `${remaining} और बाकी` : `${remaining} to go`}
          </span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-3 text-center"
      >
        <p className="text-2xl mb-1">{emoji}</p>
        <p className="text-xs text-muted">
          {lang === 'hi'
            ? <>आपका बच्चा अभी एक <strong>{fruitName}</strong> के आकार का है — {size}</>
            : <>Your baby is the size of a <strong>{fruitName}</strong> · {size}</>
          }
        </p>
      </motion.div>
    </div>
  );
}

// ── Amma avatar ───────────────────────────────────────────────────────────────
function AmmaAvatar({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" fill="#F2DDD0" />
      <circle cx="30" cy="27" r="16" fill="#D4917A" />
      <path d="M14,27 C14,17 21,10 30,10 C39,10 46,17 46,27 C43,21 37,17 30,17 C23,17 17,21 14,27 Z" fill="#2D2A26" opacity="0.8" />
      <ellipse cx="30" cy="12" rx="9" ry="6" fill="#2D2A26" opacity="0.75" />
      <circle cx="30" cy="8" r="4" fill="#E8863A" opacity="0.85" />
      <circle cx="24" cy="25" r="2.5" fill="#2D2A26" opacity="0.7" />
      <circle cx="36" cy="25" r="2.5" fill="#2D2A26" opacity="0.7" />
      <circle cx="25" cy="24" r="0.8" fill="white" />
      <circle cx="37" cy="24" r="0.8" fill="white" />
      <path d="M23,31 Q30,36 37,31" stroke="#2D2A26" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <circle cx="30" cy="19" r="1.8" fill="#C75B39" />
      <path d="M12,58 C12,46 20,42 30,42 C40,42 48,46 48,58" fill="#7BA68A" opacity="0.7" />
    </svg>
  );
}

// ── Quick reply data ──────────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { labelHi: 'क्या यह सामान्य है?', labelEn: 'Is this normal?' },
  { labelHi: 'आज क्या खाऊँ?',       labelEn: 'What to eat today?' },
  { labelHi: 'मुझे चिंता हो रही है', labelEn: "I'm worried" },
  { labelHi: 'अगली विज़िट कब?',     labelEn: 'When is my next visit?' },
  { labelHi: 'बच्चा कैसे बढ़ रहा है?', labelEn: 'How is my baby growing?' },
];

// ── Weekly tips ───────────────────────────────────────────────────────────────
const TIPS = [
  { icon: Droplets, iconColor: 'text-blue-400', bg: 'bg-blue-50', border: 'border-blue-100',
    hi: 'रोज़ 8-10 गिलास पानी पिएं। पानी आपके बच्चे के लिए बहुत ज़रूरी है।',
    en: 'Drink 8–10 glasses of water daily. Hydration is essential for your baby.' },
  { icon: Apple, iconColor: 'text-terracotta', bg: 'bg-terracotta/5', border: 'border-terracotta/15',
    hi: 'आयरन से भरपूर खाना खाएं — पालक, दाल, चुकंदर और खजूर। आयरन की गोली साथ ज़रूर लें।',
    en: 'Eat iron-rich foods — spinach, lentils, beetroot, dates. Take your iron tablet daily.' },
  { icon: Sun, iconColor: 'text-saffron', bg: 'bg-saffron/5', border: 'border-saffron/15',
    hi: 'हल्की धूप में 15-20 मिनट रोज़ बैठें। विटामिन D आपके और बच्चे की हड्डियों के लिए ज़रूरी है।',
    en: 'Sit in gentle sunlight for 15–20 minutes daily. Vitamin D is essential for your and your baby\'s bones.' },
];

const RISK_MESSAGES = {
  low:      { hi: 'आपकी सेहत अच्छी है',                  en: 'Your health is good. Everything looks normal.',    color: 'text-sage',          bg: 'bg-sage/10',          border: 'border-sage/20' },
  moderate: { hi: 'थोड़ी सावधानी ज़रूरी है — जल्द जाँच करवाएं।', en: 'Some monitoring needed. Schedule a checkup soon.', color: 'text-amber-alert',   bg: 'bg-amber-alert/10',   border: 'border-amber-alert/20' },
  high:     { hi: 'ध्यान ज़रूरी है — जल्द डॉक्टर से मिलें।',   en: 'Attention needed. See a doctor soon.',             color: 'text-terracotta',    bg: 'bg-terracotta/10',    border: 'border-terracotta/20' },
  critical: { hi: 'आज डॉक्टर से मिलें — देरी न करें।',         en: 'See a doctor today. Do not delay.',                color: 'text-rose-critical', bg: 'bg-rose-critical/10', border: 'border-rose-critical/20' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MotherDashboard() {
  const { lang } = useLanguage();

  // Chat state
  const [messages, setMessages] = useState([
    { sender: 'amma', text: 'नमस्ते बेटी! 🙏 मैं अम्मा हूँ, तुम्हारी गर्भावस्था साथी। कोई भी सवाल पूछो — मैं हमेशा यहाँ हूँ।', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Web Speech API setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async (text) => {
    const userMsg = text || inputText;
    if (!userMsg.trim() || isLoading) return;

    const newUserMsg = { sender: 'user', text: userMsg, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    const response = await chatWithAmma(userMsg, [...messages, newUserMsg]);

    // Short delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 800));

    setMessages(prev => [...prev, {
      sender: 'amma',
      text: response.message,
      isEmergency: response.isEmergency,
      citations: response.citations || [],
      timestamp: new Date(),
    }]);
    setIsLoading(false);
  };

  const risk = patient.riskLevel || 'low';
  const riskMsg = RISK_MESSAGES[risk];

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-blush/40 to-saffron/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-sage/10 to-blush/20 blur-3xl" />
      </div>

      <TopBar />

      {/* Two-column desktop layout */}
      <div className="relative max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left Column: Progress + Health + Tips ────────────────────────── */}
          <div className="flex-1 lg:w-[60%] space-y-6">

            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="font-serif text-3xl text-charcoal">
                {lang === 'hi' ? 'नमस्ते बेटी 🙏' : 'Hello, dear 🙏'}
              </h1>
              <p className="text-sm text-muted mt-1">{patient.name}</p>
            </motion.div>

            {/* Pregnancy Progress */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
              className="bg-ivory rounded-3xl p-7 shadow-warm border border-blush"
            >
              <h2 className="font-serif text-xl text-charcoal text-center mb-6">
                {lang === 'hi' ? 'गर्भावस्था प्रगति' : 'Pregnancy Progress'}
              </h2>
              <PregnancyRing week={patient.gestationalWeeks} total={40} lang={lang} />
            </motion.div>

            {/* Health Summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`rounded-3xl p-5 border-2 border-l-[6px] ${riskMsg.bg} ${riskMsg.border}`}
            >
              <h2 className="font-serif text-xl text-charcoal mb-3">
                {lang === 'hi' ? 'स्वास्थ्य सारांश' : 'Health Summary'}
              </h2>
              <p className={`text-lg font-semibold ${riskMsg.color} mb-4 flex items-center gap-2`}>
                <Heart size={18} fill="currentColor" className="flex-shrink-0" />
                {lang === 'hi' ? riskMsg.hi : riskMsg.en}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: lang === 'hi' ? 'BP' : 'Blood Pressure', value: `${patient.systolicBP}/${patient.diastolicBP} mmHg` },
                  { label: lang === 'hi' ? 'हीमोग्लोबिन' : 'Haemoglobin', value: patient.hemoglobin ? `${patient.hemoglobin} g/dL` : '—' },
                  {
                    label: lang === 'hi' ? 'अंतिम विज़िट' : 'Last Visit',
                    value: patient.lastVisitDate?.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }) ?? '—',
                  },
                  { label: lang === 'hi' ? 'अगली विज़िट' : 'Next Visit', value: lang === 'hi' ? '7 दिन बाद' : 'In 7 days' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/60 rounded-xl p-3 border border-white">
                    <p className="text-xs text-muted mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-charcoal">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Weekly Tips */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Leaf size={15} className="text-sage" />
                <h2 className="font-serif text-xl text-charcoal">
                  {lang === 'hi' ? 'इस हफ्ते का सुझाव' : "This Week's Tips"}
                </h2>
              </div>
              <div className="space-y-3">
                {TIPS.map(({ icon: Icon, iconColor, bg, border, hi, en }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`${bg} ${border} border rounded-2xl p-4 flex items-start gap-3`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${bg} ${border} border flex items-center justify-center flex-shrink-0`}>
                      <Icon size={17} className={iconColor} />
                    </div>
                    <p className="text-sm text-charcoal leading-relaxed">
                      {lang === 'hi' ? hi : en}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Heart note — only on mobile (hidden on desktop, chat takes right col) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center py-4 lg:block"
            >
              <Heart size={18} className="text-terracotta mx-auto mb-2" fill="currentColor" />
              <p className="text-xs text-muted">
                {lang === 'hi'
                  ? 'मातृत्व AI — हर माँ के लिए, प्यार से बनाया गया'
                  : 'मातृत्व AI — Built with care for every mother'}
              </p>
            </motion.div>
          </div>

          {/* ── Right Column: Amma Chat (sticky on desktop) ──────────────────── */}
          <div className="lg:w-[40%] lg:min-w-[360px]">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-ivory rounded-3xl shadow-warm border border-blush overflow-hidden lg:sticky lg:top-6 flex flex-col"
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-blush/30 border-b border-blush">
                <AmmaAvatar size={42} />
                <div>
                  <p className="font-serif text-base text-charcoal font-semibold">
                    {lang === 'hi' ? 'अम्मा' : 'Amma'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                    <p className="text-xs text-muted">
                      {lang === 'hi' ? 'आपकी गर्भावस्था साथी' : 'Your pregnancy companion'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-cream/50">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                    >
                      {msg.sender === 'amma' && (
                        <div className="flex-shrink-0 mt-auto"><AmmaAvatar size={28} /></div>
                      )}
                      <div>
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                            msg.isEmergency
                              ? 'bg-rose-critical/15 text-charcoal border-2 border-rose-critical/40 animate-pulse-border rounded-tl-sm'
                              : msg.sender === 'amma'
                                ? 'bg-ivory text-charcoal border border-blush rounded-tl-sm'
                                : 'bg-saffron/15 text-charcoal border border-saffron/20 rounded-tr-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-1 ml-1 flex flex-wrap gap-1">
                            {msg.citations.map((c, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sage/10 text-sage border border-sage/20">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {c.source}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2 px-1 py-2">
                    <div className="flex-shrink-0"><AmmaAvatar size={28} /></div>
                    <div className="flex items-center gap-2 bg-ivory px-4 py-2.5 rounded-2xl rounded-tl-sm border border-blush">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-saffron rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted">
                        {lang === 'hi' ? 'अम्मा टाइप कर रही हैं...' : 'Amma is typing...'}
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick replies */}
              <div className="px-4 py-3 flex gap-2 overflow-x-auto border-t border-blush/60 scrollbar-none">
                {QUICK_REPLIES.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(lang === 'hi' ? qr.labelHi : qr.labelEn)}
                    disabled={isLoading}
                    className="flex-shrink-0 text-xs font-medium px-3.5 py-2 bg-blush text-charcoal rounded-full hover:bg-saffron hover:text-white transition-all duration-200 border border-blush disabled:opacity-50"
                  >
                    {lang === 'hi' ? qr.labelHi : qr.labelEn}
                  </button>
                ))}
              </div>

              {/* Input area */}
              <div className="px-4 py-3 bg-ivory border-t border-blush flex gap-2 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={lang === 'hi' ? 'अम्मा से पूछें…' : 'Ask Amma…'}
                  disabled={isLoading}
                  className="flex-1 h-11 px-4 rounded-full border-2 border-blush bg-cream text-sm text-charcoal focus:border-saffron focus:outline-none transition-colors disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputText.trim()}
                  className="w-11 h-11 rounded-full bg-saffron flex items-center justify-center hover:bg-terracotta transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  <Send size={16} className="text-white" />
                </button>
                <button
                  onClick={toggleListening}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    isListening
                      ? 'bg-terracotta text-white animate-pulse'
                      : 'bg-blush text-terracotta hover:bg-terracotta/20'
                  }`}
                >
                  <Mic size={16} />
                </button>
              </div>

              {/* Powered by badge */}
              <div className="px-4 py-2 text-center border-t border-blush/40">
                <p className="text-[10px] text-muted/60">Powered by Sarvam AI 🇮🇳</p>
              </div>
            </motion.div>
          </div>

        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}
