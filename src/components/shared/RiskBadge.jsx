import { useLanguage } from '../../i18n/LanguageContext';

const CONFIG = {
  low:      { bg: 'bg-sage/15',          text: 'text-sage',          dot: 'bg-sage',          border: 'border-sage/30'          },
  moderate: { bg: 'bg-amber-alert/10',   text: 'text-amber-alert',   dot: 'bg-amber-alert',   border: 'border-amber-alert/30'   },
  high:     { bg: 'bg-terracotta/10',    text: 'text-terracotta',    dot: 'bg-terracotta',    border: 'border-terracotta/30'    },
  critical: { bg: 'bg-rose-critical/10', text: 'text-rose-critical', dot: 'bg-rose-critical', border: 'border-rose-critical/30' },
};

/**
 * @param {{ level: 'low'|'moderate'|'high'|'critical', size?: 'sm'|'md', showDot?: boolean }} props
 */
export default function RiskBadge({ level, size = 'sm', showDot = true }) {
  const { t } = useLanguage();
  const cfg = CONFIG[level] ?? CONFIG.low;
  const label = t(`riskLevels.${level}`);

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3.5 py-1 gap-2',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-semibold
        ${cfg.bg} ${cfg.text} ${cfg.border} ${sizes[size]}
      `}
    >
      {showDot && (
        <span
          className={`
            rounded-full flex-shrink-0
            ${cfg.dot}
            ${level === 'critical' ? 'animate-pulse-dot' : ''}
            ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}
          `}
        />
      )}
      {label}
    </span>
  );
}
