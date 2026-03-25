import { useState } from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"

function PatientForm() {

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    village: "",
    phone: "",
    gestationWeeks: ""
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Patient Data:", formData)
  }

  return (
    <Card className="max-w-xl">

      <h2 className="text-xl font-semibold text-charcoal mb-6">
        Register Patient
      </h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >

        <input
          type="text"
          name="name"
          placeholder="Patient Name"
          value={formData.name}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <input
          type="text"
          name="village"
          placeholder="Village"
          value={formData.village}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <input
          type="number"
          name="gestationWeeks"
          placeholder="Gestation Weeks"
          value={formData.gestationWeeks}
          onChange={handleChange}
          className="p-4 rounded-xl border border-warm-gray focus:outline-none"
        />

        <Button size="lg">
          Save Patient
        </Button>

      </form>

    </Card>
  )
}

export default PatientForm