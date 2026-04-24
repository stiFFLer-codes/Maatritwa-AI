/**
 * Smoke test for the landing page and the signature component on it.
 *
 *   npm run test:ui
 *
 * Renders the real components to a string and checks that the thesis actually
 * reaches the page in both languages. It catches the failure that matters here
 * — a missing token, a bad import, a translation key that resolves to itself —
 * without pulling in a test framework or a headless browser.
 */

import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext.jsx';
import { translations } from '../i18n/translations.js';
import Landing from './Landing.jsx';
import AshaDashboard from './asha/AshaDashboard.jsx';
import DoctorDashboard from './doctor/DoctorDashboard.jsx';
import MotherDashboard from './mother/MotherDashboard.jsx';

// `window` and `document` are stubbed by a --banner in the npm script, because
// MotherDashboard reads Web Speech API support at module scope and bundled
// imports evaluate before anything in this file does.

const html = renderToStaticMarkup(
  <MemoryRouter>
    <LanguageProvider>
      <Landing />
    </LanguageProvider>
  </MemoryRouter>,
);

// ── The page renders at all ──────────────────────────────────────────────────
assert.ok(html.length > 2000, 'landing page rendered something substantial');

// ── Default language is Hindi, and it is real Devanagari, not a fallback key ──
assert.match(html, /मातृत्व AI/, 'the wordmark is present');
assert.match(html, new RegExp(translations.hi.landing.title), 'Hindi headline renders');
assert.ok(!html.includes('landing.title'), 'no unresolved translation keys leaked through');
assert.ok(!html.includes('landing.steps'), 'no unresolved nested translation keys');

// ── The signature: one reading, three renderings ─────────────────────────────
for (const panel of ['What the mother sees', 'What the ASHA worker sees', 'What the doctor sees']) {
  assert.ok(html.includes(panel), `${panel} panel is on the page`);
}

// It opens on the borderline case, which is the whole argument: the mother is
// shown amber where the doctor is shown the raw split.
assert.match(html, /0\.499/, 'the doctor sees the posterior');
assert.match(html, /0\.012/, 'the doctor sees the margin');
assert.match(html, /You need a check-up this week/, 'the mother is shown the derated wording');
assert.ok(!html.includes('Go to the hospital today'), 'the mother is not shown the red wording on a gated case');

// ── The three panels are the role chooser ────────────────────────────────────
for (const href of ['/mother', '/asha', '/doctor']) {
  assert.ok(html.includes(`href="${href}"`), `panel links to ${href}`);
}

// ── Honesty guarantees that must not quietly regress ─────────────────────────
assert.match(html, /Not a medical device/, 'the disclaimer is on the page');
assert.ok(!/4[-–]6 weeks/.test(html), 'the withdrawn "4-6 weeks before symptoms" claim stays gone');
assert.ok(!html.includes('AI-Powered'), 'the marketing pill stays gone');

// ── The three dashboards still render after a palette-wide change ───────────
// Effects do not run under static rendering, so each dashboard renders its
// initial, pre-fetch state. That is enough to catch the failure a sweeping
// token or component change actually causes: a bad import or a missing symbol.
const DASHBOARDS = [
  ['ASHA', AshaDashboard],
  ['doctor', DoctorDashboard],
  ['mother', MotherDashboard],
];

for (const [name, Dashboard] of DASHBOARDS) {
  const markup = renderToStaticMarkup(
    <MemoryRouter>
      <LanguageProvider>
        <Dashboard />
      </LanguageProvider>
    </MemoryRouter>,
  );
  assert.ok(markup.length > 500, `${name} dashboard rendered`);
  assert.ok(!markup.includes('undefined'), `${name} dashboard has no undefined leaking into markup`);
}

console.log('landing self-check: all assertions passed');
