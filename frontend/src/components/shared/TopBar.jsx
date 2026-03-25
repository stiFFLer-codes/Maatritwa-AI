import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../i18n/AuthContext';
import LanguageToggle from './LanguageToggle';

export default function TopBar({ showBack = true, rightSlot = null }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

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

        {/* Right — language toggle + sign out (or custom slot) */}
        {rightSlot ?? (
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-terracotta hover:bg-blush/60 transition-colors"
              aria-label="Sign out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
