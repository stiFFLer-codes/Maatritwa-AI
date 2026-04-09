import { useLanguage } from '../../i18n/LanguageContext';

// The four levels are the only place saturated colour appears in the product.
// Each pairing below clears WCAG AA on its own tint.
const CONFIG = {
  low:      { bg: 'bg-risk-tint-safe',     text: 'text-risk-safe',     dot: 'bg-risk-safe'     },
  moderate: { bg: 'bg-risk-tint-watch',    text: 'text-risk-watch',    dot: 'bg-risk-watch'    },
  high:     { bg: 'bg-risk-tint-high',     text: 'text-risk-high',     dot: 'bg-risk-high'     },
  critical: { bg: 'bg-risk-tint-critical', text: 'text-risk-critical', dot: 'bg-risk-critical' },
};

/**
 * @param {{ level: 'low'|'moderate'|'high'|'critical', size?: 'sm'|'md', showDot?: boolean }} props
 */
export default function RiskBadge({ level, size = 'sm', showDot = true }) {
  const { t } = useLanguage();
  const cfg = CONFIG[level] ?? CONFIG.low;
  const label = t(`riskLevels.${level}`);

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-[13px] px-2.5 py-1 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded font-semibold ${cfg.bg} ${cfg.text} ${sizes[size]}`}
    >
      {showDot && (
        <span
          className={`
            h-1.5 w-1.5 shrink-0 rounded-full ${cfg.dot}
            ${level === 'critical' ? 'animate-pulse-dot' : ''}
          `}
        />
      )}
      {label}
    </span>
  );
}
