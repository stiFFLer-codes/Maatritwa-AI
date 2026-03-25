import { useLanguage } from '../../i18n/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`flex items-center bg-blush rounded-full p-0.5 gap-0.5 ${className}`}>
      <button
        onClick={() => setLang('hi')}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          lang === 'hi'
            ? 'bg-saffron text-white shadow-soft'
            : 'text-muted hover:text-charcoal'
        }`}
      >
        हिंदी
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
          lang === 'en'
            ? 'bg-saffron text-white shadow-soft'
            : 'text-muted hover:text-charcoal'
        }`}
      >
        EN
      </button>
    </div>
  );
}
