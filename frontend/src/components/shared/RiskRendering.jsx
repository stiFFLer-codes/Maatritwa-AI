import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * One reading, three renderings.
 *
 * This is the argument the project exists to make: a risk model produces a
 * single number, but that number cannot be shown the same way to a mother, an
 * ASHA worker and a clinician, because a false alarm costs each of them
 * something different. When the model is on a knife edge, the highest-severity
 * rendering is withheld from the reader with the least power to discount it —
 * red is derated to amber, never to green.
 *
 * The three panels are also the role chooser. Pick the rendering that is yours.
 */

const RISK = {
  safe:     { fg: 'text-risk-safe',     spine: 'spine-safe'     },
  moderate: { fg: 'text-risk-watch',    spine: 'spine-moderate' },
  high:     { fg: 'text-risk-high',     spine: 'spine-high'     },
  critical: { fg: 'text-risk-critical', spine: 'spine-critical' },
};

const CASES = {
  clear: {
    id: 'clear',
    tab: 'A clear case',
    reading: [
      ['BP', '168/112', 'mmHg'],
      ['Hb', '8.4', 'g/dL'],
      ['Week', '34', ''],
    ],
    posterior: { top: ['Critical', 0.91], next: ['High', 0.06] },
    margin: 0.85,
    gated: false,
    mother: {
      level: 'critical',
      headline: 'Go to the hospital today.',
      sub: 'Take someone with you. Your ASHA didi has been told.',
    },
    asha: {
      level: 'critical',
      headline: 'Critical — refer now',
      flags: ['Hypertensive crisis', 'Severe anaemia'],
      note: 'Model and rules agree. Nothing to hedge.',
    },
    doctor: {
      verdict: 'Render at full severity',
      note: 'The margin clears the gate, so every channel sees the top signal.',
    },
  },
  borderline: {
    id: 'borderline',
    tab: 'A borderline case',
    reading: [
      ['BP', '148/96', 'mmHg'],
      ['Hb', '9.1', 'g/dL'],
      ['Week', '32', ''],
    ],
    posterior: { top: ['High', 0.499], next: ['Moderate', 0.487] },
    margin: 0.012,
    gated: true,
    mother: {
      level: 'moderate',
      headline: 'You need a check-up this week.',
      sub: 'Nothing is wrong right now. Your ASHA didi will visit and check again.',
    },
    asha: {
      level: 'high',
      headline: 'Elevated — refer, marked uncertain',
      flags: ['Raised BP', 'Mild anaemia'],
      note: 'The model split this case almost evenly. Refer, and say that it is close.',
    },
    doctor: {
      verdict: 'Below the gate — derate her channel only',
      note: 'You get the raw split. She gets amber, not red, and never green.',
    },
  },
};

function Reading({ reading }) {
  return (
    <dl className="flex flex-wrap items-baseline gap-x-7 gap-y-2">
      {reading.map(([k, v, unit]) => (
        <div key={k} className="flex items-baseline gap-2">
          <dt className="label">{k}</dt>
          <dd className="tnum text-base font-medium text-ink">
            {v}
            {unit ? <span className="ml-1 text-xs font-normal text-ink-soft">{unit}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The two-way split, with the abstention gate read off it. */
function Posterior({ posterior, margin, gated }) {
  const rows = [
    [posterior.top[0], posterior.top[1], true],
    [posterior.next[0], posterior.next[1], false],
  ];
  return (
    <div className="space-y-2">
      {rows.map(([label, p, isTop]) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="w-16 shrink-0 text-[11px] text-ink-soft">{label}</span>
          <div className="h-1.5 flex-1 rounded-full bg-ink-rule">
            <motion.div
              className={`h-full rounded-full ${isTop ? 'bg-ink' : 'bg-ink-strong'}`}
              initial={{ width: 0 }}
              animate={{ width: `${p * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="tnum w-11 shrink-0 text-right text-[11px] text-ink">{p.toFixed(3)}</span>
        </div>
      ))}
      <p className="pt-1 text-[11px] leading-relaxed text-ink-soft">
        Margin <span className="tnum text-ink">{margin.toFixed(3)}</span>
        <span className="mx-1.5 text-ink-strong">·</span>
        gate <span className="tnum text-ink">0.150</span>
        <span className="mx-1.5 text-ink-strong">·</span>
        <span className={gated ? 'font-medium text-risk-watch' : 'font-medium text-risk-safe'}>
          {gated ? 'abstains' : 'clears'}
        </span>
      </p>
    </div>
  );
}

function Panel({ label, to, cta, children }) {
  return (
    <div className="flex flex-col bg-card">
      <div className="border-b border-ink-rule px-5 py-2.5">
        <span className="label">{label}</span>
      </div>
      <div className="flex-1 px-5 py-5">{children}</div>
      <Link
        to={to}
        className="group flex items-center justify-between border-t border-ink-rule px-5 py-3.5 text-sm font-medium text-action transition-colors hover:bg-action-tint"
      >
        {cta}
        <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

export default function RiskRendering() {
  const [caseId, setCaseId] = useState('borderline');
  const c = CASES[caseId];

  return (
    <section aria-labelledby="rendering-heading" className="border border-ink-rule bg-paper">

      {/* ── The shared input ──────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 border-b border-ink-rule px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
        <div>
          <h2 id="rendering-heading" className="text-sm font-semibold text-ink">
            One reading, three renderings
          </h2>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-ink-soft">
            The same visit, scored once. What each person is shown depends on what a
            wrong alarm would cost them.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Example case"
          className="flex shrink-0 self-start rounded-md border border-ink-rule bg-card p-0.5 sm:self-auto"
        >
          {Object.values(CASES).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={caseId === opt.id}
              onClick={() => setCaseId(opt.id)}
              className={`cursor-pointer rounded px-3 py-2 text-[13px] font-medium transition-colors ${
                caseId === opt.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {opt.tab}
            </button>
          ))}
        </div>
      </header>

      <div className="border-b border-ink-rule bg-card px-5 py-4 sm:px-7">
        <Reading reading={c.reading} />
      </div>

      {/* ── The three renderings ─────────────────────────────────────────────
          Deliberately unequal. The mother's panel is widest and quietest, the
          doctor's narrowest and densest. The inequality is the content. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="grid gap-px bg-ink-rule md:grid-cols-[1.2fr_1fr_1fr]"
        >
          <Panel label="What the mother sees" to="/mother" cta="Open the mother's view">
            <div className={`spine ${RISK[c.mother.level].spine}`}>
              <p className="text-xl leading-snug text-ink sm:text-[1.375rem]">
                {c.mother.headline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.mother.sub}</p>
            </div>
            {c.gated ? (
              <p className="mt-5 border-t border-ink-rule pt-3 text-[11px] leading-relaxed text-ink-soft">
                Derated from <span className="font-medium text-risk-high">high</span> to a
                check-up — never to &ldquo;you are fine&rdquo;.
              </p>
            ) : null}
          </Panel>

          <Panel label="What the ASHA worker sees" to="/asha" cta="Open the ASHA register">
            <div className={`spine ${RISK[c.asha.level].spine}`}>
              <p className={`text-base font-semibold ${RISK[c.asha.level].fg}`}>
                {c.asha.headline}
              </p>
              <ul className="mt-3 space-y-1.5">
                {c.asha.flags.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px] text-ink">
                    <span className="h-1 w-1 shrink-0 rounded-full bg-ink-strong" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-ink-soft">{c.asha.note}</p>
          </Panel>

          <Panel label="What the doctor sees" to="/doctor" cta="Open the referral inbox">
            <Posterior posterior={c.posterior} margin={c.margin} gated={c.gated} />
            <p className="mt-4 border-t border-ink-rule pt-3 text-[12px] font-medium text-ink">
              {c.doctor.verdict}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{c.doctor.note}</p>
          </Panel>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
