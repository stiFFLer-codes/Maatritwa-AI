import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./i18n/AuthContext"
import { AuthProvider } from "./i18n/AuthContext"

import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Onboarding from "./pages/Onboarding"
import AshaDashboard from "./pages/asha/AshaDashboard"
import MotherDashboard from "./pages/mother/MotherDashboard"
import DoctorDashboard from "./pages/doctor/DoctorDashboard"

const dashboardByRole = {
  asha: '/asha',
  mother: '/mother',
  doctor: '/doctor'
}

function getPostAuthPath(userRole) {
  return userRole ? (dashboardByRole[userRole] || '/onboarding') : '/onboarding'
}

function AuthRedirect() {
  const { user, userRole, loading, roleLoading } = useAuth()

  if (loading || (user && roleLoading)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getPostAuthPath(userRole)} replace />
}

function PublicRoute({ element }) {
  const { user, userRole, loading, roleLoading } = useAuth()

  if (loading || (user && roleLoading)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (user) {
    return <Navigate to={getPostAuthPath(userRole)} replace />
  }

  return element
}

function OnboardingRoute({ element }) {
  const { user, userRole, loading, roleLoading } = useAuth()

  if (loading || (user && roleLoading)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (userRole) {
    return <Navigate to={dashboardByRole[userRole] || '/'} replace />
  }

  return element
}

// Protected route component
function ProtectedRoute({ element, requiredRole }) {
  const { user, loading, roleLoading, userRole } = useAuth()

  if (loading || (user && roleLoading)) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !userRole) {
    return <Navigate to="/onboarding" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={dashboardByRole[userRole] || '/onboarding'} replace />
  }

  return element
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AshaDashboard />} />
      <Route path="/asha" element={<AshaDashboard />} />
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/mother" element={<MotherDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App