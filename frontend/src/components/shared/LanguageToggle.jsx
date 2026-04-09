import { useLanguage } from '../../i18n/LanguageContext';

const OPTIONS = [
  { code: 'hi', label: 'हिंदी', name: 'हिंदी में देखें' },
  { code: 'en', label: 'EN', name: 'View in English' },
];

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex items-center rounded-md border border-ink-rule bg-card p-0.5 ${className}`}
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            lang={opt.code}
            onClick={() => setLang(opt.code)}
            aria-pressed={active}
            aria-label={opt.name}
            className={`cursor-pointer rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
