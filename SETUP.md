# Setup

This project is archived. These instructions are kept so it still runs.

There are two ways to run it, and **the first is the one you want.**

---

## Option A — frontend only (recommended)

No backend, no database, no accounts, no API keys.

**Prerequisites:** Node.js 18+ and npm 9+.

```bash
git clone https://github.com/stiFFLer-codes/Maatritwa-AI.git
cd Maatritwa-AI/frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

All three dashboards work. When no backend answers on `localhost:8000`, `src/services/api.js` falls back to `src/services/demoBackend.js`, an in-browser stand-in that serves the same endpoints in the same shapes as the real API. Every screen shows an amber strip saying the data is demo data.

The demo dataset is 104 pseudonymised clinical records with three generated visits each, so the visit-trend and eclampsia-gate features have something to work on. State lives for one page session — raise a referral on `/asha`, switch to `/doctor`, and it is there; reload and everything resets to seed.

### Scripts

Run from `frontend/`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint — reports pre-existing findings, see below |
| `npm test` | Three self-checks: demo backend, Amma chat, and page rendering |

`npm run lint` is not clean: 16 findings, down from 29. Seven are a config gap rather than a defect —
the flat config has no `eslint-plugin-react`, so `no-unused-vars` cannot see identifiers used only
inside JSX and flags `motion` and `Icon` in every file that animates something. The rest are unused
locals in the two large dashboards. Adding a plugin to silence the first group was not worth a new
dependency in an archived repo.

`npm test` bundles three checks with the esbuild that already ships inside Vite and runs them on node. There is no test framework and no new dependency.

| Check | Guards |
|---|---|
| `test:demo` | The in-browser API stand-in returns the shapes the dashboards expect |
| `test:amma` | The chat routes emergencies before anything else, and a "blood pressure" question does not trip the bleeding alarm |
| `test:ui` | All four pages render, in Hindi, with no unresolved translation keys and no withdrawn claims |

`test:ui` renders the real components with `react-dom/server`. Effects do not run, so each dashboard renders its initial pre-fetch state — enough to catch the failure a sweeping design or token change actually causes.

### Optional frontend config

Copy `frontend/.env.example` to `frontend/.env`. Every value is optional.

- `VITE_API_BASE_URL` — where the backend lives. Default `http://localhost:8000`.
- `VITE_DEMO_MODE=1` — always use demo data, even if a backend is running.

> There is no API key of any kind. The "Amma" chat on `/mother` used to call a hosted LLM; that was removed when the project was archived, and it now answers entirely offline from the curated WHO/ICMR/FOGSI replies in `src/services/ammaChat.js`. Nothing in this repo talks to a third-party service.

---

## Option B — with the real backend

Only worth doing if you specifically want the FastAPI + Supabase path. It needs **your own Supabase project**; the original is gone and no credentials ship with this repo.

**Prerequisites:** Python 3.11+, plus a free Supabase account.

### 1. Install

```bash
cd Maatritwa-AI
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 2. Create the database

Create a Supabase project, open the SQL editor, and run `backend/supabase/schema.sql`. That is the whole database — tables, constraints, indexes and row-level security.

> **Skip `backend/supabase/migrations/`.** Those files were written against an earlier shape of the schema. `004_create_views.sql` in particular selects `patients.gravida`, `patients.parity` and `vitals.pulse_rate`, which no migration ever creates, so it fails outright. `schema.sql` is self-contained and is what the API actually needs. See the divergences section of [docs/architecture.md](./docs/architecture.md).

### 3. Configure

```bash
cp backend/.env.example backend/.env
```

Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your project's API settings.

> ⚠️ **`DEV_AUTH` defaults to `1`, which means there is no authentication at all.** Every request is served as a fixed demo user for whichever role the endpoint asks for. That is how the project was demoed. Do not put this on a public address. Setting `DEV_AUTH=0` restores real Supabase token verification, which has not been exercised since March 2026 — treat it as untested.

### 4. Seed and run

```bash
python backend/seed_data.py
uvicorn app.main:app --reload --app-dir backend
```

API docs at <http://localhost:8000/docs>.

With the backend up, the frontend uses it automatically and the demo banner disappears. If the backend returns 5xx — most often missing Supabase credentials — the frontend falls back to demo data and logs why to the console.

### 5. Models (optional)

No `.pkl` model artifacts are committed. Without them both predictors use the rule-based fallbacks in `backend/app/ml.py`, which is the intended default.

The training scripts in `backend/ml/` need the raw clinical spreadsheet, which is **not distributed** — see the Data section of the README. Without it, `train_xgboost.py` and `process_clinical_data.py` will exit at the missing-file check. `generate_synthetic_data.py` runs on its own and only writes synthetic rows.

---

## Troubleshooting

**Dashboards are empty or erroring.** They should never be — the fallback covers a missing backend. Check the browser console for a `[maatritwa]` line saying which path it took. Force the demo path with `VITE_DEMO_MODE=1`.

**Port 5173 in use.** `npm run dev -- --port 3000`.

**Backend returns 500 on everything.** Supabase credentials are missing or wrong. Check `backend/.env`. The frontend will have switched to demo data already.

**`npm install` fails.** `npm cache clean --force`, delete `node_modules` and `package-lock.json`, reinstall.

**Tailwind styles missing.** Confirm `src/index.css` starts with the three `@tailwind` directives, then restart the dev server.
