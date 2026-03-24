const CATEGORY_COLORS = {
  safe: "bg-risk-safe",
  monitor: "bg-risk-monitor",
  elevated: "bg-risk-elevated",
  critical: "bg-risk-critical",
};

const CATEGORY_LABELS = {
  safe: "Safe",
  monitor: "Monitor",
  elevated: "Elevated",
  critical: "Critical",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2 text-base",
};

export default function Badge({ category, size = "md" }) {
  return (
    <span
      className={`inline-block rounded-full font-semibold uppercase text-white tracking-wide ${CATEGORY_COLORS[category]} ${SIZE_CLASSES[size]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
