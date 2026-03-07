import { useState } from "react"

import Button from "../../components/shared/Button"
import PatientForm from "../../components/asha/PatientForm"
import VitalsForm from "../../components/asha/VitalsForm"
import RiskResult from "../../components/asha/RiskResult"

function AshaDashboard() {

  const [riskScore, setRiskScore] = useState(null)
  const [riskCategory, setRiskCategory] = useState(null)

  const handlePredict = (vitals) => {

    let score = 20

    if (vitals.hemoglobin < 9) score += 40
    if (vitals.weight < 45) score += 20
    if (vitals.bloodPressure?.includes("140")) score += 20

    let category = "Safe"

    if (score > 80) category = "Critical"
    else if (score > 60) category = "Elevated"
    else if (score > 40) category = "Monitor"

    setRiskScore(score)
    setRiskCategory(category)
  }

  return (
    <div className="min-h-screen bg-cream p-8">

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-maternal-purple">
          ASHA Worker Dashboard
        </h1>

        <p className="text-gray mt-2">
          Manage patient records and monitor maternal risk.
        </p>
      </div>

      {/* Quick Action */}
      <div className="max-w-6xl mx-auto mb-8">
        <Button size="lg">
          + Add New Patient
        </Button>
      </div>

      {/* Forms Section */}
      <div className="max-w-6xl mx-auto mt-8 flex flex-col gap-8">

        <PatientForm />

        <VitalsForm onPredict={handlePredict} />

      </div>

      {/* Risk Result */}
      {riskScore !== null && (
        <div className="max-w-6xl mx-auto mt-8">
          <RiskResult
            score={riskScore}
            category={riskCategory}
          />
        </div>
      )}

    </div>
  )
}

export default AshaDashboard