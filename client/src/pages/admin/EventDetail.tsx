import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { getParticipantsByEventApi, cancelParticipantApi } from '../../api/participants.api'
import { getSessionsByEventApi } from '../../api/scan.api'
import { Event, Participant, AttendanceSession } from '../../types'

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [activeTab, setActiveTab] = useState<'participants' | 'attendance'>('participants')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = Number(eventId)
    Promise.all([
      getEventByIdApi(id),
      getParticipantsByEventApi(id),
      getSessionsByEventApi(id)
    ]).then(([eventData, participantsData, sessionsData]) => {
      setEvent(eventData)
      setParticipants(participantsData)
      setSessions(sessionsData)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  const handleCancel = async (participant_id: number) => {
    if (!confirm('Cancel this participant?')) return
    try {
      await cancelParticipantApi(participant_id)
      setParticipants(prev => prev.filter(p => p.participant_id !== participant_id))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel participant')
    }
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

  const confirmedCount = participants.filter(p => p.registration_status === 'confirmed').length
  const checkedInCount = sessions.filter(s => s.check_in_time && !s.check_out_time).length

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading event...</p>
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Event not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/events')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-800">{event.title}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
            {event.status.toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => navigate(`/admin/events/${eventId}/scanner`)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          📷 Open Scanner
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Event Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Date</p>
            <p className="font-semibold text-gray-800">
              {new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Time</p>
            <p className="font-semibold text-gray-800">{event.start_time} — {event.end_time}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Venue</p>
            <p className="font-semibold text-gray-800">{event.venue}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">Capacity</p>
            <p className="font-semibold text-gray-800">{confirmedCount} / {event.capacity}</p>
          </div>
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{confirmedCount}</p>
            <p className="text-sm text-blue-500 mt-1">Registered</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{checkedInCount}</p>
            <p className="text-sm text-green-500 mt-1">Currently Inside</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{event.capacity - confirmedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Slots Remaining</p>
          </div>
        </div>

        {/* Registration Link */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Registration Link</p>
          <div className="flex items-center gap-3">
            <p className="text-sm text-blue-600 font-mono">
              {window.location.origin}/register/{event.event_id}
            </p>
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register/${event.event_id}`)}
              className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 transition"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${activeTab === 'participants' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Participants ({confirmedCount})
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Attendance Sessions ({sessions.length})
          </button>
        </div>

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {participants.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No participants registered yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Agent Code</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Branch</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Team</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Registered At</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {participants.map(p => (
                    <tr key={p.participant_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.agent_code}</td>
                      <td className="px-4 py-3 text-gray-600">{p.branch_name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.team_name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.registration_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.registration_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(p.registered_at).toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCancel(p.participant_id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No attendance sessions yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Agent Code</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Branch</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Check In</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Check Out</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map(s => (
                    <tr key={s.session_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.agent_code}</td>
                      <td className="px-4 py-3 text-gray-600">{s.branch_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(s.check_in_time).toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.check_out_time ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {s.check_out_time ? 'Checked Out' : 'Inside'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}