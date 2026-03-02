import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { getParticipantsByEventApi, cancelParticipantApi } from '../../api/participants.api'
import { getSessionsByEventApi, getScanLogsByEventApi } from '../../api/scan.api'
import { getOverrideLogsByEventApi, fixCheckinApi, forceCheckoutApi, earlyOutApi } from '../../api/override.api'
import { Event, Participant, AttendanceSession, ScanLog, OverrideLog } from '../../types'
import Sidebar from '../../components/Sidebar'

type TabType = 'participants' | 'attendance' | 'scanlogs' | 'overrides' | 'reports'
type ModalType = 'fix_checkin' | 'force_checkout' | 'early_out' | null

interface OverrideModal {
  type: ModalType
  session: AttendanceSession | null
}

// ── Icons ──
const ScannerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
    <rect x="8" y="8" width="8" height="8" rx="1"/>
  </svg>
)

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
)

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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out' | 'flagged'>('all')
  const [copied, setCopied] = useState(false)

  const [modal, setModal] = useState<OverrideModal>({ type: null, session: null })
  const [overrideForm, setOverrideForm] = useState({ adjusted_time: '', early_out_cutoff: '', reason: '' })
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
      if (modal.type === 'fix_checkin') await fixCheckinApi(base)
      else if (modal.type === 'force_checkout') await forceCheckoutApi(base)
      else if (modal.type === 'early_out') await earlyOutApi({ ...base, early_out_cutoff: overrideForm.early_out_cutoff })
      closeModal()
      fetchData()
    } catch (err: any) {
      setOverrideError(err.response?.data?.error || 'Override failed')
    } finally {
      setOverrideLoading(false)
    }
  }

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = filename; link.click()
    URL.revokeObjectURL(url)
  }

  const exportParticipants = () => {
    downloadCSV(`participants-event-${eventId}.csv`,
      ['Participant ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Status', 'Registered At'],
      participants.map(p => [String(p.participant_id), p.agent_code, p.full_name, p.branch_name, p.team_name, p.registration_status, new Date(p.registered_at).toLocaleString('en-PH')])
    )
  }

  const exportAttendance = () => {
    downloadCSV(`attendance-event-${eventId}.csv`,
      ['Session ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status'],
      sessions.map(s => [String(s.session_id), s.agent_code, s.full_name, s.branch_name, s.team_name, new Date(s.check_in_time).toLocaleString('en-PH'), s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : 'Not yet checked out', s.check_out_time ? 'Completed' : 'Inside'])
    )
  }

  const exportScanLogs = () => {
    downloadCSV(`scan-logs-event-${eventId}.csv`,
      ['Scan ID', 'Agent Code', 'Full Name', 'Scan Type', 'Denial Reason', 'Scanned At'],
      scanLogs.map(s => [String(s.scan_id), s.agent_code || 'Unknown', s.full_name || 'Unknown', s.scan_type, s.denial_reason || '', new Date(s.scanned_at).toLocaleString('en-PH')])
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register/${event?.event_id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confirmedCount = participants.filter(p => p.registration_status === 'confirmed').length
  const checkedInCount = sessions.filter(s => s.check_in_time && !s.check_out_time).length
  const completedCount = sessions.filter(s => s.check_in_time && s.check_out_time).length
  const earlyOutCount = sessions.filter(s => s.check_out_method === 'early_out').length
  const deniedCount = scanLogs.filter(s => s.scan_type === 'denied').length
  const noShowCount = confirmedCount - sessions.length

  // Recent check-ins (last 6, sorted by check_in_time desc)
  const recentCheckIns = [...sessions]
    .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
    .slice(0, 6)

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // Filtered sessions for attendance tab
  const filteredSessions = sessions.filter(s => {
    const matchSearch = search === '' ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.agent_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch_name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterStatus === 'all' ? true :
      filterStatus === 'checked_in' ? (s.check_in_time && !s.check_out_time) :
      filterStatus === 'checked_out' ? !!s.check_out_time :
      filterStatus === 'flagged' ? s.check_out_method === 'early_out' : true
    return matchSearch && matchFilter
  })

  const getStatusBadge = (event: Event) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-600',
      completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
      open: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-600',
    }
    return colors[event.status] || 'bg-gray-100 text-gray-600'
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#DC143C]" />
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-gray-400">Event not found.</p>
    </div>
  )

  const tabs: { key: TabType; label: string }[] = [
    { key: 'participants', label: `Participants (${confirmedCount})` },
    { key: 'attendance', label: `Attendance (${sessions.length})` },
    { key: 'scanlogs', label: `Scan Logs (${scanLogs.length})` },
    ...(isAdmin ? [{ key: 'overrides' as TabType, label: `Overrides (${overrideLogs.length})` }] : []),
    { key: 'reports', label: 'Reports' },
  ]

  return (
    <div className="min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f] flex">
      <Sidebar userRole={isAdmin ? 'admin' : 'staff'} />

      <div className="flex-1 flex flex-col min-w-0">

      {/* ── HEADER ── */}
      <header className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a] shadow-sm flex-shrink-0">
        <div className="px-12 h-[76px] flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/events')}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mr-2"
          >
            <ArrowLeftIcon />
            <span className="font-medium">Back</span>
          </button>

          <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
            {event.title.split(' ').map((word, i) =>
              i === 0 ? <span key={i}>{word}<span className="text-[#DC143C]">.</span></span> : <span key={i}> {word}</span>
            )}
          </h1>

          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadge(event)}`}>
            {event.status.toUpperCase()}
          </span>

          <div className="flex-1" />

          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Last refreshed: {lastRefreshed.toLocaleTimeString('en-PH')}
          </span>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-lg hover:border-gray-300 dark:hover:border-[#444] hover:text-gray-700 dark:hover:text-white transition-all"
          >
            <RefreshIcon />
            Refresh
          </button>
          <button
            onClick={() => navigate(`/admin/events/${eventId}/scanner`)}
            className="flex items-center gap-2 bg-[#DC143C] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#b01030] transition-all"
          >
            <ScannerIcon />
            Open Scanner
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-12 py-7 gap-5 overflow-hidden">

        {/* ── TOP SECTION: STATS + RECENT ── */}
        <div className="flex gap-5 flex-shrink-0">

          {/* STATS GRID */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Row 1: Registered + Checked In */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                num={confirmedCount}
                label="Registered"
                accent={false}
                barWidth={100}
                icon={<UsersIcon />}
              />
              <StatCard
                num={checkedInCount}
                label="Checked In"
                accent={true}
                barWidth={confirmedCount ? Math.round((checkedInCount / confirmedCount) * 100) : 0}
                icon={<CheckIcon />}
                iconRed
              />
            </div>

            {/* Row 2: Checked Out + No-Shows + Early Out */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                num={completedCount}
                label="Checked Out"
                accent={false}
                barWidth={confirmedCount ? Math.round((completedCount / confirmedCount) * 100) : 0}
                icon={<LogoutIcon />}
              />
              <StatCard
                num={noShowCount < 0 ? 0 : noShowCount}
                label="No-Shows"
                accent={false}
                barWidth={0}
                icon={<AlertIcon />}
              />
              {/* Early Out */}
              <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#DC143C]">
                  <StarIcon />
                </div>
                <div className="text-[48px] font-extrabold text-[#DC143C] tracking-tight leading-none mb-1.5">{earlyOutCount}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Early Out
                  <span className="block text-xs font-semibold text-[#DC143C] mt-0.5">Flagged</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
                  <div className="h-full bg-[#DC143C]" style={{ width: `${confirmedCount ? Math.round((earlyOutCount / confirmedCount) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* RECENT CHECK-IN CARD */}
          <div className="w-[340px] flex-shrink-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm flex flex-col overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2a2a2a]">
              <span className="text-sm font-bold text-gray-800 dark:text-white">Recent Check-In</span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#DC143C] tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC143C] animate-pulse" />
                LIVE
              </div>
            </div>
            <div className="flex-1 overflow-hidden divide-y divide-gray-50 dark:divide-[#2a2a2a]">
              {recentCheckIns.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No check-ins yet</p>
              ) : recentCheckIns.map(s => (
                <div key={s.session_id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#333] flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {getInitials(s.full_name || '')}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white truncate">{s.full_name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums flex-shrink-0">
                    {new Date(s.check_in_time).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EVENT META + REG LINK ── */}
        <div className="flex gap-3 flex-shrink-0">
          {[
            { label: 'Date', value: new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Time', value: `${event.start_time} — ${event.end_time}` },
            { label: 'Venue', value: event.venue },
            { label: 'Capacity', value: `${confirmedCount} / ${event.capacity ?? '∞'}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-5 py-3">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{value}</p>
            </div>
          ))}
          {/* Registration Link */}
          <div className="flex-[2] bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-5 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Registration Link</p>
              <p className="text-sm text-[#DC143C] font-mono truncate">{window.location.origin}/register/{event.event_id}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-[#DC143C] hover:text-[#DC143C] transition-all flex-shrink-0"
            >
              <CopyIcon />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* ── FILTER ROW ── */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">Filters</span>
          {(['all', 'checked_in', 'checked_out', 'flagged'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filterStatus === f
                  ? 'bg-[#DC143C] border-[#DC143C] text-white shadow-sm shadow-red-200'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#DC143C] hover:text-[#DC143C]'
              }`}
            >
              {f === 'all' ? 'All' : f === 'checked_in' ? 'Checked In' : f === 'checked_out' ? 'Checked Out' : 'Flagged'}
            </button>
          ))}

          {/* Search */}
          <div className="relative flex-1 ml-1">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, agent code, branch…"
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchIcon />
            </span>
          </div>
        </div>

        {/* ── TABS + TABLE ── */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-[#DC143C] text-[#DC143C]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table content */}
          <div className="flex-1 overflow-auto">

            {/* ── PARTICIPANTS ── */}
            {activeTab === 'participants' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                  <tr>
                    {['Agent Code', 'Full Name', 'Branch', 'Team', 'Status', 'Registered At', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                  {participants.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500">No participants registered yet.</td></tr>
                  ) : participants.map(p => (
                    <tr key={p.participant_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#DC143C] text-xs tracking-wide font-mono">{p.agent_code}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-white">{p.full_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{p.branch_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-[#DC143C] text-xs font-bold">{p.team_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.registration_status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {p.registration_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">{new Date(p.registered_at).toLocaleString('en-PH')}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleCancel(p.participant_id)} className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── ATTENDANCE ── */}
            {activeTab === 'attendance' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                  <tr>
                    {['Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status', ...(isAdmin ? ['Override'] : [])].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                  {filteredSessions.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-16 text-gray-400 dark:text-gray-500">No attendance sessions found.</td></tr>
                  ) : filteredSessions.map(s => (
                    <tr key={s.session_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#DC143C] text-xs tracking-wide font-mono">{s.agent_code}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-white">{s.full_name}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{s.branch_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50 text-[#DC143C] text-xs font-bold">{s.team_name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">{new Date(s.check_in_time).toLocaleString('en-PH')}</td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">{s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          s.check_out_method === 'early_out' ? 'bg-yellow-100 text-yellow-700' :
                          s.check_out_time ? 'bg-gray-100 text-gray-600' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {s.check_out_method === 'early_out' ? 'Early Out' : s.check_out_time ? 'Completed' : 'Inside'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex gap-1.5">
                            <OverrideBtn label="Fix In" color="blue" onClick={() => openModal('fix_checkin', s)} />
                            {!s.check_out_time && <OverrideBtn label="Force Out" color="orange" onClick={() => openModal('force_checkout', s)} />}
                            <OverrideBtn label="Early Out" color="yellow" onClick={() => openModal('early_out', s)} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── SCAN LOGS ── */}
            {activeTab === 'scanlogs' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                  <tr>
                    {['Agent Code', 'Full Name', 'Type', 'Denial Reason', 'Scanned At'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                  {scanLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-16 text-gray-400 dark:text-gray-500">No scan logs yet.</td></tr>
                  ) : scanLogs.map(s => (
                    <tr key={s.scan_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-[#DC143C] text-xs tracking-wide font-mono">{s.agent_code || s.qr_token}</span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-white">{s.full_name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          s.scan_type === 'check_in' ? 'bg-green-100 text-green-700' :
                          s.scan_type === 'check_out' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {s.scan_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{s.denial_reason || '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">{new Date(s.scanned_at).toLocaleString('en-PH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── OVERRIDES ── */}
            {activeTab === 'overrides' && isAdmin && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                  <tr>
                    {['Participant', 'Type', 'Reason', 'Original Time', 'Adjusted Time', 'Done By', 'At'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                  {overrideLogs.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500">No overrides recorded yet.</td></tr>
                  ) : overrideLogs.map(o => (
                    <tr key={o.override_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-800 dark:text-white">{o.full_name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{o.agent_code}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          o.override_type === 'fix_checkin' ? 'bg-blue-100 text-blue-700' :
                          o.override_type === 'force_checkout' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {o.override_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs max-w-[200px] truncate">{o.reason}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">{o.original_time ? new Date(o.original_time).toLocaleString('en-PH') : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">{o.adjusted_time ? new Date(o.adjusted_time).toLocaleString('en-PH') : '—'}</td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">{o.admin_name}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">{new Date(o.created_at).toLocaleString('en-PH')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ── REPORTS ── */}
            {activeTab === 'reports' && (
              <div className="p-6 space-y-5">
                {/* Summary */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Event Summary</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Total Registered', value: confirmedCount, color: 'text-gray-800' },
                      { label: 'Currently Inside', value: checkedInCount, color: 'text-green-600' },
                      { label: 'Checked Out', value: completedCount, color: 'text-blue-600' },
                      { label: 'Attendance Rate', value: `${confirmedCount > 0 ? Math.round((completedCount / confirmedCount) * 100) : 0}%`, color: 'text-[#DC143C]' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 dark:bg-[#171717] rounded-xl p-4 text-center border border-gray-100 dark:border-[#2a2a2a]">
                        <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exports */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">Export Reports</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Download data as CSV files.</p>
                  <div className="space-y-2.5">
                    {[
                      { title: 'Participants List', desc: `${confirmedCount} confirmed participants`, color: 'bg-blue-600 hover:bg-blue-700', action: exportParticipants },
                      { title: 'Attendance Report', desc: `${sessions.length} sessions with check-in/out times`, color: 'bg-green-600 hover:bg-green-700', action: exportAttendance },
                      { title: 'Scan Logs', desc: `${scanLogs.length} total scan attempts`, color: 'bg-gray-600 hover:bg-gray-700', action: exportScanLogs },
                    ].map(({ title, desc, color, action }) => (
                      <div key={title} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#171717] rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                        </div>
                        <button onClick={action} className={`${color} text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors`}>
                          Export CSV
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#171717] flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {activeTab === 'participants' && `${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
              {activeTab === 'attendance' && `${filteredSessions.length} of ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
              {activeTab === 'scanlogs' && `${scanLogs.length} scan log${scanLogs.length !== 1 ? 's' : ''}`}
              {activeTab === 'overrides' && `${overrideLogs.length} override${overrideLogs.length !== 1 ? 's' : ''}`}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">Auto-refreshes every 30 seconds</span>
          </div>
        </div>
      </div>

      </div>{/* end flex-1 */}

      {/* ── OVERRIDE MODAL ── */}
      {modal.type && modal.session && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            {/* Colored top bar */}
            <div className={`h-1.5 w-full ${
              modal.type === 'fix_checkin' ? 'bg-blue-500' :
              modal.type === 'force_checkout' ? 'bg-orange-500' :
              'bg-yellow-500'
            }`} />

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                  {modal.type === 'fix_checkin' && 'Fix Check-in Time'}
                  {modal.type === 'force_checkout' && 'Force Check-out'}
                  {modal.type === 'early_out' && 'Mark Early Out'}
                </h3>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XIcon />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-[#171717] rounded-xl p-3.5 mb-4 border border-gray-100 dark:border-[#2a2a2a]">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{modal.session.full_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{modal.session.agent_code}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Check-in: {new Date(modal.session.check_in_time).toLocaleString('en-PH')}</p>
                {modal.session.check_out_time && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Check-out: {new Date(modal.session.check_out_time).toLocaleString('en-PH')}</p>
                )}
              </div>

              {overrideError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-sm mb-4">{overrideError}</div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {modal.type === 'fix_checkin' ? 'Corrected Check-in Time' :
                     modal.type === 'force_checkout' ? 'Check-out Time' : 'Adjusted Check-out Time'}
                  </label>
                  <input type="datetime-local" value={overrideForm.adjusted_time}
                    onChange={e => setOverrideForm({ ...overrideForm, adjusted_time: e.target.value })}
                    className="w-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/10 transition-all"
                  />
                </div>

                {modal.type === 'early_out' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Early Out Cutoff Time
                      <span className="text-xs font-normal text-gray-400 ml-1">(anyone who left before this is early out)</span>
                    </label>
                    <input type="datetime-local" value={overrideForm.early_out_cutoff}
                      onChange={e => setOverrideForm({ ...overrideForm, early_out_cutoff: e.target.value })}
                      className="w-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/10 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Reason <span className="text-[#DC143C]">*</span>
                  </label>
                  <textarea rows={3} value={overrideForm.reason}
                    onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                    placeholder="Explain why this override is needed…"
                    className="w-full border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-gray-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#DC143C] focus:ring-2 focus:ring-[#DC143C]/10 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border-2 border-gray-200 dark:border-[#2a2a2a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
                  Cancel
                </button>
                <button onClick={handleOverrideSubmit}
                  disabled={overrideLoading || !overrideForm.adjusted_time || !overrideForm.reason}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    modal.type === 'fix_checkin' ? 'bg-blue-600 hover:bg-blue-700' :
                    modal.type === 'force_checkout' ? 'bg-orange-500 hover:bg-orange-600' :
                    'bg-yellow-500 hover:bg-yellow-600'
                  }`}>
                  {overrideLoading ? 'Saving…' : 'Confirm Override'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

interface StatCardProps {
  num: number
  label: string
  accent: boolean
  barWidth: number
  icon: React.ReactNode
  iconRed?: boolean
}

function StatCard({ num, label, accent, barWidth, icon, iconRed }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className={`absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center ${iconRed ? 'bg-red-50 text-[#DC143C]' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
        {icon}
      </div>
      <div className={`text-[48px] font-extrabold tracking-tight leading-none mb-1.5 ${accent ? 'text-[#DC143C]' : 'text-gray-800 dark:text-white'}`}>{num}</div>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
        <div className="h-full bg-[#DC143C] transition-all" style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  )
}

interface OverrideBtnProps {
  label: string
  color: 'blue' | 'orange' | 'yellow'
  onClick: () => void
}

function OverrideBtn({ label, color, onClick }: OverrideBtnProps) {
  const colors = {
    blue: 'text-blue-600 border-blue-200 hover:bg-blue-50',
    orange: 'text-orange-600 border-orange-200 hover:bg-orange-50',
    yellow: 'text-yellow-600 border-yellow-200 hover:bg-yellow-50',
  }
  return (
    <button onClick={onClick} className={`text-xs font-semibold border px-2.5 py-1 rounded-lg transition-colors ${colors[color]}`}>
      {label}
    </button>
  )
}