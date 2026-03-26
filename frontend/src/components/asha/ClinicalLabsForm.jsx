import { useState } from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"

function ClinicalLabsForm({ patientId, onSubmit }) {
  const [formData, setFormData] = useState({
    sgpt: "",
    sgot: "",
    serum_creatinine: "",
    platelet_count: "",
    proteinuria: false,
    edema: "none",
    epigastric_pain: false,
    headache: false,
    blurring_vision: false,
    seizures: false
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      patient_id: patientId,
      sgpt: parseFloat(formData.sgpt) || null,
      sgot: parseFloat(formData.sgot) || null,
      serum_creatinine: parseFloat(formData.serum_creatinine) || null,
      platelet_count: parseInt(formData.platelet_count) || null,
      proteinuria: formData.proteinuria,
      edema: formData.edema,
      epigastric_pain: formData.epigastric_pain,
      headache: formData.headache,
      blurring_vision: formData.blurring_vision,
      seizures: formData.seizures
    }
    onSubmit(payload)
  }

  return (
    <Card className="max-w-xl mt-6">
      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Clinical Labs (Doctor)
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number" 
            name="sgpt"
            placeholder="SGPT"
            step="0.1"
            value={formData.sgpt}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number" 
            name="sgot"
            placeholder="SGOT"
            step="0.1"
            value={formData.sgot}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number" 
            name="serum_creatinine"
            placeholder="Serum Creatinine"
            step="0.01"
            value={formData.serum_creatinine}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number" 
            name="platelet_count"
            placeholder="Platelet Count"
            value={formData.platelet_count}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="proteinuria"
              checked={formData.proteinuria}
              onChange={handleChange}
            />
            <span>Proteinuria</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="epigastric_pain"
              checked={formData.epigastric_pain}
              onChange={handleChange}
            />
            <span>Epigastric Pain</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="headache"
              checked={formData.headache}
              onChange={handleChange}
            />
            <span>Headache</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="blurring_vision"
              checked={formData.blurring_vision}
              onChange={handleChange}
            />
            <span>Blurring Vision</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="seizures"
              checked={formData.seizures}
              onChange={handleChange}
            />
            <span>Seizures</span>
          </label>
        </div>
        <select
          name="edema"
          value={formData.edema}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        >
          <option value="none">No Edema</option>
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
        <Button size="lg">
          Save Labs
        </Button>
      </form>
    </Card>
  )
}

export default ClinicalLabsForm

