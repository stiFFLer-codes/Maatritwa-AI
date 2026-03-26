import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function TopBar({ showBack = true, rightSlot = null }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-sm border-b border-blush shadow-soft">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left — back button */}
        {showBack ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-muted hover:text-terracotta transition-colors min-w-[60px]"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
        ) : (
          <div className="min-w-[60px]" />
        )}

        {/* Center — brand */}
        <span className="font-serif text-lg font-semibold text-charcoal tracking-tight">
          मातृत्व AI
        </span>

        {/* Right — language toggle or custom slot */}
        {rightSlot ?? <LanguageToggle />}
      </div>
    </div>
  );
}
