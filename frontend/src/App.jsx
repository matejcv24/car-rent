import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout.jsx'
import ProtectedRoute from './features/auth/components/ProtectedRoute.jsx'
import AcceptInvitationPage from './features/auth/pages/AcceptInvitationPage.jsx'
import LoginPage from './features/auth/pages/LoginPage.jsx'
import DashboardPage from './features/calendar/pages/DashboardPage.jsx'
import VehiclesPage from './features/vehicles/pages/VehiclesPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
