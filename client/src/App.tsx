import { Routes, Route } from 'react-router-dom'

// Client pages
import RegistrationPage from './pages/client/RegistrationPage'
import ConfirmationPage from './pages/client/ConfirmationPage'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import EventList from './pages/admin/EventList'
import EventDetail from './pages/admin/EventDetail'
import ScannerPage from './pages/admin/ScannerPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Client Routes */}
        <Route path="/register/:eventId" element={<RegistrationPage />} />
        <Route path="/confirmation/:registrationId" element={<ConfirmationPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/events" element={<EventList />} />
        <Route path="/admin/events/:eventId" element={<EventDetail />} />
        <Route path="/admin/events/:eventId/scanner" element={<ScannerPage />} />
        
        {/* Default route */}
        <Route path="/" element={
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold text-primary-500">QR Event Attendance System</h1>
          </div>
        } />
      </Routes>
    </div>
  )
}

export default App
