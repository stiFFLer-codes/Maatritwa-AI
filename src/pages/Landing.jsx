import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeartPulse, Baby, Stethoscope, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/shared/LanguageToggle';

// ── Mandala Mother Illustration ──────────────────────────────────────────────
function MotherIllustration() {
  return (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-sm mx-auto">
      <defs>
        <radialGradient id="bgCircle" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#F2DDD0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFF8F0" stopOpacity="0"   />
        </radialGradient>
        <radialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#E8863A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E8863A" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="200" cy="200" r="195" fill="url(#bgCircle)" />
      <circle cx="200" cy="200" r="175" fill="url(#glowGrad)" />

      {/* Outer mandala ring — dashed */}
      <circle cx="200" cy="200" r="182" fill="none" stroke="#E8863A" strokeWidth="1" strokeDasharray="6 5" opacity="0.35" />

      {/* 8 decorative petal ellipses evenly spaced */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const cx = 200 + 152 * Math.sin(angle);
        const cy = 200 - 152 * Math.cos(angle);
        return (
          <ellipse
            key={i}
            cx={cx} cy={cy}
            rx="14" ry="22"
            fill="#F2DDD0"
            stroke="#E8863A"
            strokeWidth="1.2"
            opacity="0.75"
            transform={`rotate(${i * 45} ${cx} ${cy})`}
          />
        );
      })}

      {/* Inner ring */}
      <circle cx="200" cy="200" r="148" fill="#FFFCF7" stroke="#F2DDD0" strokeWidth="2" />

      {/* 8 small decorative dots on inner ring */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={200 + 148 * Math.sin(angle)}
            cy={200 - 148 * Math.cos(angle)}
            r="4" fill="#E8863A" opacity="0.5"
          />
        );
      })}

      {/* ── Mother figure ── */}
      {/* Saree/body — warm terracotta */}
      <path
        d="M174,166 C164,196 160,240 164,292 L236,292 C240,240 236,196 226,166 Z"
        fill="#E8863A" opacity="0.92"
      />
      {/* Saree border — terracotta trim */}
      <path
        d="M164,292 C170,306 185,318 200,320 C215,318 230,306 236,292 Z"
        fill="#C75B39" opacity="0.85"
      />
      {/* Pallu drape over left shoulder */}
      <path
        d="M174,166 C169,180 165,205 162,232 L154,226 C158,200 163,177 169,163 Z"
        fill="#C75B39" opacity="0.65"
      />
      {/* Pallu border pattern dots */}
      <circle cx="163" cy="192" r="2.5" fill="#FFF8F0" opacity="0.7" />
      <circle cx="160" cy="208" r="2.5" fill="#FFF8F0" opacity="0.7" />
      <circle cx="158" cy="224" r="2.5" fill="#FFF8F0" opacity="0.7" />

      {/* Head */}
      <circle cx="200" cy="128" r="30" fill="#D4917A" />
      {/* Forehead bindi */}
      <circle cx="200" cy="117" r="3.5" fill="#C75B39" />
      <circle cx="200" cy="117" r="1.5" fill="#FFF8F0" />
      {/* Hair */}
      <path
        d="M172,125 C172,109 184,98 200,96 C216,98 228,109 228,125 C224,118 212,113 200,113 C188,113 176,118 172,125 Z"
        fill="#2D2A26" opacity="0.85"
      />
      {/* Hair bun */}
      <ellipse cx="200" cy="100" rx="14" ry="10" fill="#2D2A26" opacity="0.8" />
      <circle  cx="200" cy="93"  r="5"       fill="#E8863A"  opacity="0.9" />

      {/* Left arm cradling baby */}
      <path
        d="M174,172 C166,182 162,198 158,215 C164,222 172,225 180,220 C182,208 185,194 188,183 Z"
        fill="#C75B39" opacity="0.8"
      />
      {/* Right arm */}
      <path
        d="M226,172 C234,184 238,202 240,218 C234,225 226,226 220,220 C220,206 222,190 222,176 Z"
        fill="#C75B39" opacity="0.75"
      />

      {/* ── Baby ── */}
      {/* Baby swaddle body */}
      <ellipse cx="200" cy="210" rx="24" ry="20" fill="#FDE8D8" />
      {/* Baby head */}
      <circle cx="200" cy="187" r="16" fill="#F5C8A8" />
      {/* Baby eyes */}
      <circle cx="194" cy="185" r="2"   fill="#2D2A26" opacity="0.6" />
      <circle cx="206" cy="185" r="2"   fill="#2D2A26" opacity="0.6" />
      {/* Baby smile */}
      <path d="M194,192 Q200,197 206,192" stroke="#2D2A26" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
      {/* Baby highlight */}
      <circle cx="196" cy="183" r="1" fill="white" opacity="0.6" />

      {/* Heart glow — love between mother and child */}
      <path
        d="M196,151 C196,148 192,144 188,148 C184,152 188,158 196,165 C204,158 208,152 204,148 C200,144 196,148 196,151 Z"
        fill="#C75B39" opacity="0.55"
      />

      {/* Ground/base decorative dots */}
      <circle cx="172" cy="302" r="3" fill="#E8863A" opacity="0.45" />
      <circle cx="186" cy="308" r="3" fill="#E8863A" opacity="0.45" />
      <circle cx="200" cy="310" r="3" fill="#E8863A" opacity="0.55" />
      <circle cx="214" cy="308" r="3" fill="#E8863A" opacity="0.45" />
      <circle cx="228" cy="302" r="3" fill="#E8863A" opacity="0.45" />

      {/* Sparkle dots around figure */}
      <circle cx="152" cy="155" r="2.5" fill="#D4932A" opacity="0.6" />
      <circle cx="248" cy="155" r="2.5" fill="#D4932A" opacity="0.6" />
      <circle cx="145" cy="230" r="2"   fill="#7BA68A"  opacity="0.7" />
      <circle cx="255" cy="230" r="2"   fill="#7BA68A"  opacity="0.7" />
    </svg>
  );
}

// ── Stagger animation ────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, type: 'spring', stiffness: 90, damping: 18 },
  }),
};

// ── Role cards data ──────────────────────────────────────────────────────────
const ROLES = [
  {
    key:    'asha',
    to:     '/asha',
    icon:   HeartPulse,
    color:  'text-terracotta',
    iconBg: 'bg-terracotta/10',
    border: 'border-terracotta/20',
    hover:  'hover:border-terracotta/50',
    cta:    'openDashboard',
  },
  {
    key:    'mother',
    to:     '/mother',
    icon:   Baby,
    color:  'text-sage',
    iconBg: 'bg-sage/10',
    border: 'border-sage/20',
    hover:  'hover:border-sage/50',
    cta:    'viewHealth',
  },
  {
    key:    'doctor',
    to:     '/doctor',
    icon:   Stethoscope,
    color:  'text-saffron',
    iconBg: 'bg-saffron/10',
    border: 'border-saffron/20',
    hover:  'hover:border-saffron/50',
    cta:    'reviewCases',
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function Landing() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-ivory/90 backdrop-blur-sm border-b border-blush shadow-soft">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-serif text-xl font-semibold text-charcoal">मातृत्व AI</span>
          <LanguageToggle />
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-14 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">

          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-saffron/10 text-saffron text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-saffron/20"
            >
              <Sparkles size={12} />
              AI-Powered Maternal Health
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="font-serif text-charcoal leading-tight mb-4"
              style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}
            >
              {t('heroTitle')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xl text-terracotta font-medium mb-4"
            >
              {t('heroSubtitle')}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-base text-muted leading-relaxed mb-10 max-w-lg"
            >
              {t('heroDesc')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 100 }}
            >
              <a
                href="#roles"
                className="inline-flex items-center gap-2 bg-saffron text-white font-semibold px-8 py-4 rounded-2xl shadow-warm hover:bg-terracotta transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('getStarted')}
                <ArrowRight size={18} />
              </a>
            </motion.div>

            {/* Credibility line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-xs text-muted flex items-center gap-2"
            >
              <span className="w-8 h-px bg-blush inline-block" />
              {t('footerSub')}
            </motion.p>
          </div>

          {/* Right: illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="animate-float"
          >
            <MotherIllustration />
          </motion.div>
        </div>
      </section>

      {/* ── Role Selection ─────────────────────────────────────────────────── */}
      <section id="roles" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl text-charcoal mb-3">
              {t('chooseRole')}
            </h2>
            <div className="w-12 h-0.5 bg-terracotta mx-auto rounded-full" />
          </motion.div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map(({ key, to, icon: Icon, color, iconBg, border, hover, cta }, i) => (
              <motion.div
                key={key}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
                className={`
                  bg-ivory rounded-3xl p-8 border-2 ${border} ${hover}
                  shadow-warm hover:shadow-warm-lg
                  transition-shadow duration-300 group flex flex-col items-center text-center
                `}
              >
                {/* Icon container */}
                <div className={`w-20 h-20 ${iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={38} className={color} />
                </div>

                <h3 className="font-serif text-2xl text-charcoal mb-3">
                  {t(`roles.${key}.title`)}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-8 flex-1">
                  {t(`roles.${key}.desc`)}
                </p>

                <Link
                  to={to}
                  className={`
                    inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                    bg-saffron/10 text-saffron border border-saffron/20
                    hover:bg-saffron hover:text-white hover:border-saffron
                    transition-all duration-200 w-full justify-center
                  `}
                >
                  {t(cta)}
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-ivory border-t border-blush py-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="font-serif text-xl text-charcoal mb-2">मातृत्व AI</p>
          <p className="text-sm text-muted mb-1">{t('footerTag')}</p>
          <p className="text-xs text-muted/70">{t('footerSub')}</p>
        </div>
      </footer>
    </div>
  );
}
