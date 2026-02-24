import { Routes, Route, Navigate } from 'react-router-dom'

// Client pages
import RegistrationPage from './pages/client/RegistrationPage'
import ConfirmationPage from './pages/client/ConfirmationPage'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import EventList from './pages/admin/EventList'
import EventDetail from './pages/admin/EventDetail'
import ScannerPage from './pages/admin/ScannerPage'

// Protected route wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('authToken')
  return token ? <>{children}</> : <Navigate to="/admin/login" />
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Client Routes */}
        <Route path="/register/:eventId" element={<RegistrationPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/events" element={<PrivateRoute><EventList /></PrivateRoute>} />
        <Route path="/admin/events/:eventId" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
        <Route path="/admin/events/:eventId/scanner" element={<PrivateRoute><ScannerPage /></PrivateRoute>} />

        {/* Default */}
        <Route path="/" element={<Navigate to="/admin/login" />} />
        <Route path="*" element={<Navigate to="/admin/login" />} />
      </Routes>
    </div>
  )
}

export default App