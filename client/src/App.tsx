import { Routes, Route, Navigate } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { SidebarProvider } from './contexts/SidebarContext'

// Client pages
import RegistrationPage from './pages/client/RegistrationPage'
import ConfirmationPage from './pages/client/ConfirmationPage'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import EventManagement from './pages/admin/EventManagement'
import CreateEvent from './pages/admin/CreateEvent'
import EventDetail from './pages/admin/EventDetail'
import ScannerPage from './pages/admin/ScannerPage'
import TrashBin from './pages/admin/TrashBin'

// Forgot Password pages
import ForgotPasswordPage from './pages/admin/ForgotPasswordPage'
import VerifyOtpPage from './pages/admin/VerifyOtpPage'
import ResetPasswordPage from './pages/admin/ResetPasswordPage'

// Settings pages
import ProfileSettingsPage from './pages/admin/ProfileSettingsPage'
import AccountManagement from './pages/admin/AccountManagement'

// Protected route wrapper
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('authToken')
  return token ? <>{children}</> : <Navigate to="/admin/login" />
}

function App() {
  return (
    <DarkModeProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
          <Routes>
            {/* Public Client Routes */}
            <Route path="/register/:eventId" element={<RegistrationPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />

            {/* Auth */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Forgot Password (public) */}
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Admin Routes */}
            <Route path="/admin/events" element={<PrivateRoute><EventManagement /></PrivateRoute>} />
            <Route path="/admin/events/trash" element={<PrivateRoute><TrashBin /></PrivateRoute>} />
            <Route path="/admin/events/create" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
            <Route path="/admin/events/:eventId" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
            <Route path="/admin/events/:eventId/scanner" element={<PrivateRoute><ScannerPage /></PrivateRoute>} />

            {/* Settings */}
            <Route path="/admin/settings/profile" element={<PrivateRoute><ProfileSettingsPage /></PrivateRoute>} />
            <Route path="/admin/settings/accounts" element={<PrivateRoute><AccountManagement /></PrivateRoute>} />
            <Route path="/admin/settings" element={<Navigate to="/admin/settings/profile" />} />

            {/* Staff Routes */}
            <Route path="/staff/events" element={<PrivateRoute><EventManagement /></PrivateRoute>} />
            <Route path="/staff/events/:eventId" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
            <Route path="/staff/events/:eventId/scanner" element={<PrivateRoute><ScannerPage /></PrivateRoute>} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/admin/login" />} />
            <Route path="*" element={<Navigate to="/admin/login" />} />
          </Routes>
        </div>
      </SidebarProvider>
    </DarkModeProvider>
  )
}

export default App