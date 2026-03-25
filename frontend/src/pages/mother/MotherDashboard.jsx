import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Heart, Leaf, Droplets, Sun, Apple } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import TopBar from '../../components/shared/TopBar';
import { demoMotherPatient } from '../../data/mockPatients';

// ── Demo patient ──────────────────────────────────────────────────────────────
const PATIENT = demoMotherPatient; // Priya Sharma, week 24, low risk

// ── Pregnancy ring SVG ────────────────────────────────────────────────────────
function PregnancyRing({ week = 24, total = 40 }) {
  const R  = 80;
  const SW = 10;
  const r  = R - SW / 2;
  const C  = 2 * Math.PI * r;
  const progress  = week / total;
  const remaining = total - week;

  // Fun size comparisons
  const SIZE_BY_WEEK = {
    8: ['Cherry 🍒', '1.6 cm'], 10: ['Kumquat 🍊', '3.1 cm'], 12: ['Lime 🍋', '5.4 cm'],
    14: ['Lemon 🍋', '8.7 cm'], 16: ['Avocado 🥑', '11.6 cm'], 18: ['Sweet Potato 🍠', '14.2 cm'],
    20: ['Mango 🥭', '16.4 cm'], 22: ['Papaya 🥭', '19 cm'], 24: ['Eggplant 🍆', '21 cm'],
    26: ['Cucumber 🥒', '23 cm'], 28: ['Coconut 🥥', '25 cm'], 30: ['Cabbage 🥬', '27 cm'],
    32: ['Squash 🎃', '28.9 cm'], 34: ['Cantaloupe 🍈', '30 cm'], 36: ['Honeydew 🍈', '33 cm'],
    38: ['Pumpkin 🎃', '36 cm'], 40: ['Watermelon 🍉', '38 cm'],
  };
  const closest = Object.keys(SIZE_BY_WEEK).reduce((a, b) =>
    Math.abs(b - week) < Math.abs(a - week) ? b : a
  );
  const [emoji, size] = SIZE_BY_WEEK[closest];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="90" cy="90" r={r} fill="none" stroke="#F2DDD0" strokeWidth={SW} />
          {/* Progress */}
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
          {/* Completed weeks dots */}
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
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-4xl font-bold text-charcoal">{week}</span>
          <span className="text-xs text-muted font-medium">weeks</span>
          <span className="text-xs text-muted mt-0.5">{remaining} to go</span>
        </div>
      </div>
      {/* Size comparison */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="mt-3 text-center"
      >
        <p className="text-2xl mb-1">{emoji.split(' ')[0]}</p>
        <p className="text-xs text-muted">
          Your baby is the size of an <strong>{emoji.split(' ').slice(1).join(' ')}</strong> · {size}
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
      {/* Face */}
      <circle cx="30" cy="27" r="16" fill="#D4917A" />
      {/* Hair */}
      <path d="M14,27 C14,17 21,10 30,10 C39,10 46,17 46,27 C43,21 37,17 30,17 C23,17 17,21 14,27 Z" fill="#2D2A26" opacity="0.8" />
      {/* Bun */}
      <ellipse cx="30" cy="12" rx="9" ry="6" fill="#2D2A26" opacity="0.75" />
      <circle cx="30" cy="8" r="4" fill="#E8863A" opacity="0.85" />
      {/* Eyes */}
      <circle cx="24" cy="25" r="2.5" fill="#2D2A26" opacity="0.7" />
      <circle cx="36" cy="25" r="2.5" fill="#2D2A26" opacity="0.7" />
      <circle cx="25" cy="24" r="0.8" fill="white" />
      <circle cx="37" cy="24" r="0.8" fill="white" />
      {/* Smile */}
      <path d="M23,31 Q30,36 37,31" stroke="#2D2A26" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      {/* Bindi */}
      <circle cx="30" cy="19" r="1.8" fill="#C75B39" />
      {/* Body */}
      <path d="M12,58 C12,46 20,42 30,42 C40,42 48,46 48,58" fill="#7BA68A" opacity="0.7" />
    </svg>
  );
}

// ── Chat messages ─────────────────────────────────────────────────────────────
const AMMA_RESPONSES = {
  normal: {
    hi: 'हाँ बेटी, गर्भावस्था में हल्की थकान, पीठ दर्द और सूजन सामान्य है। लेकिन अगर तेज़ सिरदर्द या आँखों में धुंधलापन हो तो तुरंत ASHA दीदी को बताएं। 💛',
    en: 'Yes dear, mild fatigue, back pain, and swelling are normal in pregnancy. But if you have severe headache or blurred vision, contact your ASHA worker right away. 💛',
  },
  eat: {
    hi: 'आज के लिए: सुबह दलिया + दूध 🥣, दोपहर दाल-चावल + हरी सब्जी 🍛, शाम को फल 🍎। खूब पानी पिएं और आयरन की गोली भूलें नहीं। 🌸',
    en: 'Today: Morning oatmeal + milk 🥣, lunch dal-rice + green vegetable 🍛, evening fruit 🍎. Drink plenty of water and don\'t forget your iron tablet. 🌸',
  },
  worried: {
    hi: 'चिंता मत करो बेटी। आपकी सेहत का पूरा ध्यान रखा जा रहा है। ASHA दीदी और डॉक्टर दोनों आपके साथ हैं। अगर कोई भी परेशानी हो तो बेझिझक बताएं। आप अकेली नहीं हैं। 🤗',
    en: 'Don\'t worry dear. Your health is being taken good care of. Your ASHA worker and doctor are both with you. You are not alone — feel free to share any concern. 🤗',
  },
  visit: {
    hi: 'आपकी अगली विज़िट 7 दिनों बाद है। ASHA दीदी आपके घर आएंगी। तब तक हर दिन BP नोट करें और ज़्यादा नमक न खाएं। दूध और हरी सब्जी ज़रूर लें। 📅',
    en: 'Your next visit is in 7 days. Your ASHA worker will come to your home. Until then, note your BP daily and avoid too much salt. Make sure to have milk and green vegetables. 📅',
  },
};

const INITIAL_MESSAGES = [
  { id: 1, sender: 'amma', hi: 'नमस्ते बेटी! 🙏 मैं अम्मा हूँ — आपकी गर्भावस्था साथी। कोई भी सवाल पूछें, मैं यहाँ हूँ।', en: 'Namaste beti! 🙏 I am Amma — your pregnancy companion. Ask me anything, I am here for you.' },
  { id: 2, sender: 'amma', hi: 'आपकी पिछली जाँच अच्छी रही। BP सामान्य है और आप 24वें सप्ताह में हैं। बढ़िया प्रगति! 💚', en: 'Your last checkup went well. BP is normal and you are in week 24. Wonderful progress! 💚' },
];

const QUICK_REPLIES_DATA = [
  { key: 'normal',  labelHi: 'क्या यह सामान्य है?', labelEn: 'Is this normal?',        response: AMMA_RESPONSES.normal  },
  { key: 'eat',     labelHi: 'आज क्या खाऊँ?',        labelEn: 'What to eat today?',     response: AMMA_RESPONSES.eat     },
  { key: 'worried', labelHi: 'मुझे चिंता हो रही है', labelEn: 'I\'m worried',            response: AMMA_RESPONSES.worried },
  { key: 'visit',   labelHi: 'अगली विज़िट कब?',      labelEn: 'When is my next visit?', response: AMMA_RESPONSES.visit   },
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
  low:      { hi: 'आपकी सेहत अच्छी है 💚 सब कुछ सामान्य है।', en: 'Your health is good 💚 Everything looks normal.',              color: 'text-sage',        bg: 'bg-sage/10',        border: 'border-sage/20'        },
  moderate: { hi: 'थोड़ी सावधानी ज़रूरी है 💛 जल्द जाँच करवाएं।', en: 'Some monitoring needed 💛 Schedule a checkup soon.',          color: 'text-amber-alert', bg: 'bg-amber-alert/10', border: 'border-amber-alert/20' },
  high:     { hi: 'ध्यान ज़रूरी है 🟠 जल्द डॉक्टर से मिलें।',   en: 'Attention needed 🟠 See a doctor soon.',                     color: 'text-terracotta',  bg: 'bg-terracotta/10',  border: 'border-terracotta/20'  },
  critical: { hi: 'आज डॉक्टर से मिलें 🔴 देरी न करें।',          en: 'See a doctor today 🔴 Do not delay.',                        color: 'text-rose-critical', bg: 'bg-rose-critical/10', border: 'border-rose-critical/20' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function MotherDashboard() {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [usedReplies, setUsedReplies] = useState(new Set());
  const messagesEndRef = useRef(null);
  let msgId = useRef(10);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (sender, content) => {
    const id = ++msgId.current;
    setMessages(prev => [...prev, { id, sender, ...(typeof content === 'string' ? { hi: content, en: content } : content) }]);
  };

  const handleQuickReply = (qr) => {
    setUsedReplies(prev => new Set([...prev, qr.key]));
    addMessage('user', { hi: qr.labelHi, en: qr.labelEn });
    setTimeout(() => addMessage('amma', qr.response), 700);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    addMessage('user', { hi: inputText, en: inputText });
    setInputText('');
    setTimeout(() => addMessage('amma', {
      hi: 'आपका सवाल समझ आया। आपकी ASHA दीदी आपसे जल्द संपर्क करेंगी। तब तक पानी पीती रहें और आराम करें। 🙏',
      en: 'I understand your concern. Your ASHA worker will contact you soon. Until then, stay hydrated and rest well. 🙏',
    }), 900);
  };

  const risk = PATIENT.riskLevel || 'low';
  const riskMsg = RISK_MESSAGES[risk];

  return (
    <div className="min-h-screen bg-cream">
      <TopBar />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ── Greeting ───────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-serif text-3xl text-charcoal">
            {lang === 'hi' ? 'नमस्ते बेटी 🙏' : 'Hello, dear 🙏'}
          </h1>
          <p className="text-sm text-muted mt-1">{PATIENT.name}</p>
        </motion.div>

        {/* ── Pregnancy Progress ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
          className="bg-ivory rounded-3xl p-7 shadow-warm border border-blush"
        >
          <h2 className="font-serif text-xl text-charcoal text-center mb-6">
            {lang === 'hi' ? 'गर्भावस्था प्रगति' : 'Pregnancy Progress'}
          </h2>
          <PregnancyRing week={PATIENT.gestationalWeeks} total={40} />
        </motion.div>

        {/* ── Health Summary ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`rounded-3xl p-5 border-2 ${riskMsg.bg} ${riskMsg.border}`}
        >
          <h2 className="font-serif text-xl text-charcoal mb-3">
            {lang === 'hi' ? 'स्वास्थ्य सारांश' : 'Health Summary'}
          </h2>
          <p className={`text-lg font-semibold ${riskMsg.color} mb-4`}>
            {lang === 'hi' ? riskMsg.hi : riskMsg.en}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: lang === 'hi' ? 'BP' : 'Blood Pressure', value: `${PATIENT.systolicBP}/${PATIENT.diastolicBP} mmHg` },
              { label: lang === 'hi' ? 'हीमोग्लोबिन' : 'Haemoglobin', value: PATIENT.hemoglobin ? `${PATIENT.hemoglobin} g/dL` : '—' },
              {
                label: lang === 'hi' ? 'अंतिम विज़िट' : 'Last Visit',
                value: PATIENT.lastVisitDate?.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' }) ?? '—',
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

        {/* ── Amma Chat ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-ivory rounded-3xl shadow-warm border border-blush overflow-hidden"
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
          <div className="h-72 overflow-y-auto px-4 py-4 space-y-3 bg-cream/50">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
                >
                  {msg.sender === 'amma' && (
                    <div className="flex-shrink-0 mt-auto"><AmmaAvatar size={28} /></div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
                      msg.sender === 'amma'
                        ? 'bg-sage/20 text-charcoal border border-sage/20 rounded-tl-sm'
                        : 'bg-saffron/20 text-charcoal border border-saffron/20 rounded-tr-sm'
                    }`}
                  >
                    {lang === 'hi' ? msg.hi : msg.en}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto border-t border-blush/60 scrollbar-none">
            {QUICK_REPLIES_DATA.filter(qr => !usedReplies.has(qr.key)).map(qr => (
              <button
                key={qr.key}
                onClick={() => handleQuickReply(qr)}
                className="flex-shrink-0 text-xs font-medium px-3.5 py-2 bg-blush text-charcoal rounded-full hover:bg-saffron hover:text-white transition-all duration-200 border border-blush"
              >
                {lang === 'hi' ? qr.labelHi : qr.labelEn}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 bg-ivory border-t border-blush flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'hi' ? 'अम्मा से पूछें…' : 'Ask Amma…'}
              className="flex-1 h-11 px-4 rounded-full border-2 border-blush bg-cream text-sm text-charcoal focus:border-saffron focus:outline-none transition-colors"
            />
            <button
              onClick={handleSend}
              className="w-11 h-11 rounded-full bg-saffron flex items-center justify-center hover:bg-terracotta transition-colors flex-shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
            <button className="w-11 h-11 rounded-full bg-blush flex items-center justify-center hover:bg-terracotta/20 transition-colors flex-shrink-0">
              <Mic size={16} className="text-terracotta" />
            </button>
          </div>
        </motion.div>

        {/* ── Weekly Tips ─────────────────────────────────────────────────────── */}
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

        {/* ── Heart note ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-4"
        >
          <Heart size={18} className="text-terracotta mx-auto mb-2" fill="currentColor" />
          <p className="text-xs text-muted">
            {lang === 'hi'
              ? 'मातृत्व AI — हर माँ के लिए, प्यार से बनाया गया'
              : 'मातृत्व AI — Built with care for every mother'}
          </p>
        </motion.div>

        <div className="h-6" />
      </div>
    </div>
  );
}
