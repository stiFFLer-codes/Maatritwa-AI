import { BrowserRouter, Routes, Route } from "react-router-dom"

import Landing from "./pages/Landing"
import AshaDashboard from "./pages/asha/AshaDashboard"
import MotherDashboard from "./pages/mother/MotherDashboard"
import DoctorDashboard from "./pages/doctor/DoctorDashboard"

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/asha" element={<AshaDashboard />} />

        <Route path="/mother" element={<MotherDashboard />} />

        <Route path="/doctor" element={<DoctorDashboard />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App