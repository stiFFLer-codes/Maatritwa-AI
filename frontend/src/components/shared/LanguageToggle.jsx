import { useLanguage } from '../../i18n/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-orange-200 bg-white/90 p-1 shadow-sm backdrop-blur ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang('hi')}
        aria-pressed={lang === 'hi'}
        className={`min-w-[4.75rem] rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
          lang === 'hi'
            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-orange-50 hover:text-gray-900'
        }`}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`min-w-[4.75rem] rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
          lang === 'en'
            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-orange-50 hover:text-gray-900'
        }`}
      >
        English
      </button>
    </div>
  );
}
