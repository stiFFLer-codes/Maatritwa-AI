import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { Mark } from './Wordmark';
import { isDemoMode } from '../../services/api';

/**
 * @param {boolean} [alwaysDemo] Force the demo strip on for a page that has no
 *   backend integration at all, so it never silently passes as live.
 */
export default function TopBar({ showBack = true, rightSlot = null, alwaysDemo = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // isDemoMode() flips after the first failed backend call. This re-renders with
  // its parent, so the strip appears as soon as the fallback kicks in.
  const showDemo = alwaysDemo || isDemoMode();

  return (
    <div className="sticky top-0 z-40 border-b border-ink-rule bg-paper/92 backdrop-blur">
      <div className="mx-auto grid h-14 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="min-w-[88px] justify-self-start">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex cursor-pointer items-center gap-1.5 rounded px-1 py-1 text-ink-soft transition-colors hover:text-ink"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">{t('back')}</span>
            </button>
          ) : null}
        </div>

        <span className="flex items-center gap-2 justify-self-center text-ink">
          <Mark size={20} />
          <span className="text-[15px] font-semibold tracking-tight">मातृत्व AI</span>
        </span>

        <div className="flex min-w-[88px] justify-end justify-self-end">
          {rightSlot ?? <LanguageToggle />}
        </div>
      </div>

      {showDemo ? (
        <div className="bg-ink">
          <p className="mx-auto flex max-w-6xl items-start gap-2.5 px-4 py-2 text-[12px] leading-relaxed text-paper sm:px-6 lg:px-8">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-paper/70" />
            <span>
              <strong className="font-semibold">Demo data.</strong> No backend connected.
              These are pseudonymised research records, not live patients, and nothing
              here is a diagnosis or medical advice.
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
