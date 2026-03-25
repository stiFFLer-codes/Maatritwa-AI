# मातृत्व AI (Maatritva AI) - Project Guide

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

### Backend (Future)
```json
{
  "api": "Flask (Python)",
  "ml": "scikit-learn + SHAP",
  "voice": "Google Speech-to-Text API",
  "database": "Firebase Realtime Database",
  "hosting": "Google Cloud Run",
  "storage": "Firebase Storage"
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
```
maatritva-ai/
├── public/
│   └── assets/
│       └── illustrations/      # Custom SVG illustrations (lotus, etc.)
├── src/
│   ├── components/
│   │   ├── shared/            # Used across all interfaces
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── RiskOMeter.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── asha/              # ASHA-specific components
│   │   │   ├── VoiceInputButton.jsx
│   │   │   ├── PatientCard.jsx
│   │   │   ├── VitalsForm.jsx
│   │   │   └── TrendChart.jsx
│   │   ├── mother/            # Mother-specific components
│   │   │   ├── SafetyCard.jsx
│   │   │   ├── VisitTimeline.jsx
│   │   │   └── HealthTip.jsx
│   │   └── doctor/            # Doctor-specific components
│   │       ├── PatientTable.jsx
│   │       ├── ShapExplanation.jsx
│   │       └── FilterBar.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── asha/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PatientList.jsx
│   │   │   ├── RecordVisit.jsx
│   │   │   └── PatientDetail.jsx
│   │   ├── mother/
│   │   │   ├── Dashboard.jsx
│   │   │   └── VisitHistory.jsx
│   │   └── doctor/
│   │       ├── Dashboard.jsx
│   │       └── PatientDetail.jsx
│   ├── hooks/
│   │   ├── usePatients.js     # Firebase real-time patient data
│   │   ├── useVoiceRecording.js
│   │   └── useAuth.js
│   ├── lib/
│   │   ├── firebase.js        # Firebase config and helpers
│   │   ├── api.js             # API client for ML backend
│   │   └── utils.js           # Utility functions
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── LanguageContext.jsx
│   ├── App.jsx                # Main app with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles + Tailwind
├── tailwind.config.js         # Custom design system
├── vite.config.js
├── package.json
└── CLAUDE.md                  # This file
```

---

## Design System

### Color Palette

**Maternal Theme Colors:**
```css
/* Primary Colors - Warm, Maternal, Trustworthy */
--maternal-coral: #FF6B6B;      /* Life, warmth (not alarming red) */
--maternal-coral-light: #FFB4A2;
--maternal-coral-dark: #E63946;

--maternal-purple: #6C5CE7;     /* Trust, wisdom */
--maternal-purple-light: #A29BFE;
--maternal-purple-dark: #5F3DC4;

--maternal-mint: #51CF66;       /* Health, growth */
--maternal-mint-light: #96F2B4;
--maternal-mint-dark: #37B24D;

/* Neutral Base - Warmth (NOT sterile white) */
--cream: #FFF8F0;               /* Background warmth */
--sand: #F8F0E3;                /* Card backgrounds */
--warm-gray: #E8DFD6;           /* Borders, dividers */
--charcoal: #2D3748;            /* Text primary */
--gray-warm: #718096;           /* Text secondary */

/* Semantic Risk Colors (Traffic Light System) */
--risk-safe: #51CF66;           /* Green - All clear */
--risk-monitor: #FCC419;        /* Yellow - Watch closely */
--risk-elevated: #FF922B;       /* Orange - Action needed */
--risk-critical: #FF6B6B;       /* Red - Urgent */
```

**Usage Rules:**
- Background: ALWAYS use cream (#FFF8F0), NEVER pure white (#FFFFFF)
- Cards: Use sand (#F8F0E3) for warmth
- Primary actions: Gradient from maternal-purple to maternal-coral
- Risk indicators: Traffic light colors (safe/monitor/elevated/critical)

### Typography

**Font Families:**
```css
--font-primary: 'Inter', 'Noto Sans Devanagari', sans-serif;
--font-accent: 'Outfit', 'Noto Sans Devanagari', sans-serif;
```

**Type Scale (Larger for readability in sunlight):**
```css
--text-xs: 0.875rem;   /* 14px - Minimum readable size */
--text-sm: 1rem;       /* 16px - Body text */
--text-base: 1.125rem; /* 18px - Comfortable reading */
--text-lg: 1.25rem;    /* 20px - Subheadings */
--text-xl: 1.5rem;     /* 24px - Headings */
--text-2xl: 2rem;      /* 32px - Risk scores */
--text-3xl: 3rem;      /* 48px - Hero numbers */

/* Weight */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Height (More generous for Hindi) */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;  /* Use for Hindi paragraphs */
```

**Rules:**
- MINIMUM body text: 16px (text-sm)
- Hindi text: Use leading-relaxed (1.75)
- Headings: Use font-accent (Outfit) for personality
- Body: Use font-primary (Inter) for readability

### Spacing & Layout

**Touch Targets (Minimum 48px for accessibility):**
```css
/* Button heights */
--btn-sm: 3rem;   /* 48px minimum */
--btn-md: 3.5rem; /* 56px for primary actions */
--btn-lg: 4rem;   /* 64px for critical actions */

/* Spacing scale (4px grid) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

**Grid System:**
- Mobile-first (design for 360px width)
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Generous padding on mobile (p-6 minimum for main content)

### Shadows & Effects
```css
/* Soft, warm shadows (not harsh) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Glow effects for critical states */
--glow-red: 0 0 20px rgba(255, 107, 107, 0.3);
--glow-green: 0 0 20px rgba(81, 207, 102, 0.3);
```

---

## Coding Conventions

### File Naming
```
Components: PascalCase.jsx
  ✅ Button.jsx, RiskOMeter.jsx, PatientCard.jsx
  ❌ button.jsx, risk-o-meter.jsx

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

## Firebase Integration Patterns

### Realtime Data Hook
```js
// hooks/usePatients.js
import { ref, onValue, off } from 'firebase/database';
import { useState, useEffect } from 'react';
import { database } from '../lib/firebase';

export const usePatients = (ashaWorkerId) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const patientsRef = ref(database, `patients`);
    
    const handleData = (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          // Filter by ASHA worker and sort by risk
          const patientList = Object.entries(data)
            .filter(([_, p]) => p.ashaWorkerId === ashaWorkerId)
            .map(([id, patient]) => ({ id, ...patient }))
            .sort((a, b) => b.riskScore - a.riskScore);
          
          setPatients(patientList);
        } else {
          setPatients([]);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    const handleError = (err) => {
      setError(err.message);
      setLoading(false);
    };
    
    // Subscribe to realtime updates
    onValue(patientsRef, handleData, handleError);
    
    // Cleanup on unmount
    return () => off(patientsRef);
  }, [ashaWorkerId]);
  
  return { patients, loading, error };
};
```

---

## API Integration Patterns (Future)

### ML Prediction Call
```js
// lib/api.js
export const predictRisk = async (patientData) => {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData)
    });
    
    if (!response.ok) {
      throw new Error('Prediction failed');
    }
    
    const result = await response.json();
    
    return {
      riskScore: result.riskScore,
      category: result.category,
      shapValues: result.explanation.factors
    };
  } catch (error) {
    console.error('Prediction error:', error);
    throw new Error('रिस्क विश्लेषण विफल रहा। कृपया फिर से कोशिश करें।');
  }
};
```

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

## Project Status (March 2026)

**Current Phase:** MVP Development for India Innovates 2026 Demo

**Demo Date:** March 28, 2026 at Bharat Mandapam

**Critical Deliverables:**
- ✅ Three working interfaces (ASHA, Mother, Doctor)
- ✅ Voice input demo (functional or simulated)
- ✅ Risk prediction visible
- ✅ SHAP explainability for doctors
- ✅ Real-time sync between interfaces
- ✅ Traffic light risk categorization

**Future Enhancements:**
- Offline mode (PWA + Service Workers)
- ABDM integration
- WhatsApp notifications
- Multilingual (Tamil, Telugu, Bengali)
- Amma chatbot (RAG-based health advisor)

---

**Last Updated:** March 9, 2026
**Maintained By:** Team मातृत्व AI (Markie, Shoury, Dhvani, Aditi)

---

*"Built for India. By Indians. Validated in Indian hospitals."*