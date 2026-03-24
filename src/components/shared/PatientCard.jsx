import { motion } from "framer-motion";

const ACTION_MESSAGES = {
  monitor: "→ Schedule visit within 1 week",
  elevated: "→ Schedule checkup within 48 hours",
  critical: "→ Refer to PHC immediately",
};

const RISK_DOT_COLORS = {
  safe: "bg-risk-safe",
  monitor: "bg-risk-monitor",
  elevated: "bg-risk-elevated",
  critical: "bg-risk-critical",
};

const RISK_TEXT_COLORS = {
  safe: "text-risk-safe",
  monitor: "text-risk-monitor",
  elevated: "text-risk-elevated",
  critical: "text-risk-critical",
};

export default function PatientCard({ patient, onClick, category }) {
  const { name, age, gestationWeek, riskScore } = patient;

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="bg-sand rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex items-center gap-4">
        {/* Risk dot */}
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${RISK_DOT_COLORS[category]}`}
        />

        {/* Patient info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg text-on-surface truncate">
            {name}
          </p>
          <p className="text-sm text-on-surface-variant">
            {age} yrs • Week {gestationWeek}
          </p>
        </div>

        {/* Risk score */}
        <div className="flex-shrink-0 text-right">
          <p className={`text-3xl font-bold ${RISK_TEXT_COLORS[category]}`}>
            {riskScore}
          </p>
          <p className="text-xs text-on-surface-variant">Risk</p>
        </div>
      </div>

      {/* Action message for non-safe categories */}
      {category !== "safe" && ACTION_MESSAGES[category] && (
        <p className={`mt-3 text-sm font-medium ${RISK_TEXT_COLORS[category]}`}>
          {ACTION_MESSAGES[category]}
        </p>
      )}
    </motion.div>
  );
}
