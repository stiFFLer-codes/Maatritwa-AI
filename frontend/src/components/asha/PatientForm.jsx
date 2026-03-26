import { useState } from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"

function PatientForm() {

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    village: "",
    weeks_pregnant: "",
    height_cm: "",
    blood_group: "",
    lmp_date: "",
    edd_date: "",
    expected_del_wks: "",
    parity: "",
    gravida: "",
    diabetic_history: false,
    veg_nonveg: "",
    has_addiction: false,
    addiction_notes: ""
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
      name: formData.name,
      age: Number(formData.age),
      village: formData.village,
      weeks_pregnant: Number(formData.weeks_pregnant),
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      blood_group: formData.blood_group || null,
      lmp_date: formData.lmp_date || null,
      edd_date: formData.edd_date || null,
      expected_del_wks: formData.expected_del_wks ? parseInt(formData.expected_del_wks) : null,
      parity: formData.parity ? parseInt(formData.parity) : null,
      gravida: formData.gravida ? parseInt(formData.gravida) : null,
      diabetic_history: formData.diabetic_history,
      veg_nonveg: formData.veg_nonveg || null,
      has_addiction: formData.has_addiction,
      addiction_notes: formData.addiction_notes || null
    }

    console.log("Patient Payload:", payload)
  }

  return (
    <Card className="max-w-xl">

      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Register Patient
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Patient Name *"
            value={formData.name}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number"
            name="age"
            placeholder="Age *"
            value={formData.age}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="village"
            placeholder="Village *"
            value={formData.village}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number"
            name="weeks_pregnant"
            placeholder="Gestational Weeks *"
            value={formData.weeks_pregnant}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="height_cm"
            placeholder="Height (cm)"
            step="0.1"
            value={formData.height_cm}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="text"
            name="blood_group"
            placeholder="Blood Group"
            value={formData.blood_group}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            name="lmp_date"
            placeholder="LMP Date"
            value={formData.lmp_date}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="date"
            name="edd_date"
            placeholder="EDD Date"
            value={formData.edd_date}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="parity"
            placeholder="Parity"
            value={formData.parity}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <input
            type="number"
            name="gravida"
            placeholder="Gravida"
            value={formData.gravida}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            name="expected_del_wks"
            placeholder="Expected Delivery (wks)"
            value={formData.expected_del_wks}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          />
          <select
            name="veg_nonveg"
            value={formData.veg_nonveg}
            onChange={handleChange}
            className="p-4 rounded-xl border border-warm-gray focus:outline-none"
          >
            <option value="">Diet</option>
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Veg</option>
            <option value="eggetarian">Eggetarian</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="diabetic_history"
              checked={formData.diabetic_history}
              onChange={handleChange}
            />
            <span>Diabetic History</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="has_addiction"
              checked={formData.has_addiction}
              onChange={handleChange}
            />
            <span>Has Addiction</span>
          </label>
        </div>
        <textarea
          name="addiction_notes"
          placeholder="Addiction notes (optional)"
          value={formData.addiction_notes}
          onChange={handleChange}
          rows="2"
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />
        <Button size="lg" className="w-full">
          Save Patient Data
        </Button>
      </form>

    </Card>
  )
}

export default PatientForm