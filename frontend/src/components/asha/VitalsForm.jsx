import { useState } from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"

function VitalsForm({ onPredict }) {

  const [vitals, setVitals] = useState({
    bloodPressure: "",
    weight: "",
    hemoglobin: "",
    complications: ""
  })

  const handleChange = (e) => {
    setVitals({
      ...vitals,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (onPredict) {
      onPredict(vitals)
    }

    console.log("Vitals:", vitals)
  }

  return (
    <Card className="max-w-xl mt-8">

      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Enter Health Vitals
      </h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >

        <input
          type="text"
          name="bloodPressure"
          placeholder="Blood Pressure (e.g. 120/80)"
          value={vitals.bloodPressure}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <input
          type="number"
          name="weight"
          placeholder="Weight (kg)"
          value={vitals.weight}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <input
          type="number"
          name="hemoglobin"
          placeholder="Hemoglobin (g/dL)"
          value={vitals.hemoglobin}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <textarea
          name="complications"
          placeholder="Previous complications (optional)"
          value={vitals.complications}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <Button size="lg">
          Predict Risk
        </Button>

      </form>

    </Card>
  )
}

export default VitalsForm