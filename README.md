# मातृत्व AI (Maatritwa AI)

**A maternal-health referral prototype for rural India — ASHA worker to doctor, with the mother in the loop.**

> **Status: archived.** This was built for the India Innovates 2026 demo (Bharat Mandapam, 28 March 2026) and development stopped the day of the demo. It is preserved as a working prototype and as the origin of a research preprint, not as a maintained product. Nothing here has been used to care for a real patient.

---

## What it does

Rural antenatal care in India runs through the ASHA worker — a community health worker who visits mothers at home, records vitals on paper, and decides who needs a doctor. This prototype puts that chain on a screen, for all three people in it.

| Interface | What it does | State |
|---|---|---|
| **ASHA worker** `/asha` | Register a mother, record vitals across visits, get a risk level, raise a referral | Complete, backed by the API |
| **Doctor** `/doctor` | Work a referral inbox, read visit history and labs, add lab results, accept or resolve | Complete, backed by the API |
| **Mother** `/mother` | Pregnancy progress ring, week-by-week fetal development, "Amma" chat in Hindi | UI complete, **never wired to the backend** |

The ASHA→Doctor loop is the finished part: a referral raised on one screen appears on the other, with the patient's vitals trend and lab panel attached.

---

## Try it

No backend, no database, no API keys, no third-party services:

```bash
git clone https://github.com/stiFFLer-codes/Maatritwa-AI.git
cd Maatritwa-AI/frontend
npm install
npm run dev
```

Open <http://localhost:5173>. All three dashboards work immediately against an in-browser demo backend (`src/services/demoBackend.js`) that serves the same endpoints in the same shapes as the real API. A dark strip across the top of each dashboard says you are looking at demo data.

The landing page opens on the argument the project is about: one visit, scored once, rendered three ways. Switch it between a clear case and a borderline one and watch the mother's panel derate from red to amber while the doctor keeps the raw probabilities.

Running the real FastAPI backend is optional and needs your own Supabase project — see [SETUP.md](./SETUP.md).

```bash
npm test        # self-check for the demo backend
npm run build   # production build
```

---

## The paper this became

The prototype raised a question it could not answer, and that question became a preprint:

> **A Coin Flip Is Not a Red Light: Grading a Maternal-Health Risk Alarm for Mothers, Community Health Workers, and Clinicians**
> Maitreya Sapariya, Aditi Patil

When a risk model splits a case 0.487 against 0.499 between two adjacent risk levels, a clinician can read that margin and discount it. A mother handed a red alarm for the same prediction cannot. The paper's answer is to make the abstention decision part of the rendering: the highest-severity signal is withheld from the mother's channel when the model is on a knife edge, derating red to amber — never red to green, and amber still means *needs follow-up*.

- **Artifact repository:** [stiFFLer-codes/three-voices](https://github.com/stiFFLer-codes/three-voices)
- **Archived artifacts:** [10.5281/zenodo.22252076](https://doi.org/10.5281/zenodo.22252076)

`three-voices` is the clean, reproducible successor: one seed, five commands, every figure and table regenerating byte for byte. **If you are here from the paper, that is the repository you want.** This one is the messier applied prototype that came first, and it makes no claim the paper does not.

---

## Architecture

```
React 19 + Vite + Tailwind          FastAPI                    Supabase
┌─────────────────────────┐     ┌──────────────────┐     ┌──────────────┐
│  /asha    /doctor       │────▶│  /asha/*         │────▶│  patients    │
│  /mother  (mock only)   │     │  /doctor/*       │     │  vitals      │
│                         │     │  /mother/*       │     │  referrals   │
│  services/api.js        │     │                  │     │  risk_assess │
│    └─ falls back to ────┤     │  app/ml.py       │     │  clinical_labs│
│       demoBackend.js    │     │   ├ RiskPredictor│     └──────────────┘
│       when API is down  │     │   └ Eclampsia... │
└─────────────────────────┘     └──────────────────┘
```

Both predictors load a pickled scikit-learn model if one is present and fall back to explicit clinical rules if not. The rules are the honest default — no model artifacts ship with this repo.

More detail in [docs/architecture.md](./docs/architecture.md).

---

## What is not finished

Stated plainly, because the repo is archived and nobody is coming to fix these.

- **No authentication.** `DEV_AUTH=1` serves every request as a fixed demo user for whichever role the endpoint asks for. The API is unauthenticated read/write. Real Supabase token verification is still in `app/auth.py` behind `DEV_AUTH=0`, untested since March 2026.
- **The mother dashboard is a mock.** It renders a hardcoded patient. `/mother/*` endpoints exist on the backend and nothing calls them.
- **No model artifacts.** `.pkl` files are gitignored and were never committed, so every prediction path uses the rule-based fallback.
- **The mother's tier has no accessibility story.** Voice *input* works (Web Speech API, `hi-IN`, Chromium only) but there is no speech output, no captions, and no screen-reader path. Section 6.3 of the paper works through who that excludes.
- **The Amma chat has no language model.** It proxied to a hosted LLM until September 2026, when that
  path was removed — a key shipped in a browser bundle is public to every visitor. It now answers only
  from a fixed set of cited WHO/ICMR/FOGSI replies, so it cannot answer anything unanticipated.
- **No tests beyond three self-checks** (`demoBackend`, `ammaChat`, page rendering). No backend tests at all.
- **Hindi only.** The i18n layer supports Hindi and English; the ASHA card strings are English-only.

---

## Data

The model figures in this repo describe a student prototype. **They are not clinical validation.** `frontend/src/data/modelMetrics.json` carries a `caveats` block that should be read before any number in it — including a per-class labelling bug, corrected in September 2026, that had swapped the Normal and Mild Pre-Eclampsia rows and made minority-class detection look far better than it was.

`frontend/src/data/clinicalPatients.json` holds 104 records derived from data collected at a tertiary care hospital. Names were replaced with random draws from a fixed pool by `backend/ml/process_clinical_data.py` before publication. The records are included so the demo has realistic inputs. **They are not released for reuse, redistribution or secondary analysis.** The raw source spreadsheet is not distributed and is excluded by `.gitignore`.

This software is not a medical device. It does not diagnose, and no output from it should inform care for a real person.

---

## Repository layout

```
frontend/            React app — the part worth looking at
  src/pages/         Landing, ASHA, doctor, mother dashboards
  src/services/      api.js (real backend + fallback), demoBackend.js, ammaChat.js
  src/components/    Wordmark, TopBar, LanguageToggle, RiskBadge, RiskRendering
  src/data/          Pseudonymised clinical records, model metrics, rule tables
  src/i18n/          Hindi/English strings
backend/
  app/               FastAPI: routers, auth, Supabase client, model loading
  ml/                Training and data-prep scripts
  supabase/          schema.sql and migrations
docs/architecture.md
```

---

## License

Source code is MIT — see [LICENSE](./LICENSE). The clinical dataset is not covered by it; see the Data section above.

---

<p align="center"><em>Built for a demo. Kept for the paper.</em></p>
