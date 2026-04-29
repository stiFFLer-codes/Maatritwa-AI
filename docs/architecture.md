# Architecture

How Maatritwa AI is actually put together, as of the September 2026 revival pass.

This describes the archived state. Where something is unfinished it says so rather than describing the intention.

---

## The shape of it

Three React dashboards over one FastAPI service over one Supabase database. The frontend can also run with no backend at all, which is the default experience.

```
┌──────────────────────── React 19 / Vite / Tailwind ────────────────────────┐
│                                                                            │
│   /            /asha              /doctor            /mother               │
│   Landing      AshaDashboard      DoctorDashboard    MotherDashboard       │
│                     │                   │                  │               │
│                     └─────────┬─────────┘                  │               │
│                               ▼                            ▼               │
│                    services/api.js                  (no backend calls —    │
│                    apiFetch(path, opts)              hardcoded patient)    │
│                               │                                            │
│                 ┌─────────────┴──────────────┐                             │
│         reachable?                    unreachable / 5xx                    │
│                 │                            │                             │
└─────────────────┼────────────────────────────┼─────────────────────────────┘
                  ▼                            ▼
      ┌───────────────────────┐    ┌──────────────────────────┐
      │  FastAPI :8000        │    │  services/demoBackend.js │
      │  /asha /doctor /mother│    │  same routes, in memory  │
      └───────────┬───────────┘    │  seeded from 104 records │
                  │                └──────────────────────────┘
                  ▼
      ┌───────────────────────┐
      │  Supabase (Postgres)  │
      └───────────────────────┘
```

### The fallback is the point

`src/services/api.js` is the only place the frontend talks to a backend. It tries the real API first and switches to the in-browser demo backend on a network error or a 5xx, once per page session. A 4xx passes straight through — that is a real answer from a real server, and swallowing it would hide genuine bugs behind fake data.

`demoBackend.js` mirrors the Pydantic response models in `backend/app/routers/` field for field, so nothing downstream can tell the difference. It also mirrors the rule-based prediction functions in `backend/app/ml.py`, so demo predictions agree with real ones. `demoBackend.test.mjs` asserts both.

When the fallback is active, `TopBar` renders an amber strip. All three dashboards mount `TopBar`; the Landing page does not, and shows no data, so it needs none. The mother dashboard passes `alwaysDemo` because it has no backend integration at all and must never pass as live.

---

## The referral loop

The finished path through the system.

```
ASHA worker                      Backend                      Doctor
───────────                      ───────                      ──────
register mother   ──POST /asha/patients──────▶ patients
                                                  │
record vitals     ──POST /asha/patients/:id/vitals──▶ vitals
                                                  │
                  ──POST /asha/predict──────────▶ RiskPredictor
                                                  │  ├ ml_model.pkl if present
                                                  │  └ else rules in ml.py
                                                  ▼
                                            risk_assessments
                                                  │
raise referral    ──POST /asha/referrals─────▶ referrals ──────▶ GET /doctor/referrals
                                                                        │
                                                  ┌─────────────────────┤
                                                  ▼                     ▼
                                        GET /doctor/referrals/:id   POST .../labs
                                        patient + vitals history    clinical_labs
                                        + labs + assessments             │
                                                                         ▼
                                                        PATCH .../status  accepted → resolved
```

A second path exists for mothers already on the register: `POST /asha/patients/:id/visits` records a follow-up visit, and `GET /asha/patients/:id/eclampsia-risk` reads the trend across visits. That endpoint refuses to answer below three recorded visits rather than guessing — `eligible: false` with the count so far.

---

## Data model

Eight tables in `backend/supabase/schema.sql`.

| Table | Holds |
|---|---|
| `users` | id, role (`asha`/`mother`/`doctor`), name, email, phone |
| `asha_profiles` / `mother_profiles` / `doctor_profiles` | role-specific detail, keyed to `users` |
| `patients` | a mother on an ASHA's register — name, age, weeks pregnant, village |
| `vitals` | one reading set: BP, haemoglobin, weight, symptoms, timestamp |
| `risk_assessments` | model output: level, score, flags, model version |
| `referrals` | ASHA → doctor, with status `pending`/`accepted`/`resolved` |
| `clinical_labs` | doctor-entered panel: SGOT, SGPT, platelets, creatinine, proteinuria |

`referrals` carries a check constraint tying `resolved_at` to `status = 'resolved'` in both directions, so the two cannot drift apart.

> `clinical_labs` was missing from `schema.sql` until September 2026, although `doctor.py` queried it and `migrations/004_create_views.sql` built views over it. Anyone who set the database up before then had failing lab endpoints. It is now defined.

---

## Risk logic

Two predictors, both in `backend/app/ml.py`, both with the same structure: load a pickled scikit-learn model if the file exists, otherwise fall back to explicit rules. **No `.pkl` ships with this repo, so the rules are what actually runs.**

### RiskPredictor

Rules, in order:

| Condition | Result |
|---|---|
| systolic ≥ 160, or diastolic ≥ 110, or Hb < 7 | `high` (0.90) |
| systolic ≥ 140, or diastolic ≥ 90, or Hb < 9 | `medium` (0.70) |
| any flag raised | `medium` (0.60) |
| otherwise | `low` (0.25) |

Flags are computed separately and travel with the prediction: `hypertensive_crisis`, `high_bp`, `severe_anemia`, `anemia`, `low_weight`, `teen_pregnancy`, `advanced_maternal_age`, `post_term`.

Two overrides apply after a model prediction: severe anaemia cannot read as `low`, and a hypertensive crisis forces `high`. These exist because a model trained on a small sample should not be trusted to override a threshold a clinician would act on unconditionally.

### EclampsiaPredictor

Reads a trend rather than a single visit. Needs three visits. Escalates on seizure history, repeated severe BP with symptoms, high mean pressures, or two or more flags.

### Vocabulary mismatch

The ASHA side speaks `low` / `medium` / `high`. The doctor side normalises to `safe` / `monitor` / `elevated` / `critical` in `_normalize_risk_level`. The frontend's `RISK_MAP` in `AshaDashboard.jsx` accepts both and collapses them to `low` / `moderate` / `high` / `critical` for display. Three vocabularies for one concept is a wart, left in place because changing it would touch every layer.

---

## Authentication

There isn't any.

`DEV_AUTH` defaults to `1`. In that mode `require_role(r)` returns a fixed demo user carrying role `r`, whatever the request. There is no token check and no login screen. The API is unauthenticated read/write against real patient tables.

`DEV_AUTH=0` restores Supabase bearer-token verification in `_decode_access_token` and `_ensure_user_row`. That path is intact but has not been exercised since March 2026.

The doctor router never had auth dependencies at all, in either mode.

---

## Frontend structure

```
src/
  App.jsx                  four routes, no layout wrapper
  pages/
    Landing.jsx            role chooser, hand-drawn SVG mandala illustration
    asha/AshaDashboard.jsx      patient list, registration, vitals, referral
    doctor/DoctorDashboard.jsx  referral inbox, detail drawer, labs
    mother/MotherDashboard.jsx  progress ring, fetal size, Amma chat
  components/shared/       Wordmark, TopBar, LanguageToggle, RiskBadge, RiskRendering
  services/
    api.js                 backend call + demo fallback
    demoBackend.js         in-browser stand-in
    ammaChat.js            Amma chat, offline, cited replies
  data/                    clinicalPatients.json, modelMetrics.json, rule tables
  i18n/                    LanguageContext + Hindi/English strings
```

The dashboards are large single files — `AshaDashboard.jsx` is around 2,000 lines with its sub-components inlined. That is how they were written under a demo deadline and they have not been decomposed.

A September 2026 pass deleted a parallel component library — `Button`, `Card`, `Badge`, `RiskOMeter`, `PatientCard`, `Header`, `Footer`, `HeroIllustration` and three form components — that looked like the design system but was imported by nothing. What is listed above is what actually renders.

---

## Design system

One rule governs colour: **chroma is a clinical signal.**

| Family | Means | Where |
|---|---|---|
| warm ramp (`risk-safe` → `risk-critical`) | the patient's state | badges, spines, the risk ladder |
| cool (`action`, a deep Prussian ink-blue) | something you can act on | buttons, links, focus |
| ink on warm paper | everything else | text, hairlines, structure, the demo banner |

Nothing decorative is coloured. An alarm that competes with ornament stops reading as an alarm — the same argument the paper makes about rendering an uncertain prediction as a red light, applied to the interface. Every foreground/background pairing clears WCAG AA on both paper and card.

Type is one superfamily in three roles: **IBM Plex Sans** for Latin, **IBM Plex Sans Devanagari** for Hindi, **IBM Plex Mono** for clinical numbers. Plex Sans carries no Devanagari, so Hindi falls through to its matched sibling automatically — bilingual by font fallback, with no per-string language class anywhere in the app. There is no separate display face; headings are separated by weight and tracking, because a screen read at arm's length in daylight wants one voice.

Two structural devices carry most of the layout. `.spine` puts a risk-coloured band down the leading edge of a record, the way the Mother and Child Protection card these workers already carry is banded. `.tnum` sets a value in the mono face with tabular figures, so a column of blood pressures lines up. Full tokens and the rules for extending them are in `frontend/src/CLAUDE.md`.

### The landing signature

`components/shared/RiskRendering.jsx` is the landing page's hero and its role chooser at once. It takes one visit — blood pressure, haemoglobin, gestation week — scores it once, and shows the three renderings side by side. Toggling between a clear case (margin 0.85) and a borderline one (0.499 against 0.487, margin 0.012) derates the mother's panel from red to amber while the doctor's keeps the raw posterior. The three panels are deliberately unequal in width and density: the inequality is the content.

### Amma

There is no language model here, and no network call. The chat used to proxy to the Sarvam AI API; that path was removed when the project was archived — a key shipped in a browser bundle is public to every visitor, and the curated replies were carrying the demo regardless.

What runs now is four layers in `ammaChat.js`, tried in order:

1. **Emergency keywords** — bleeding, seizures, loss of fetal movement and similar, in Hindi and English, short-circuit to a fixed "go to hospital now" message. This runs before anything else.
2. **Curated topic replies** — eight topics (pain, diet, anxiety, fetal growth, visits, medication, sleep, general), each in Amma's voice and each carrying a WHO, ICMR or FOGSI citation.
3. **Knowledge base lookup** — `searchKnowledge()` over `clinicalKnowledgeBase.js`, returning the guideline fact itself with its citation. This covers topics the eight curated replies miss.
4. **Fallback** — defer the question to the ASHA worker or doctor.

Every answer is a fixed string from this repository. That is a real limitation — it cannot answer anything unanticipated — and it is also why the chat can never fabricate clinical advice.

Layer 1 strips "blood pressure", "blood test", "blood group", "blood report" and "blood sugar" before
scanning, because the bare keyword `blood` otherwise fired the hospital alarm on the most routine
question a pregnant woman asks. An alarm that goes off on ordinary questions stops being read as an
alarm — the same argument the paper makes about rendering an uncertain prediction as a red light.

Voice input is real, not a mock: `MotherDashboard.jsx` uses the browser's Web Speech API with
`lang = 'hi-IN'`. It is Chromium-only, so the mic button is hidden entirely where the API is absent
rather than sitting there doing nothing. There is no speech *output* — the replies are text only,
which is the accessibility gap the README names.

---

## Known divergences between code and schema

The API accepts and returns a richer patient record than the database can store. Documented rather than fixed, because fixing it means writing a migration nobody will run.

**Columns the code expects that no migration creates:**

| Referenced in | Column | Table it would live on |
|---|---|---|
| `PatientCreateRequest`, `PatientInfo`, `migrations/004` | `gravida`, `parity` | `patients` |
| `PatientCreateRequest`, `PatientInfo` | `height_cm`, `diabetic_history` | `patients` |
| `PatientCreateRequest` | `blood_group`, `lmp_date`, `edd_date`, `expected_del_wks`, `veg_nonveg`, `has_addiction`, `addiction_notes` | `patients` |
| `VitalsCreateRequest`, `VitalsResponse`, `migrations/004` | `pulse_rate` | `vitals` |
| `ExistingVisitCreateRequest` | `weeks_pregnant` | `vitals` |

The practical consequences:

- **`migrations/004_create_views.sql` cannot run against this schema.** It selects `p.gravida`, `p.parity` and `lv.pulse_rate`, none of which exist. Run `schema.sql` and skip 004 unless you add the columns first. (It also reads `clinical_labs`, which was missing entirely until September 2026.)
- Fields the ASHA registration form collects are silently dropped on write. The form asks for gravida, parity and diabetic history; the row that lands in `patients` has none of them.
- `PatientResponse` declares `risk_level`, `risk_score`, `blood_pressure_sys`, `last_visit_date` and the three count fields, none of which are columns on `patients` either — they are assembled per request by the router from `vitals`, `risk_assessments` and `referrals`.

The demo backend stores everything the API models declare, so **the demo shows fields the real database would drop.** That gap flatters the demo, and is worth knowing before reading the ASHA screen as evidence that the persistence layer works.
