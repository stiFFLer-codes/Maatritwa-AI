import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from '../components/shared/LanguageToggle';
import Wordmark, { Mark } from '../components/shared/Wordmark';
import RiskRendering from '../components/shared/RiskRendering';

const PAPER_REPO = 'https://github.com/stiFFLer-codes/three-voices';
const PAPER_DOI = 'https://doi.org/10.5281/zenodo.22252076';

export default function Landing() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

  // One orchestrated entrance, then the page holds still. Anything that keeps
  // moving after the reader has arrived is competing with the risk signal.
  const rise = (i) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 0.61, 0.36, 1] },
        };

  return (
    <div className="min-h-screen bg-paper">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-ink-rule bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[68rem] items-center justify-between px-5 sm:px-6">
          <Wordmark />
          <LanguageToggle />
        </div>
      </header>

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-[68rem] px-5 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <motion.p {...rise(0)} className="label">
            {t('landing.eyebrow')}
          </motion.p>

          <motion.h1
            {...rise(1)}
            className="mt-5 max-w-3xl text-ink"
            style={{ fontSize: 'clamp(2.125rem, 5.2vw, 3.5rem)' }}
          >
            {t('landing.title')}
          </motion.h1>

          <motion.p
            {...rise(2)}
            className="mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-ink-soft"
          >
            {t('landing.lead')}
          </motion.p>

          <motion.p
            {...rise(3)}
            className="mt-9 inline-flex items-start gap-2.5 border border-ink-rule bg-card px-3.5 py-2.5 text-[13px] text-ink-soft"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-strong" />
            {t('landing.demoNote')}
          </motion.p>
        </section>

        {/* ── The signature: one reading, three renderings ─────────────────── */}
        <motion.section {...rise(4)} className="mx-auto max-w-[68rem] px-5 sm:px-6">
          <RiskRendering />
        </motion.section>

        {/* ── The referral loop ────────────────────────────────────────────────
            Numbered because this genuinely is a sequence: the order is the
            information. A mother cannot be referred before she is registered. */}
        <section className="mx-auto max-w-[68rem] px-5 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <h2 className="text-2xl text-ink sm:text-[1.75rem]">{t('landing.loopTitle')}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{t('landing.loopLead')}</p>
          </div>

          <ol className="mt-12 grid gap-px border border-ink-rule bg-ink-rule md:grid-cols-3">
            {['one', 'two', 'three'].map((key, i) => (
              <li key={key} className="bg-card px-6 py-7">
                <span className="tnum text-[13px] font-medium text-ink-strong">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-base text-ink">{t(`landing.steps.${key}.title`)}</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
                  {t(`landing.steps.${key}.desc`)}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Honesty + the paper ──────────────────────────────────────────── */}
        <section className="border-y border-ink-rule bg-card">
          <div className="mx-auto grid max-w-[68rem] gap-px bg-ink-rule px-0 md:grid-cols-2">
            <div className="bg-card px-5 py-12 sm:px-6 sm:py-16">
              <h2 className="text-xl text-ink">{t('landing.statusTitle')}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                {t('landing.statusBody')}
              </p>
            </div>

            <div className="bg-card px-5 py-12 sm:px-6 sm:py-16">
              <h2 className="text-xl text-ink">{t('landing.paperTitle')}</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                {t('landing.paperBody')}
              </p>
              <p className="mt-5 max-w-md border-l-2 border-ink-strong pl-4 text-[14px] leading-relaxed text-ink">
                A Coin Flip Is Not a Red Light: Grading a Maternal-Health Risk Alarm for
                Mothers, Community Health Workers, and Clinicians
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                <a
                  href={PAPER_REPO}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
                >
                  {t('landing.paperCta')}
                  <ArrowUpRight
                    size={15}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </a>
                <a
                  href={PAPER_DOI}
                  target="_blank"
                  rel="noreferrer"
                  className="tnum text-[13px] text-ink-soft hover:text-ink hover:underline"
                >
                  10.5281/zenodo.22252076
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-[68rem] px-5 py-12 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2.5 text-ink">
            <Mark size={22} />
            <span className="text-sm font-medium">मातृत्व AI</span>
          </div>
          <p className="max-w-md text-[12px] leading-relaxed text-ink-soft">
            Not a medical device. It does not diagnose, and no output from it should
            inform care for a real person. Demo records are pseudonymised research data.
          </p>
        </div>
      </footer>
    </div>
  );
}
