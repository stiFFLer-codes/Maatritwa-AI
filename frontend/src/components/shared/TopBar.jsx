import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function TopBar({ showBack = true, rightSlot = null }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-sm border-b border-blush shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="justify-self-start min-w-[96px]">
          {showBack ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-muted hover:text-terracotta transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">{t('back')}</span>
            </button>
          ) : null}
        </div>

        <span className="font-serif text-lg font-semibold text-charcoal tracking-tight justify-self-center">
          मातृत्व AI
        </span>

        <div className="justify-self-end min-w-[96px] flex justify-end">
          {rightSlot ?? <LanguageToggle />}
        </div>
      </div>
    </div>
  );
}
