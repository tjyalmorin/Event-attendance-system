import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { DarkModeProvider } from './contexts/DarkModeContext'
import { SidebarProvider } from './contexts/SidebarContext'

// Client pages
import RegistrationPage from './pages/client/RegistrationPage'
import ConfirmationPage from './pages/client/ConfirmationPage'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import BranchManagement from './pages/admin/BranchManagement'
import EventManagement from './pages/admin/EventManagement'
import CreateEvent from './pages/admin/CreateEvent'
import EventDetail from './pages/admin/EventDetail'
import ScannerPage from './pages/admin/ScannerPage'
import TrashBin from './pages/admin/TrashBin'
import EventArchive from './pages/admin/EventArchive'

// Forgot Password pages
import ForgotPasswordPage from './pages/admin/ForgotPasswordPage'
import VerifyOtpPage from './pages/admin/VerifyOtpPage'
import ResetPasswordPage from './pages/admin/ResetPasswordPage'

// Settings pages
import ProfileSettingsPage from './pages/admin/ProfileSettingsPage'
import AccountManagement from './pages/admin/AccountManagement'

// Components
import Sidebar from './components/Sidebar'

// ── Shared layout: persistent Sidebar + scrollable content area ──
// Sidebar lives here — never unmounts during admin navigation
// userRole is read from localStorage so staff can't see admin-only sidebar items
const AdminLayout = () => {
  const token = localStorage.getItem('authToken')
  if (!token) return <Navigate to="/admin/login" />

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole: 'admin' | 'staff' = storedUser?.role === 'admin' ? 'admin' : 'staff'

  return (
    <div className="flex min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  return (
    <DarkModeProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
          <Routes>
            {/* ── Public Client Routes ── */}
            <Route path="/register/:eventId" element={<RegistrationPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />

            {/* ── Auth (public) ── */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

            {/* ── Admin Routes (shared persistent Sidebar) ── */}
            {/* NOTE: static routes (trash, archive, create) must come BEFORE /:eventId */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/events" element={<EventManagement />} />
              <Route path="/admin/events/trash" element={<TrashBin />} />
              <Route path="/admin/events/archive" element={<EventArchive />} />
              <Route path="/admin/events/create" element={<CreateEvent />} />
              <Route path="/admin/events/:eventId" element={<EventDetail />} />
              <Route path="/admin/events/:eventId/scanner" element={<ScannerPage />} />
              <Route path="/admin/settings/profile" element={<ProfileSettingsPage />} />
              <Route path="/admin/settings/accounts" element={<AccountManagement />} />
              <Route path="/admin/settings/branches" element={<BranchManagement />} />
              <Route path="/admin/settings" element={<Navigate to="/admin/settings/profile" />} />
            </Route>

            {/* ── Staff Routes (shared persistent Sidebar) ── */}
            <Route element={<AdminLayout />}>
              <Route path="/staff/events" element={<EventManagement />} />
              <Route path="/staff/events/:eventId" element={<EventDetail />} />
              <Route path="/staff/events/:eventId/scanner" element={<ScannerPage />} />
            </Route>

            {/* ── Default ── */}
            <Route path="/" element={<Navigate to="/admin/login" />} />
            <Route path="*" element={<Navigate to="/admin/login" />} />
          </Routes>
        </div>
      </SidebarProvider>
    </DarkModeProvider>
  )
}

export default App