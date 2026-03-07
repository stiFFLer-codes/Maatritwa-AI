# Maatritwa AI - System Architecture

This document provides an overview of the system architecture, data flow, and component relationships in Maatritwa AI.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAATRITWA AI                                   │
│                     Maternal Health Monitoring System                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   🏥 ASHA       │     │   🤱 Mother     │     │  👨‍⚕️ Doctor     │
│   Worker        │     │   Interface     │     │   Dashboard     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REACT FRONTEND (Vite)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Landing   │  │    ASHA     │  │   Mother    │  │       Doctor        │ │
│  │    Page     │  │ Dashboard   │  │  Dashboard  │  │     Dashboard       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
│         │         ┌──────┴──────┐         │                    │            │
│         │         │             │         │                    │            │
│         │         ▼             ▼         │                    │            │
│         │    ┌─────────┐   ┌─────────┐    │                    │            │
│         │    │ Patient │   │ Vitals  │    │                    │            │
│         │    │  Form   │   │  Form   │    │                    │            │
│         │    └────┬────┘   └────┬────┘    │                    │            │
│         │         │             │         │                    │            │
│         │         └──────┬──────┘         │                    │            │
│         │                │                │                    │            │
│         │                ▼                │                    │            │
│         │         ┌─────────────┐         │                    │            │
│         │         │   Risk      │         │                    │            │
│         │         │ Prediction  │         │                    │            │
│         │         │   Engine    │         │                    │            │
│         │         └──────┬──────┘         │                    │            │
│         │                │                │                    │            │
│         │                ▼                │                    │            │
│         │         ┌─────────────┐         │                    │            │
│         │         │   Risk      │         │                    │            │
│         │         │   Result    │         │                    │            │
│         │         └─────────────┘         │                    │            │
│         │                                 │                    │            │
└─────────┼─────────────────────────────────┼────────────────────┼────────────┘
          │                                 │                    │
          └─────────────────────────────────┴────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SHARED UI COMPONENTS                                 │
│                                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│   │  Button  │  │   Card   │  │ Patient  │  │ RiskO-   │  │  Header  │     │
│   │          │  │          │  │   Card   │  │  Meter   │  │  Footer  │     │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STYLE SYSTEM                                       │
│                                                                             │
│    Tailwind CSS  +  Custom Theme (Colors, Typography, Shadows)              │
│                                                                             │
│    Colors: Primary (#6C5CE7)  |  Secondary (#FF6B6B)                        │
│            Accent (#51CF66)   |  Surface (#FFF8F0)                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### ASHA Worker - Patient Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ASHA       │     │   Patient   │     │    API      │     │  Database   │
│  Worker     │────▶│    Form     │────▶│   Layer     │────▶│   Store     │
│  (UI)       │     │  (Input)    │     │ (Future)    │     │  (Future)   │
└─────────────┘     └──────┬──────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Form Data  │
                    │  - name     │
                    │  - age      │
                    │  - village  │
                    │  - phone    │
                    │  - gestation│
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Vitals    │
                    │    Form     │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Vitals Data│
                    │  - BP       │
                    │  - weight   │
                    │  - hemoglobin│
                    │  - complications│
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Risk Score  │
                    │ Calculation │
                    │  (Client)   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Display    │
                    │   Result    │
                    │  - Score    │
                    │  - Category │
                    │  - Advice   │
                    └─────────────┘
```

### Risk Prediction Algorithm Flow

```
                    ┌─────────────────┐
                    │   Vitals Input  │
                    │  (VitalsForm)   │
                    └────────┬────────┘
                             │
                             ▼
            ┌────────────────────────────────┐
            │     Risk Calculation Engine    │
            │      (AshaDashboard.jsx)       │
            └────────────────┬───────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Hemoglobin   │ │    Weight    │ │Blood Pressure│
    │   < 9 ?      │ │   < 45 ?     │ │  >= 140 ?    │
    │  +40 pts     │ │   +20 pts    │ │   +20 pts    │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Total Score   │
                   │   (0 - 100)    │
                   └───────┬────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │     Categorization Logic     │
            ├──────────────────────────────┤
            │  Score <= 40  →  Safe        │
            │  Score <= 60  →  Monitor     │
            │  Score <= 80  →  Elevated    │
            │  Score > 80   →  Critical    │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │       RiskOMeter Display     │
            │  ┌────────────────────────┐  │
            │  │    Animated Gauge      │  │
            │  │   - Score (0-100)      │  │
            │  │   - Color indicator    │  │
            │  │   - Category badge     │  │
            │  └────────────────────────┘  │
            └──────────────────────────────┘
```

---

## 📁 Component Hierarchy

```
App.jsx (Router)
│
├── Landing.jsx
│   ├── Header.jsx
│   ├── HeroIllustration.jsx
│   ├── Card.jsx / CardHeader / CardContent
│   ├── Button.jsx
│   └── Footer.jsx
│
├── AshaDashboard.jsx
│   ├── Button.jsx
│   ├── PatientForm.jsx
│   │   └── Card.jsx
│   ├── VitalsForm.jsx
│   │   └── Card.jsx
│   └── RiskResult.jsx
│       ├── Card.jsx
│       └── RiskOMeter.jsx
│
├── MotherDashboard.jsx (Planned)
│
└── DoctorDashboard.jsx (Planned)
```

---

## 🎨 State Management

Currently using **React useState** for local component state:

```javascript
// AshaDashboard.jsx - Main state container
const [riskScore, setRiskScore] = useState(null)
const [riskCategory, setRiskCategory] = useState(null)

// PatientForm.jsx - Form state
const [formData, setFormData] = useState({
  name: "",
  age: "",
  village: "",
  phone: "",
  gestationWeeks: ""
})

// VitalsForm.jsx - Vitals state
const [vitals, setVitals] = useState({
  bloodPressure: "",
  weight: "",
  hemoglobin: "",
  complications: ""
})
```

**Future Plans:**
- Context API for global user state
- React Query for server state management
- Local storage for offline data persistence

---

## 🌐 Routing Structure

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Landing.jsx` | Home page with role selection |
| `/asha` | `AshaDashboard.jsx` | ASHA worker dashboard |
| `/mother` | `MotherDashboard.jsx` | Mother interface |
| `/doctor` | `DoctorDashboard.jsx` | Doctor dashboard |

---

## 🎭 Animation Architecture

Using **Framer Motion** for consistent animations:

```
Animation Patterns:
├── Page Transitions
│   └── fadeIn, slideIn from sides
│
├── Component Animations
│   ├── Card hover: scale(1.02), y: -5
│   ├── Button tap: scale(0.95)
│   └── RiskOMeter: strokeDashoffset animation
│
└── Staggered Lists
    └── Landing cards with delay: i * 0.2s
```

---

## 📊 Future Backend Architecture (Planned)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                │
│              (Authentication & Rate Limiting)                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Patient      │    │  Risk         │    │  Notification │
│  Service      │    │  Prediction   │    │  Service      │
│  (Node.js)    │    │  (Python/ML)  │    │  (SMS/Email)  │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │    Redis    │  │   S3/Blob   │             │
│  │ (Primary)   │  │   (Cache)   │  │   (Files)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

1. **Input Validation**: All form inputs sanitized before processing
2. **HTTPS Only**: All API communications encrypted
3. **Role-Based Access**: Different views for ASHA/Doctor/Mother
4. **Data Privacy**: PHI (Protected Health Information) handling compliance

---

*Last Updated: March 2026*
