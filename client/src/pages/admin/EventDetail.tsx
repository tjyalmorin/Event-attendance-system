import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { getParticipantsByEventApi, cancelParticipantApi } from '../../api/participants.api'
import { getSessionsByEventApi, getScanLogsByEventApi } from '../../api/scan.api'
import { Event, Participant, AttendanceSession, ScanLog } from '../../types'

type TabType = 'participants' | 'attendance' | 'scanlogs' | 'reports'

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('participants')
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    const id = Number(eventId)
    try {
      const [eventData, participantsData, sessionsData, logsData] = await Promise.all([
        getEventByIdApi(id),
        getParticipantsByEventApi(id),
        getSessionsByEventApi(id),
        getScanLogsByEventApi(id)
      ])
      setEvent(eventData)
      setParticipants(participantsData)
      setSessions(sessionsData)
      setScanLogs(logsData)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleCancel = async (participant_id: number) => {
    if (!confirm('Cancel this participant?')) return
    try {
      await cancelParticipantApi(participant_id)
      setParticipants(prev => prev.filter(p => p.participant_id !== participant_id))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel participant')
    }
  }

  // ── CSV Export Helpers ──────────────────────────────────────
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell ?? ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportParticipants = () => {
    const headers = ['Participant ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Status', 'Registered At']
    const rows = participants.map(p => [
      String(p.participant_id),
      p.agent_code,
      p.full_name,
      p.branch_name,
      p.team_name,
      p.registration_status,
      new Date(p.registered_at).toLocaleString('en-PH')
    ])
    downloadCSV(`participants-event-${eventId}.csv`, headers, rows)
  }

  const exportAttendance = () => {
    const headers = ['Session ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status']
    const rows = sessions.map(s => [
      String(s.session_id),
      s.agent_code,
      s.full_name,
      s.branch_name,
      s.team_name,
      new Date(s.check_in_time).toLocaleString('en-PH'),
      s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : 'Not yet checked out',
      s.check_out_time ? 'Completed' : 'Inside'
    ])
    downloadCSV(`attendance-event-${eventId}.csv`, headers, rows)
  }

  const exportScanLogs = () => {
    const headers = ['Scan ID', 'Agent Code', 'Full Name', 'Scan Type', 'Denial Reason', 'Scanned At']
    const rows = scanLogs.map(s => [
      String(s.scan_id),
      s.agent_code || 'Unknown',
      s.full_name || 'Unknown',
      s.scan_type,
      s.denial_reason || '',
      new Date(s.scanned_at).toLocaleString('en-PH')
    ])
    downloadCSV(`scan-logs-event-${eventId}.csv`, headers, rows)
  }
  // ────────────────────────────────────────────────────────────

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
  const completedCount = sessions.filter(s => s.check_in_time && s.check_out_time).length
  const deniedCount = scanLogs.filter(s => s.scan_type === 'denied').length

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
          <button onClick={() => navigate('/admin/events')} className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-800">{event.title}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
            {event.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Last refreshed: {lastRefreshed.toLocaleTimeString('en-PH')}
          </span>
          <button
            onClick={fetchData}
            className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate(`/admin/events/${eventId}/scanner`)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            🪪 Open Scanner
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Event Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{confirmedCount}</p>
            <p className="text-sm text-blue-500 mt-1">Registered</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{checkedInCount}</p>
            <p className="text-sm text-green-500 mt-1">Currently Inside</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-600">{completedCount}</p>
            <p className="text-sm text-gray-500 mt-1">Completed</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{deniedCount}</p>
            <p className="text-sm text-red-400 mt-1">Denied Scans</p>
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
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { key: 'participants', label: `Participants (${confirmedCount})` },
            { key: 'attendance', label: `Attendance (${sessions.length})` },
            { key: 'scanlogs', label: `Scan Logs (${scanLogs.length})` },
            { key: 'reports', label: '📊 Reports' },
          ] as { key: TabType, label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PARTICIPANTS TAB ── */}
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
                      <td className="px-4 py-3 text-gray-600 font-mono">{p.agent_code}</td>
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
                        <button onClick={() => handleCancel(p.participant_id)} className="text-xs text-red-600 hover:underline">
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

        {/* ── ATTENDANCE TAB ── */}
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
                      <td className="px-4 py-3 text-gray-600 font-mono">{s.agent_code}</td>
                      <td className="px-4 py-3 text-gray-600">{s.branch_name}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(s.check_in_time).toLocaleString('en-PH')}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.check_out_time ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {s.check_out_time ? 'Completed' : 'Inside'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── SCAN LOGS TAB ── */}
        {activeTab === 'scanlogs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {scanLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No scan logs yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Agent Code</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Denial Reason</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Scanned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {scanLogs.map(s => (
                    <tr key={s.scan_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.full_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono">{s.agent_code || s.qr_token}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          s.scan_type === 'check_in' ? 'bg-green-100 text-green-700' :
                          s.scan_type === 'check_out' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {s.scan_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.denial_reason || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(s.scanned_at).toLocaleString('en-PH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {activeTab === 'reports' && (
          <div className="space-y-4">

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Event Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">{confirmedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Registered</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently Inside</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
                  <p className="text-xs text-gray-500 mt-1">Checked Out</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {confirmedCount > 0 ? Math.round((completedCount / confirmedCount) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Attendance Rate</p>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Export Reports</h3>
              <p className="text-sm text-gray-500 mb-4">Download data as CSV files for Excel or Google Sheets.</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Participants List</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {confirmedCount} confirmed participants with registration details
                    </p>
                  </div>
                  <button
                    onClick={exportParticipants}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    ⬇️ Export CSV
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Attendance Report</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sessions.length} sessions with check-in and check-out times
                    </p>
                  </div>
                  <button
                    onClick={exportAttendance}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    ⬇️ Export CSV
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Scan Logs</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {scanLogs.length} total scan attempts including denied ones
                    </p>
                  </div>
                  <button
                    onClick={exportScanLogs}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition"
                  >
                    ⬇️ Export CSV
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}