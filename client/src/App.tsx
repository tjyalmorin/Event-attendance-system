import { Routes, Route, Navigate } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkModeContext'

// Client pages
import RegistrationPage from './pages/client/RegistrationPage'
import ConfirmationPage from './pages/client/ConfirmationPage'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import EventManagement from './pages/admin/EventManagement'
import CreateEvent from './pages/admin/CreateEvent'
import EventDetail from './pages/admin/EventDetail'
import ScannerPage from './pages/admin/ScannerPage'

// Protected route wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('authToken')
  return token ? <>{children}</> : <Navigate to="/admin/login" />
}

function App() {
  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Client Routes */}
          <Route path="/register/:eventId" element={<RegistrationPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />

          {/* Auth */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route path="/admin/events" element={<PrivateRoute><EventManagement /></PrivateRoute>} />
          <Route path="/admin/events/create" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
          <Route path="/admin/events/:eventId" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
          <Route path="/admin/events/:eventId/scanner" element={<PrivateRoute><ScannerPage /></PrivateRoute>} />

          {/* Staff Routes */}
          <Route path="/staff/events" element={<PrivateRoute><EventManagement /></PrivateRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/admin/login" />} />
          <Route path="*" element={<Navigate to="/admin/login" />} />
        </Routes>
      </div>
    </DarkModeProvider>
  )
}

export default App