import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { getParticipantsByEventApi, cancelParticipantApi } from '../../api/participants.api'
import { getSessionsByEventApi, getScanLogsByEventApi } from '../../api/scan.api'
import { getOverrideLogsByEventApi, fixCheckinApi, forceCheckoutApi, earlyOutApi } from '../../api/override.api'
import { Event, Participant, AttendanceSession, ScanLog, OverrideLog } from '../../types'

type TabType = 'participants' | 'attendance' | 'scanlogs' | 'overrides' | 'reports'
type ModalType = 'fix_checkin' | 'force_checkout' | 'early_out' | null

interface OverrideModal {
  type: ModalType
  session: AttendanceSession | null
}

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'

  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [overrideLogs, setOverrideLogs] = useState<OverrideLog[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('participants')
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Override modal state
  const [modal, setModal] = useState<OverrideModal>({ type: null, session: null })
  const [overrideForm, setOverrideForm] = useState({
    adjusted_time: '',
    early_out_cutoff: '',
    reason: ''
  })
  const [overrideLoading, setOverrideLoading] = useState(false)
  const [overrideError, setOverrideError] = useState('')

  const fetchData = useCallback(async () => {
    const id = Number(eventId)
    try {
      const [eventData, participantsData, sessionsData, logsData, overrideData] = await Promise.all([
        getEventByIdApi(id),
        getParticipantsByEventApi(id),
        getSessionsByEventApi(id),
        getScanLogsByEventApi(id),
        getOverrideLogsByEventApi(id)
      ])
      setEvent(eventData)
      setParticipants(participantsData)
      setSessions(sessionsData)
      setScanLogs(logsData)
      setOverrideLogs(overrideData)
      setLastRefreshed(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
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

  const openModal = (type: ModalType, session: AttendanceSession) => {
    setModal({ type, session })
    setOverrideForm({ adjusted_time: '', early_out_cutoff: '', reason: '' })
    setOverrideError('')
  }

  const closeModal = () => {
    setModal({ type: null, session: null })
    setOverrideError('')
  }

  const handleOverrideSubmit = async () => {
    if (!modal.session || !modal.type) return
    setOverrideLoading(true)
    setOverrideError('')

    try {
      const base = {
        attendance_session_id: modal.session.session_id,
        participant_id: modal.session.participant_id,
        event_id: Number(eventId),
        adjusted_time: overrideForm.adjusted_time,
        reason: overrideForm.reason
      }

      if (modal.type === 'fix_checkin') {
        await fixCheckinApi(base)
      } else if (modal.type === 'force_checkout') {
        await forceCheckoutApi(base)
      } else if (modal.type === 'early_out') {
        await earlyOutApi({ ...base, early_out_cutoff: overrideForm.early_out_cutoff })
      }

      closeModal()
      fetchData()
    } catch (err: any) {
      setOverrideError(err.response?.data?.error || 'Override failed')
    } finally {
      setOverrideLoading(false)
    }
  }

  // CSV Exports
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
      String(p.participant_id), p.agent_code, p.full_name, p.branch_name,
      p.team_name, p.registration_status, new Date(p.registered_at).toLocaleString('en-PH')
    ])
    downloadCSV(`participants-event-${eventId}.csv`, headers, rows)
  }

  const exportAttendance = () => {
    const headers = ['Session ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status']
    const rows = sessions.map(s => [
      String(s.session_id), s.agent_code, s.full_name, s.branch_name, s.team_name,
      new Date(s.check_in_time).toLocaleString('en-PH'),
      s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : 'Not yet checked out',
      s.check_out_time ? 'Completed' : 'Inside'
    ])
    downloadCSV(`attendance-event-${eventId}.csv`, headers, rows)
  }

  const exportScanLogs = () => {
    const headers = ['Scan ID', 'Agent Code', 'Full Name', 'Scan Type', 'Denial Reason', 'Scanned At']
    const rows = scanLogs.map(s => [
      String(s.scan_id), s.agent_code || 'Unknown', s.full_name || 'Unknown',
      s.scan_type, s.denial_reason || '', new Date(s.scanned_at).toLocaleString('en-PH')
    ])
    downloadCSV(`scan-logs-event-${eventId}.csv`, headers, rows)
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
          <button onClick={() => navigate('/admin/events')} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
          <h1 className="text-lg font-bold text-gray-800">{event.title}</h1>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
            {event.status.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Last refreshed: {lastRefreshed.toLocaleTimeString('en-PH')}</span>
          <button onClick={fetchData} className="text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition">
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

        {/* Event Info */}
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
            <p className="text-sm text-blue-600 font-mono">{window.location.origin}/register/{event.event_id}</p>
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
            ...(isAdmin ? [{ key: 'overrides', label: `⚙️ Overrides (${overrideLogs.length})` }] : []),
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
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.registered_at).toLocaleString('en-PH')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleCancel(p.participant_id)} className="text-xs text-red-600 hover:underline">Cancel</button>
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
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Check In</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Check Out</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Method</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                    {isAdmin && <th className="text-left px-4 py-3 text-gray-600 font-medium">Override</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map(s => (
                    <tr key={s.session_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.full_name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono">{s.agent_code}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{new Date(s.check_in_time).toLocaleString('en-PH')}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.check_out_method || s.check_in_method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.check_out_method === 'early_out' ? 'bg-yellow-100 text-yellow-700' : s.check_out_time ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                          {s.check_out_method === 'early_out' ? 'Early Out' : s.check_out_time ? 'Completed' : 'Inside'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openModal('fix_checkin', s)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Fix In
                            </button>
                            {!s.check_out_time && (
                              <button
                                onClick={() => openModal('force_checkout', s)}
                                className="text-xs text-orange-600 hover:underline"
                              >
                                Force Out
                              </button>
                            )}
                            <button
                              onClick={() => openModal('early_out', s)}
                              className="text-xs text-yellow-600 hover:underline"
                            >
                              Early Out
                            </button>
                          </div>
                        </td>
                      )}
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
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.scan_type === 'check_in' ? 'bg-green-100 text-green-700' : s.scan_type === 'check_out' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {s.scan_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.denial_reason || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.scanned_at).toLocaleString('en-PH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── OVERRIDES TAB ── */}
        {activeTab === 'overrides' && isAdmin && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {overrideLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No overrides recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Participant</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Reason</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Original Time</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Adjusted Time</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Done By</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overrideLogs.map(o => (
                    <tr key={o.override_id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{o.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{o.agent_code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          o.override_type === 'fix_checkin' ? 'bg-blue-100 text-blue-700' :
                          o.override_type === 'force_checkout' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.override_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{o.reason}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {o.original_time ? new Date(o.original_time).toLocaleString('en-PH') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {o.adjusted_time ? new Date(o.adjusted_time).toLocaleString('en-PH') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{o.admin_name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.created_at).toLocaleString('en-PH')}</td>
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

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Export Reports</h3>
              <p className="text-sm text-gray-500 mb-4">Download data as CSV files.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Participants List</p>
                    <p className="text-xs text-gray-500 mt-0.5">{confirmedCount} confirmed participants</p>
                  </div>
                  <button onClick={exportParticipants} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition">⬇️ Export CSV</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Attendance Report</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sessions.length} sessions with check-in/out times</p>
                  </div>
                  <button onClick={exportAttendance} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition">⬇️ Export CSV</button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">Scan Logs</p>
                    <p className="text-xs text-gray-500 mt-0.5">{scanLogs.length} total scan attempts</p>
                  </div>
                  <button onClick={exportScanLogs} className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition">⬇️ Export CSV</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── OVERRIDE MODAL ── */}
      {modal.type && modal.session && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg">
                {modal.type === 'fix_checkin' && '✏️ Fix Check-in Time'}
                {modal.type === 'force_checkout' && '🚪 Force Check-out'}
                {modal.type === 'early_out' && '⚠️ Mark Early Out'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Participant Info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-800">{modal.session.full_name}</p>
              <p className="text-xs text-gray-500 font-mono">{modal.session.agent_code}</p>
              <p className="text-xs text-gray-500 mt-1">
                Check-in: {new Date(modal.session.check_in_time).toLocaleString('en-PH')}
              </p>
              {modal.session.check_out_time && (
                <p className="text-xs text-gray-500">
                  Check-out: {new Date(modal.session.check_out_time).toLocaleString('en-PH')}
                </p>
              )}
            </div>

            {/* Error */}
            {overrideError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm mb-4">
                {overrideError}
              </div>
            )}

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {modal.type === 'fix_checkin' ? 'Corrected Check-in Time' :
                   modal.type === 'force_checkout' ? 'Check-out Time' :
                   'Adjusted Check-out Time'}
                </label>
                <input
                  type="datetime-local"
                  value={overrideForm.adjusted_time}
                  onChange={e => setOverrideForm({ ...overrideForm, adjusted_time: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {modal.type === 'early_out' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Early Out Cutoff Time
                    <span className="text-xs text-gray-400 ml-1">(anyone who left before this is early out)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={overrideForm.early_out_cutoff}
                    onChange={e => setOverrideForm({ ...overrideForm, early_out_cutoff: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={overrideForm.reason}
                  onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  placeholder="Explain why this override is needed..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={overrideLoading || !overrideForm.adjusted_time || !overrideForm.reason}
                className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition disabled:opacity-50 ${
                  modal.type === 'fix_checkin' ? 'bg-blue-600 hover:bg-blue-700' :
                  modal.type === 'force_checkout' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {overrideLoading ? 'Saving...' : 'Confirm Override'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}