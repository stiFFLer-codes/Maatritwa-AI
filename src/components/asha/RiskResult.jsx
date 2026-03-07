import Card from "../shared/Card"
import RiskOMeter from "../shared/RiskOMeter"

function RiskResult({ score, category }) {

  const advice = {
    Safe: "Continue routine monitoring.",
    Monitor: "Schedule additional checkups.",
    Elevated: "Doctor consultation recommended.",
    Critical: "Immediate medical attention required."
  }

  return (
    <Card className="max-w-xl mt-8 text-center">

      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Pregnancy Risk Level
      </h2>

      <RiskOMeter score={score} category={category} />

      <p className="text-gray mt-6">
        {advice[category]}
      </p>

    </Card>
  )
}

export default RiskResult