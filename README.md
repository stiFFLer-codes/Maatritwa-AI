# मातृत्व AI (Maatritwa AI)

> An AI-powered ecosystem for comprehensive maternal health monitoring, designed to empower ASHA workers, mothers, and doctors with intelligent risk prediction.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-EA4C89?logo=framer)](https://www.framer.com/motion/)

---

## 🌟 Vision

Every mother deserves a healthy pregnancy and safe delivery. **Maatritwa AI** bridges the gap between rural healthcare accessibility and modern medical technology by providing:

- **Real-time risk assessment** for pregnant women
- **Early detection** of high-risk pregnancies
- **Seamless coordination** between ASHA workers, doctors, and mothers
- **Accessible healthcare insights** in local languages

---

## 👥 Target Users

| Role | Purpose |
|------|---------|
| 🏥 **ASHA Workers** | Register patients, record vitals, and generate AI-powered risk predictions during field visits |
| 🤱 **Mothers** | Track pregnancy health, understand risk levels, and receive personalized care recommendations |
| 👨‍⚕️ **Doctors** | Monitor patient alerts, review high-risk cases, and provide timely interventions |

---

## ✨ Key Features

### 🩺 Risk Assessment Engine
- Intelligent scoring based on vital parameters (hemoglobin, blood pressure, weight)
- Four-tier risk categorization: **Safe | Monitor | Elevated | Critical**
- Visual Risk-O-Meter with animated indicators

### 📱 Multi-Role Dashboards
- **ASHA Dashboard**: Patient registration, vitals entry, instant risk prediction
- **Mother Dashboard**: Health tracking, risk visibility, educational resources *(in development)*
- **Doctor Dashboard**: Case review, alerts management, patient monitoring *(in development)*

### 🎨 User Experience
- Clean, accessible UI with warm, calming color palette
- Hindi language support for rural accessibility
- Smooth animations powered by Framer Motion
- Responsive design for tablets and mobile devices

---

## 🏗️ Project Structure

```
Maatritwa-AI/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   ├── ml/
│   ├── data/
│   └── supabase/
├── docs/
│   └── architecture.md    # System architecture & flowcharts
└── SETUP.md               # Detailed setup instructions
```

---

## 🚀 Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd Maatritwa-AI

# 2. Install frontend dependencies
cd frontend
npm install

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173 in your browser
```

For detailed setup instructions, see [SETUP.md](./SETUP.md).

---

## 📊 Risk Calculation Logic

The current risk assessment algorithm considers:

| Parameter | Threshold | Risk Impact |
|-----------|-----------|-------------|
| Hemoglobin | < 9 g/dL | +40 points |
| Weight | < 45 kg | +20 points |
| Blood Pressure | ≥ 140 mmHg | +20 points |

**Risk Categories:**
- 🟢 **Safe** (0-40): Continue routine monitoring
- 🟡 **Monitor** (41-60): Schedule additional checkups
- 🟠 **Elevated** (61-80): Doctor consultation recommended
- 🔴 **Critical** (81-100): Immediate medical attention required

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, React Router 7 |
| **Styling** | Tailwind CSS 3 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Build Tool** | Vite 7 |
| **Linting** | ESLint 9 |

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Landing page with role selection
- [x] ASHA worker dashboard
- [x] Patient registration form
- [x] Vitals input form
- [x] Basic risk prediction algorithm
- [x] Risk-O-Meter visualization
- [x] PatientCard component with risk indicators

### 🔄 In Progress
- [ ] Doctor dashboard with case management
- [ ] Mother dashboard with health tracking
- [ ] Backend API integration
- [ ] Multi-language support (Hindi, English)

### 📋 Planned
- [ ] AI/ML model for advanced risk prediction
- [ ] SMS notifications for high-risk alerts
- [ ] Offline-first PWA capability
- [ ] Data analytics dashboard for health officials

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 💙 Acknowledgments

- Dedicated to all ASHA workers serving rural communities
- Inspired by the mission to reduce maternal mortality rates
- Built with care for those who care for mothers

---

<p align="center">
  <strong>Made with ❤️ for every mother's journey</strong>
</p>
