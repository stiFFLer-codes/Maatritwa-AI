import { useState } from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"

function VitalsForm({ onPredict }) {

  const [vitals, setVitals] = useState({
    blood_pressure_sys: "",
    blood_pressure_dia: "",
    weight_kg: "",
    hemoglobin: "",
    pulse_rate: "",
    symptoms: ""
  })

  const handleChange = (e) => {
    setVitals({
      ...vitals,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      blood_pressure_sys: Number(vitals.blood_pressure_sys),
      blood_pressure_dia: Number(vitals.blood_pressure_dia),
      weight_kg: Number(vitals.weight_kg),
      hemoglobin: Number(vitals.hemoglobin),
      pulse_rate: vitals.pulse_rate ? Number(vitals.pulse_rate) : null,
      symptoms: vitals.symptoms || null
    }

    if (onPredict) {
      onPredict(payload)
    }

    console.log("Vitals Payload:", payload)
  }

  return (
    <Card className="max-w-xl mt-8">

      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Enter Health Vitals
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="blood_pressure_sys"
            placeholder="Systolic BP *"
            value={vitals.blood_pressure_sys}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number"
            name="blood_pressure_dia"
            placeholder="Diastolic BP *"
            value={vitals.blood_pressure_dia}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="weight_kg"
            placeholder="Weight (kg) *"
            step="0.1"
            value={vitals.weight_kg}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number"
            name="hemoglobin"
            placeholder="Hemoglobin (g/dL) *"
            step="0.1"
            value={vitals.hemoglobin}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <input
          type="number"
          name="pulse_rate"
          placeholder="Pulse Rate (bpm)"
          value={vitals.pulse_rate}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />
        <textarea
          name="symptoms"
          placeholder="Symptoms (optional)"
          value={vitals.symptoms}
          onChange={handleChange}
          rows="3"
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />
        <Button size="lg" className="w-full">
          Submit Vitals & Predict Eclampsia Risk
        </Button>
      </form>

    </Card>
  )
}

export default VitalsForm