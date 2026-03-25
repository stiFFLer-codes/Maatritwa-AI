import { motion } from "framer-motion"

const RiskOMeter = ({ score = 0, category = "Safe" }) => {

  const colors = {
    Safe: "#51CF66",
    Monitor: "#FCC419",
    Elevated: "#FF922B",
    Critical: "#FF6B6B"
  }

  const color = colors[category]

  const radius = 88
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-sand rounded-3xl p-8 inline-block shadow-sm border border-warm-gray/40">

      <div className="relative w-48 h-48">

        <svg className="w-full h-full -rotate-90">

          <circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke="#E8DFD6"
            strokeWidth="16"
          />

          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-5xl font-bold text-charcoal"
          >
            {score}
          </motion.div>

          <div className="text-sm text-gray-500">
            / 100
          </div>

        </div>

      </div>

      <div
        className="mt-4 px-6 py-2 rounded-full text-white font-semibold text-center"
        style={{ backgroundColor: color }}
      >
        {category.toUpperCase()}
      </div>

    </div>
  )
}

export default RiskOMeter