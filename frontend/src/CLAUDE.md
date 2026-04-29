# मातृत्व AI (Maatritva AI) - Project Guide

> **Archived, and partly historical.** This guide was written in March 2026 before
> the backend existed. The design system, accessibility rules and component
> patterns below are still accurate and still worth following. The stack,
> integration and status sections have been corrected to match what was actually
> built. Where it says "future", it usually means "was never built".
>
> For the current picture start at [README.md](../../README.md) and
> [docs/architecture.md](../../docs/architecture.md).

## Project Overview

**मातृत्व AI** is an AI-powered maternal health intelligence ecosystem designed for rural India. It connects ASHA workers, pregnant mothers, and doctors to enable early detection of preeclampsia 4-6 weeks before clinical symptoms appear.

**Mission:** Make maternal health intelligence accessible to everyone in the healthcare chain—the worker monitoring, the mother living it, and the doctor protecting it.

**Target Users:**
- **ASHA Workers** (primary): Community health workers with basic smartphones, varying tech literacy
- **Pregnant Mothers**: Often first-time tech users, need calm and clear information
- **Doctors**: Time-constrained, need fast triage and explainable AI

**Context:** Built for low-resource Indian healthcare settings where:
- Internet connectivity is spotty (4G available but inconsistent)
- Devices are entry-level (2GB RAM smartphones common)
- Literacy varies (Hindi + English bilingual support required)
- Medical infrastructure is limited (paper registers still common)

---

## Core Philosophy

### Design Principles (Apple-Inspired for India)

1. **"Simple is harder than complex"**
   - Don't show ASHA workers "BP Systolic/Diastolic mmHg"
   - Show: "Upper number: ___ Lower number: ___"
   - Better: Voice "BP kitna hai?" → Auto-fill

2. **"Focus means saying no"**
   - ONE problem: Early preeclampsia detection
   - NOT: Full pregnancy tracking, nutrition, baby development
   - Master one thing exceptionally well

3. **"Design is how it works, not how it looks"**
   - Beautiful gradient = worthless if voice input fails
   - Traffic light system works because it maps to existing mental models

4. **"Start with user experience, work backward to technology"**
   - User wants: "Record visit in 30 seconds"
   - Technology choice: Voice API (fastest input method)
   - NOT: "We have voice API, let's use it"

### Cultural Sensitivity

- **Maternal warmth, not clinical coldness**: Use cream backgrounds, not sterile white
- **Reassurance over alarm**: Mother sees 🟡 "Checkup soon" not "Risk Score: 65/100"
- **Dignity and empowerment**: Mothers OWN their data, not just subjects of data collection
- **Cultural references**: Lotus patterns (subtle), "Maata" terminology (reverent)

---

## Tech Stack

### Frontend
```json
{
  "framework": "React 19",
  "build": "Vite",
  "styling": "Tailwind CSS 3.4",
  "animations": "Framer Motion",
  "icons": "Lucide React",
  "routing": "React Router v7",
  "forms": "React Hook Form",
  "state": "React Context (no Redux yet)"
}
```

### Backend (as built)
```json
{
  "api": "FastAPI (Python)",
  "ml": "scikit-learn, pickled models with rule-based fallbacks",
  "database": "Supabase (Postgres)",
  "chat": "offline — cited WHO/ICMR/FOGSI replies, no LLM, no network",
  "hosting": "never deployed",
  "voice": "never built",
  "shap": "never built — see the three-voices repo for that work"
}
```

### Development
```json
{
  "language": "JavaScript/JSX (TypeScript future)",
  "linting": "ESLint",
  "formatting": "Prettier",
  "git": "Conventional Commits"
}
```

---

## Project Structure

> The real tree, as of September 2026. What this section used to list — Firebase
> hooks, a TrendChart, a ShapExplanation, a VoiceInputButton, per-role component
> folders — was never built. If a file is not below, it does not exist.

```
frontend/
├── index.html                     # fonts, title, theme-color, favicon
├── public/mark.svg                # the mark, also the favicon
├── tailwind.config.js             # design tokens — the source of truth
├── postcss.config.js
├── vite.config.js
├── eslint.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                    # four routes, no layout wrapper
    ├── index.css                  # tokens, base type, .tnum, .label, .spine, motion
    ├── CLAUDE.md                  # this file
    ├── components/shared/
    │   ├── Wordmark.jsx           # Mark + wordmark, monochrome
    │   ├── TopBar.jsx             # back / wordmark / language + the demo banner
    │   ├── LanguageToggle.jsx
    │   ├── RiskBadge.jsx          # the four-level chip
    │   └── RiskRendering.jsx      # the landing signature: one reading, three renderings
    ├── pages/
    │   ├── Landing.jsx
    │   ├── landing.test.jsx       # renders all four pages under node
    │   ├── test-dom-stub.js       # minimal window/document for that test
    │   ├── asha/AshaDashboard.jsx     # ~2,000 lines, sub-components inlined
    │   ├── doctor/DoctorDashboard.jsx
    │   └── mother/MotherDashboard.jsx
    ├── services/
    │   ├── api.js                 # apiFetch: real backend, else demo fallback
    │   ├── demoBackend.js         # in-browser stand-in for the whole API
    │   ├── demoBackend.test.mjs
    │   ├── ammaChat.js            # offline cited replies, no LLM
    │   └── ammaChat.test.mjs
    ├── data/
    │   ├── clinicalPatients.json  # 104 pseudonymised records
    │   ├── clinicalKnowledgeBase.js
    │   ├── decisionTreeRules.js
    │   └── modelMetrics.json      # read its `caveats` block first
    └── i18n/
        ├── LanguageContext.jsx    # also syncs <html lang>
        └── translations.js        # Hindi default, English second
```

There are no `hooks/`, `lib/`, or `contexts/` directories, and no per-role
component folders. The dashboards keep their sub-components inlined — that is
how they were written under a demo deadline and they have not been decomposed.

---

## Design System

> Rewritten September 2026 to match what the code actually does. The palette
> this section used to describe (coral / purple / mint, Inter + Outfit) was
> never in the codebase, and the one after it (cream + Playfair + terracotta)
> was replaced in the same pass. `tailwind.config.js` is the source of truth.

### The one rule

**Chroma is a clinical signal.** Nothing decorative is coloured.

| Family | Means | Where it appears |
|---|---|---|
| **Warm ramp** | the patient's state | risk badges, spines, the risk ladder, flags |
| **Cool** (`action`) | something you can act on | buttons, links, focus rings, filter chips |
| **Ink** | everything else | text, hairlines, structure, the demo banner |

An alarm that competes with ornament stops reading as an alarm. That is the
argument the paper behind this repo makes about rendering risk, applied to the
interface itself. If you are reaching for colour and it is not a patient's
state or a control, use ink.

### Palette

```css
--paper:       #F6F5F2;   /* page ground — warm neutral, not cream */
--card:        #FFFFFF;   /* raised surface */
--ink:         #191A17;   /* body text, 16:1 on paper */
--ink-soft:    #5C5E58;   /* secondary text, 6.0:1 */
--ink-rule:    #E4E2DB;   /* hairlines */
--ink-strong:  #C9C6BC;   /* emphasised hairlines, input borders */

--action:      #1E3A5F;   /* the only cool colour. Interactive, never a signal */
--action-hover:#162C48;
--action-tint: #E8ECF2;

--risk-safe:     #276749;  /* 6.2:1 on paper */
--risk-watch:    #8A5D0B;  /* 5.3:1 */
--risk-high:     #AE4515;  /* 5.3:1 */
--risk-critical: #8F1D1D;  /* 8.2:1 */
```

Every foreground/background pairing in this palette clears WCAG AA (4.5:1) on
both `--paper` and `--card`, including each risk colour on its own tint chip.
If you add a colour, check it before you commit it.

**Tailwind aliases.** The two large dashboards carry ~800 class names written
against the old palette (`saffron`, `terracotta`, `blush`, `charcoal`, …).
Those names are aliased in `tailwind.config.js` onto the tokens above rather
than rewritten in place. Prefer the real token names (`text-ink`,
`border-ink-rule`, `bg-risk-tint-watch`, `text-action`) in new code.

### Typography

One superfamily, three roles:

```css
--font-sans: 'IBM Plex Sans', 'IBM Plex Sans Devanagari', system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
```

IBM Plex Sans carries no Devanagari, so Devanagari text falls through to IBM
Plex Sans Devanagari automatically — same superfamily, optically matched, and
**no per-string language class anywhere in the app.** Hindi is set as a first
class face here, not as whatever the system happens to supply.

There is no separate display face. Headings are separated from body text by
weight (600) and negative tracking, not by a contrasting family: a triage
screen read at arm's length in daylight wants one voice, not two.

**`.tnum`** puts a value in IBM Plex Mono with tabular figures. Use it for
every clinical number — blood pressure, haemoglobin, gestation week, score,
patient id — so columns of readings line up and a changed digit is visible.

**Sizes.** 16px body minimum. Hindi headings get extra leading through
`:lang(hi)` in `index.css`; keep `document.documentElement.lang` in sync (the
`LanguageProvider` already does).

### Structural devices

- **`.spine`** — a solid band down the leading edge of a record, coloured by
  risk (`spine-safe` / `spine-moderate` / `spine-high` / `spine-critical`).
  Borrowed from the Mother and Child Protection card these workers already
  carry, which is banded the same way. State risk **once** per row: the spine
  plus a badge is enough, a third dot is noise.
- **`.label`** — 11px uppercase tracked ink-soft, for field names, table
  headers and section eyebrows.
- **Hairline grids** — `grid gap-px bg-ink-rule` over `bg-card` children gives
  a document rule between panels without borders that double up.

### Motion

Subtle tier. 200–450ms, ease-out. One orchestrated entrance per page, then the
page holds still — anything still moving after the reader arrives is competing
with the risk signal. `prefers-reduced-motion` is honoured globally in
`index.css` and by `useReducedMotion()` on the landing page.

### Spacing & Layout

**Touch targets (minimum 44px, 48px for primary field actions):**

```css
--btn-sm: 2.75rem; /* 44px — the floor */
--btn-md: 3rem;    /* 48px — form inputs and primary actions */
--btn-lg: 3.5rem;  /* 56px — critical actions */
```

```css
/* Spacing scale (4px grid) */
--space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
--space-4: 1rem;     --space-6: 1.5rem;   --space-8: 2rem;
--space-12: 3rem;    --space-16: 4rem;
```

**Grid.** Mobile-first, designed down to 360px. Breakpoints sm (640), md (768),
lg (1024). Wide content scrolls inside its own container; the page body never
scrolls horizontally.

**Radii.** 6–14px. Documents have corners; the 24px+ blobs are gone.

**Shadows.** Almost none. Structure comes from hairlines, not elevation.

### Checklist before adding UI

- [ ] Is the colour I am reaching for a patient state or a control? If neither, use ink.
- [ ] Do the numbers use `.tnum`?
- [ ] Is risk stated once, not three times?
- [ ] Contrast ≥ 4.5:1 against both paper and card.
- [ ] Touch target ≥ 44px, keyboard focus visible, icon-only buttons have `aria-label`.
- [ ] Loading, error and empty are three different states, and each says what to do next.
- [ ] `npm test` passes — `test:ui` renders all four pages and will catch a broken import.

---

## Coding Conventions

### File Naming
```
Components: PascalCase.jsx
  ✅ RiskBadge.jsx, RiskRendering.jsx, Wordmark.jsx
  ❌ riskBadge.jsx, risk-badge.jsx

Hooks: camelCase.js
  ✅ usePatients.js, useVoiceRecording.js
  ❌ UsePatients.js, use-patients.js

Pages: PascalCase.jsx
  ✅ Dashboard.jsx, RecordVisit.jsx
  ❌ dashboard.jsx, record-visit.jsx

Utilities: camelCase.js
  ✅ formatDate.js, validateVitals.js
  ❌ FormatDate.js, validate-vitals.js
```

### Component Structure
```jsx
// Template for all components
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from 'lucide-react';

/**
 * Component description
 * 
 * @param {Object} props
 * @param {string} props.name - Description
 * @param {function} props.onClick - Description
 */
const ComponentName = ({ name, onClick }) => {
  // 1. State declarations
  const [state, setState] = useState(initialValue);
  
  // 2. Effect hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 3. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 4. Render helpers
  const renderContent = () => {
    // Complex rendering logic
  };
  
  // 5. Return JSX
  return (
    <div className="container">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Props Validation (Future: PropTypes or TypeScript)
```jsx
// Currently: Document props in JSDoc
// Future: Add PropTypes or migrate to TypeScript

/**
 * @typedef {Object} PatientCardProps
 * @property {Object} patient - Patient data
 * @property {number} patient.riskScore - Risk score 0-100
 * @property {string} patient.category - 'safe'|'monitor'|'elevated'|'critical'
 * @property {function} onClick - Click handler
 */
```

### Error Handling

**Always handle errors gracefully:**
```jsx
// ❌ Bad: No error handling
const data = await fetchPatients();

// ✅ Good: Try-catch with user-friendly message
try {
  const data = await fetchPatients();
  setPatients(data);
} catch (error) {
  console.error('Error fetching patients:', error);
  setError('Unable to load patients. Please check your connection.');
  // Show user-friendly message in Hindi
  showToast('मरीजों की जानकारी लोड नहीं हो सकी। कृपया फिर से कोशिश करें।');
}
```

### Accessibility Requirements

**All interactive elements MUST:**
- Have minimum 48px touch targets
- Include proper ARIA labels
- Support keyboard navigation
- Have visible focus indicators
- Work with screen readers
```jsx
// ✅ Good accessibility
<button
  className="h-14 px-6 rounded-full"
  onClick={handleClick}
  aria-label="Record new patient visit"
  aria-pressed={isRecording}
>
  {children}
</button>

// ❌ Bad accessibility
<div onClick={handleClick}>
  {children}
</div>
```

---

## Component Patterns

### Button Component Pattern
```jsx
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-maternal-purple to-maternal-coral text-white',
    secondary: 'bg-sand text-charcoal hover:bg-warm-gray',
    danger: 'bg-maternal-coral text-white hover:bg-maternal-coral-dark'
  };
  
  const sizes = {
    sm: 'h-12 px-6 text-base',
    md: 'h-14 px-8 text-lg',
    lg: 'h-16 px-10 text-xl'
  };
  
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-full font-semibold
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? <LoadingSpinner /> : children}
    </motion.button>
  );
};
```

### Loading States Pattern
```jsx
// ✅ Good: Show loading state with context
{isLoading && (
  <div className="flex items-center gap-3">
    <LoadingSpinner />
    <p className="text-gray-warm">विश्लेषण हो रहा है...</p>
  </div>
)}

// ❌ Bad: Generic loading without context
{isLoading && <LoadingSpinner />}
```

### Empty States Pattern
```jsx
// ✅ Good: Encouraging empty state
{patients.length === 0 && (
  <div className="text-center py-12">
    <p className="text-4xl mb-4">🎉</p>
    <h3 className="text-xl font-semibold text-charcoal mb-2">
      सभी मरीज़ सुरक्षित हैं!
    </h3>
    <p className="text-gray-warm">
      कोई उच्च जोखिम मामला नहीं
    </p>
  </div>
)}

// ❌ Bad: No data shown
{patients.length === 0 && <p>No patients</p>}
```

### Error States Pattern
```jsx
// ✅ Good: Actionable error with retry
{error && (
  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
    <div className="flex items-start gap-3">
      <AlertCircle className="text-orange-500 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="font-semibold text-charcoal mb-1">
          कनेक्शन में समस्या
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          {error.message || 'इंटरनेट कनेक्शन कमजोर है। कृपया फिर से प्रयास करें।'}
        </p>
        <Button onClick={retry} size="sm" variant="secondary">
          फिर से कोशिश करें
        </Button>
      </div>
    </div>
  </div>
)}
```

---

## Animation Guidelines

### When to Animate

**DO animate:**
- Page transitions (fade in/slide up)
- Risk score reveal (gauge fills, number counts up)
- Loading states (pulse, shimmer)
- Micro-interactions (button press, card hover)
- Success confirmations (checkmark animation)

**DON'T animate:**
- Text reading flow (distracting)
- Form inputs (annoying)
- Rapid repeated actions (exhausting)

### Performance Rules
```jsx
// ✅ Good: Use transform/opacity (GPU accelerated)
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>

// ❌ Bad: Animate width/height/top/left (CPU intensive)
<motion.div
  animate={{ width: '100%' }}
>

// ✅ Good: Disable animations on low-end devices
const { hasLowRAM } = useDeviceCapabilities();

<motion.div
  animate={!hasLowRAM && { opacity: 1 }}
>
```

### Standard Animation Timings
```js
const animations = {
  fast: { duration: 0.2 },      // Micro-interactions
  normal: { duration: 0.3 },     // Most transitions
  slow: { duration: 0.5 },       // Page transitions
  deliberate: { duration: 1.5 }, // Risk gauge fill (build anticipation)
};
```

---

## Bilingual Support (Hindi + English)

### Text Content Pattern
```jsx
// Create translation object
const translations = {
  en: {
    greeting: 'Hello',
    riskSafe: 'Everything looks great!',
    riskCritical: 'Please see doctor today',
    recordVisit: 'Record Visit'
  },
  hi: {
    greeting: 'नमस्ते',
    riskSafe: 'सब कुछ बढ़िया है!',
    riskCritical: 'कृपया आज डॉक्टर से मिलें',
    recordVisit: 'विज़िट रिकॉर्ड करें'
  }
};

// Use in components
const { language } = useLanguage();
const t = translations[language];

return <h1>{t.greeting}</h1>;
```

### Number Formatting (Indian Numbering)
```js
// ✅ Good: Indian format (1,00,000)
const formatNumber = (num) => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// ❌ Bad: Western format (100,000)
const formatNumber = (num) => {
  return num.toLocaleString('en-US');
};
```

### Date Formatting
```js
// For Hindi
const formatDate = (date, locale = 'hi') => {
  return new Date(date).toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Example outputs:
// Hindi: १५ फ़रवरी २०२६
// English: 15 February 2026
```

---

## User Role Patterns

### ASHA Worker Interface

**Design Principles:**
- Voice-first (typing is secondary)
- Large touch targets (48px minimum)
- Traffic light system (instant visual triage)
- Trends visible (she needs to see changes over time)
- Action-oriented (what to do next)
```jsx
// Example: Patient card for ASHA
const PatientCard = ({ patient }) => (
  <Card onClick={() => navigate(`/patients/${patient.id}`)}>
    <div className="flex items-start justify-between">
      {/* Risk dot (instant visual) */}
      <div className={`w-3 h-3 rounded-full ${getRiskColor(patient.category)} mt-1`} />
      
      {/* Patient info */}
      <div className="flex-1 px-4">
        <h3 className="font-semibold text-lg">{patient.name}</h3>
        <p className="text-sm text-gray-warm">
          {patient.age} साल • {patient.gestationWeek} हफ्ते
        </p>
      </div>
      
      {/* Risk score (large, bold) */}
      <div className="text-right">
        <div className="text-3xl font-bold">{patient.riskScore}</div>
        {patient.trend && <TrendArrow direction={patient.trend} />}
      </div>
    </div>
    
    {/* Action if elevated */}
    {patient.category !== 'safe' && (
      <div className="mt-3 pt-3 border-t border-warm-gray">
        <p className="text-sm">→ {getActionMessage(patient.category)}</p>
      </div>
    )}
  </Card>
);
```

### Mother Interface

**Design Principles:**
- Calm and reassuring (NO panic)
- NO medical jargon (simple Hindi)
- Traffic light only (no complex numbers)
- Empowering (she owns her data)
- Family-friendly (husband/mother-in-law can understand)
```jsx
// Example: Health status for mother
const HealthStatus = ({ riskCategory }) => {
  const messages = {
    safe: {
      emoji: '🟢',
      title: 'सब कुछ बढ़िया है!',
      message: 'आप और आपका बच्चा स्वस्थ हैं।',
      color: 'maternal-mint'
    },
    monitor: {
      emoji: '🟡',
      title: 'जल्द जाँच करवाएं',
      message: 'कुछ दिनों में ASHA दीदी से मिलें।',
      color: 'yellow-500'
    },
    critical: {
      emoji: '🔴',
      title: 'आज डॉक्टर से मिलें',
      message: 'कृपया आज ही डॉक्टर से संपर्क करें।',
      color: 'maternal-coral'
    }
  };
  
  const status = messages[riskCategory];
  
  return (
    <Card className="text-center p-8">
      <p className="text-6xl mb-4">{status.emoji}</p>
      <h2 className="text-2xl font-bold mb-2">{status.title}</h2>
      <p className="text-gray-warm leading-relaxed">{status.message}</p>
    </Card>
  );
};
```

### Doctor Interface

**Design Principles:**
- Information dense (doctors can handle it)
- Medical terminology OK (clinical language)
- Explainable AI (show reasoning)
- Fast triage (sort by risk automatically)
- Keyboard shortcuts (efficiency)
```jsx
// Example: SHAP explanation for doctor
const ShapExplanation = ({ factors, riskScore }) => (
  <div className="bg-white rounded-2xl p-6 border-l-4 border-maternal-purple">
    <div className="flex items-center gap-2 mb-4">
      <Brain size={20} className="text-maternal-purple" />
      <h3 className="font-semibold">AI Reasoning</h3>
    </div>
    
    <div className="space-y-3">
      {factors.map((factor, i) => (
        <div key={i} className="flex items-center gap-3">
          {/* Contribution bar */}
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-maternal-coral"
              initial={{ width: 0 }}
              animate={{ width: `${factor.contribution}%` }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            />
          </div>
          
          {/* Factor details */}
          <div className="w-1/2">
            <p className="text-sm font-medium">{factor.name}</p>
            <p className="text-xs text-gray-warm">{factor.value}</p>
          </div>
          
          {/* Percentage */}
          <div className="text-sm font-semibold text-maternal-purple">
            {factor.contribution}%
          </div>
        </div>
      ))}
    </div>
    
    <div className="mt-4 pt-4 border-t text-xs text-gray-500">
      Based on FOGSI 2019 & WHO preeclampsia guidelines
    </div>
  </div>
);
```

---

## Backend Integration Pattern (as built)

There is no Firebase and there are no data hooks. Every backend call goes through
one helper, which falls back to an in-browser demo backend when the real API is
unreachable. See `src/services/api.js` and `src/services/demoBackend.js`.

```jsx
import { apiFetch } from '../../services/api';

// Path only — apiFetch adds the base URL, or serves demo data if nothing answers.
const res = await apiFetch(`/asha/patients/${patientId}/details`);
if (!res.ok) throw new Error(`Failed to load details (HTTP ${res.status})`);
const { patient, visits } = await res.json();
```

Rules for this layer:

- **Never call `fetch` directly** for a backend route. Direct calls skip the
  fallback and break the no-backend demo, which is how most people see this repo.
- **Pass a path, not a URL.** `apiFetch('/asha/patients')`, never
  `apiFetch('http://localhost:8000/asha/patients')`.
- **Keep demo shapes in sync.** `demoBackend.js` mirrors the Pydantic models in
  `backend/app/routers/`. Change a response model there and you must change it
  here, or the demo silently diverges from the real API.
- **Run `npm test` after touching either.** It asserts the shapes and the
  ASHA→doctor referral flow.

### Prediction call

```jsx
const res = await apiFetch('/asha/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patient_id: patientId,
    blood_pressure_sys: sys, blood_pressure_dia: dia,
    hemoglobin: hb, weight_kg: weight,
    weeks_pregnant: weeks, age,
  }),
});
const { risk_level, risk_score, flags } = await res.json();
```

`flags` is the closest thing to explainability in this codebase — a list of named
clinical triggers such as `hypertensive_crisis` or `severe_anemia`. There is no
SHAP here. That work lives in the `three-voices` repository.

---


## Testing Guidelines

### Component Testing Checklist

For each component, verify:
- ✅ Renders without errors
- ✅ Props validation works
- ✅ Loading state displays correctly
- ✅ Error state displays correctly
- ✅ Empty state displays correctly
- ✅ Touch targets are ≥48px
- ✅ Text is ≥16px
- ✅ Colors contrast ratio >4.5:1
- ✅ Works on mobile viewport (360px)
- ✅ Animations are smooth (no jank)
- ✅ Keyboard navigation works
- ✅ Screen reader accessible

### Manual Testing Workflow
```
1. Desktop Chrome (primary development)
2. Mobile Chrome (test responsiveness)
3. Mobile Safari iOS (test compatibility)
4. Slow 3G throttling (test loading states)
5. Color blindness simulator (test contrast)
```

---

## Performance Guidelines

### Lazy Loading
```jsx
// ✅ Good: Lazy load pages
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/asha/Dashboard'));

<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

### Image Optimization
```jsx
// ✅ Good: Responsive images
<img 
  src="/assets/illustration.svg"
  alt="Mother and child illustration"
  loading="lazy"
  width="300"
  height="200"
/>

// ❌ Bad: No optimization
<img src="/large-image.png" />
```

### Memoization
```jsx
// ✅ Good: Memoize expensive computations
const sortedPatients = useMemo(
  () => patients.sort((a, b) => b.riskScore - a.riskScore),
  [patients]
);

// ❌ Bad: Sort on every render
const sortedPatients = patients.sort(...);
```

---

## Common Pitfalls to Avoid

### ❌ DON'T

1. **Use pure white backgrounds**
   - Use cream (#FFF8F0) instead

2. **Show raw medical numbers to mothers**
   - Use traffic light system instead

3. **Forget Hindi translations**
   - Always provide bilingual support

4. **Make touch targets <48px**
   - Minimum 48px for accessibility

5. **Use generic loading spinners**
   - Show contextual loading messages

6. **Ignore error states**
   - Always handle and display errors gracefully

7. **Assume good internet**
   - Design for spotty connectivity

8. **Use small fonts (<16px)**
   - Minimum 16px for body text

9. **Create black-box AI**
   - Always show explainability (SHAP)

10. **Forget offline scenarios**
    - Plan for future offline capability

---

## Glossary

### Medical Terms

- **Preeclampsia**: Pregnancy complication with high blood pressure (प्री-एक्लेम्पसिया)
- **ASHA Worker**: Accredited Social Health Activist (आशा कार्यकर्ता)
- **Gestation**: Duration of pregnancy in weeks (गर्भावधि)
- **BP**: Blood Pressure (रक्तचाप)
- **BMI**: Body Mass Index (बॉडी मास इंडेक्स)
- **SHAP**: SHapley Additive exPlanations (explainable AI method)

### Domain Terms

- **Risk Score**: 0-100 numerical risk assessment
- **Risk Category**: safe/monitor/elevated/critical
- **Traffic Light System**: 🟢🟡🟠🔴 visual risk indicator
- **FOGSI**: Federation of Obstetric & Gynaecological Societies of India
- **NHM**: National Health Mission
- **PHC**: Primary Health Centre

---

## Quick Reference Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Code Quality
npm run lint             # Lint code
npm run format           # Format with Prettier

# Firebase
# (Add after Firebase is set up)
```

---

## When in Doubt

**Ask these questions:**

1. **Is this accessible?** (Can someone with low vision/screen reader use it?)
2. **Is this mobile-friendly?** (Does it work on 360px width?)
3. **Is this bilingual?** (Hindi + English support?)
4. **Is this reassuring?** (Especially for mothers - calm, not alarming?)
5. **Is this explainable?** (Can we show WHY the AI made this decision?)
6. **Is this performant?** (Works on 2GB RAM phone?)

**If answer is "no" to any → Redesign before implementing.**

---

## Project Status — archived

Built for the India Innovates 2026 demo (Bharat Mandapam, 28 March 2026).
Development stopped that day. The list below is what the deadline actually
produced, separated from what the original plan claimed.

**Built and working:**
- ✅ Three interfaces (ASHA, mother, doctor) with Hindi/English toggle
- ✅ ASHA → doctor referral loop, end to end, backed by FastAPI + Supabase
- ✅ Risk prediction, rule-based with an optional pickled model
- ✅ Eclampsia trend assessment across visits, with a three-visit refusal gate
- ✅ Traffic-light risk categorisation
- ✅ Amma chat in Hindi, with emergency keyword short-circuit and cited fallbacks
- ✅ In-browser demo backend, so the whole app runs with no backend (added Sept 2026)

**Claimed in the original plan, never built:**
- ❌ Voice input — no speech code exists anywhere in this repo
- ❌ SHAP explainability — the doctor view shows named clinical flags, not SHAP
- ❌ Real-time sync between interfaces — every screen polls on mount
- ❌ Offline / PWA, ABDM integration, WhatsApp alerts, Tamil/Telugu/Bengali
- ❌ Mother dashboard backend wiring — the UI is a hardcoded patient

**Known to be unfinished:** see the "What is not finished" section of the
[README](../../README.md). No authentication, no committed model artifacts, no
backend tests.

---

**Last Updated:** September 2026 (revival and archival pass)
**Original team:** Markie, Shoury, Dhvani, Aditi

---

*Built for a demo. Kept for the paper.*