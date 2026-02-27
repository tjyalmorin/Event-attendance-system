import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllEventsApi } from '../../api/events.api'
import { getMyAdminGrantsApi } from '../../api/admin-grant.api'
import { Event, AdminGrant } from '../../types'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [adminGrants, setAdminGrants] = useState<AdminGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'events' | 'admin-grants'>('events')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    Promise.all([
      getAllEventsApi().then(setEvents),
      user.role === 'staff' ? getMyAdminGrantsApi().then(setAdminGrants) : Promise.resolve()
    ]).finally(() => setLoading(false))
  }, [user.role])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate('/admin/login')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'closed': return 'bg-red-100 text-red-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">PRU LIFE UK</h1>
          <p className="text-xs text-gray-500">Event Attendance System</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.full_name} <span className="text-xs text-blue-500 ml-1">({user.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Tabs for Staff (show admin grants) */}
        {user.role === 'staff' && (
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 font-medium text-sm transition ${
                activeTab === 'events'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setActiveTab('admin-grants')}
              className={`px-4 py-2 font-medium text-sm transition ${
                activeTab === 'admin-grants'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔐 Temporary Admin Access
            </button>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Events</h2>
              {user.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/events')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  + Manage Events
                </button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-12 text-gray-400">Loading events...</div>
            )}

            {/* Empty */}
            {!loading && events.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No events found. Create one to get started.
              </div>
            )}

            {/* Events Grid */}
            {!loading && events.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                  <div
                    key={event.event_id}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer"
                    onClick={() => navigate(`/admin/events/${event.event_id}`)}
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                        {event.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Event Info */}
                    <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>

                    <div className="space-y-1 text-xs text-gray-500">
                      <p>📅 {new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p>🕐 {event.start_time} — {event.end_time}</p>
                      <p>📍 {event.venue}</p>
                      <p>👥 Capacity: {event.capacity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Admin Grants Tab (Staff only) */}
        {activeTab === 'admin-grants' && user.role === 'staff' && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">🔐 Temporary Admin Access</h2>
            
            {loading && (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            )}

            {!loading && adminGrants.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-700">No active temporary admin access.</p>
                <p className="text-sm text-blue-600 mt-2">Wait for SuperAdmin to grant you access for events.</p>
              </div>
            )}

            {!loading && adminGrants.length > 0 && (
              <div className="space-y-3">
                {adminGrants.map(grant => {
                  const event = events.find(e => e.event_id === grant.event_id)
                  const expiresAt = new Date(grant.expires_at)
                  const now = new Date()
                  const hoursLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
                  
                  return (
                    <div key={grant.grant_id} className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{event?.title || `Event #${grant.event_id}`}</h3>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <p>✅ Admin access granted</p>
                            <p>✏️ Can edit: {grant.is_edit_allowed ? '✅ Yes' : '❌ No'}</p>
                            <p>⏰ Expires: {expiresAt.toLocaleString('en-PH')} ({hoursLeft} hours left)</p>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}