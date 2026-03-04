import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { getParticipantsByEventApi, cancelParticipantApi, setAwardeeApi } from '../../api/participants.api'
import { getSessionsByEventApi, getScanLogsByEventApi } from '../../api/scan.api'
import { Event, Participant, AttendanceSession, ScanLog } from '../../types'
import Sidebar from '../../components/Sidebar'

type TabType = 'participants' | 'attendance' | 'scanlogs'


// Label options for participants
const LABEL_OPTIONS = ['Awardee', 'VIP', 'Special Guest', 'Speaker', 'Sponsor', 'Staff', 'Custom…']

// ── Icons ──
const ScannerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
  </svg>
)
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

// ── Helper: is event currently happening? ──
function isEventOngoing(event: Event): boolean {
  const now = new Date()
  const eventDateStr = event.event_date.slice(0, 10) // YYYY-MM-DD
  const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
  if (eventDateStr !== todayStr) return false

  // Check if current time is between start_time and end_time
  if (!event.start_time || !event.end_time) return true // if no times set, just check date
  const [sh, sm] = event.start_time.split(':').map(Number)
  const [eh, em] = event.end_time.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes
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
  const [activeTab, setActiveTab] = useState<TabType>('participants')
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out' | 'flagged'>('all')
  const [copied, setCopied] = useState(false)


  // Label modal — replaces awardee modal, now customizable
  const [labelModal, setLabelModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [labelType, setLabelType] = useState('Awardee')
  const [labelCustom, setLabelCustom] = useState('')
  const [labelLoading, setLabelLoading] = useState(false)

  // Export dropdown state
  const [exportDropdown, setExportDropdown] = useState<TabType | null>(null)


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

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) fetchData()
    }, 30000)
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchData()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchData])

  // ── Label (participant tag) handlers ──
  const openLabelModal = (p: Participant) => {
    setLabelModal({ open: true, participant: p })
    const existingLabel = p.label_description || 'Awardee'
    if (LABEL_OPTIONS.includes(existingLabel)) {
      setLabelType(existingLabel)
      setLabelCustom('')
    } else {
      setLabelType('Custom…')
      setLabelCustom(existingLabel)
    }
  }

  const handleSetLabel = async (enable: boolean) => {
    if (!labelModal.participant) return
    setLabelLoading(true)
    const description = enable ? (labelType === 'Custom…' ? labelCustom : labelType) : null
    try {
      await setAwardeeApi(labelModal.participant.participant_id, {
        label: enable,
        label_description: description
      })
      await fetchData()
      setLabelModal({ open: false, participant: null })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update label')
    } finally {
      setLabelLoading(false)
    }
  }

  const handleCancel = async (participant_id: number) => {
    if (!confirm('Cancel this participant?')) return
    try {
      await cancelParticipantApi(participant_id)
      setParticipants(prev => prev.filter(p => p.participant_id !== participant_id))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel participant')
    }
  }


  // ── Export / Report helpers ──
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = filename; link.click()
    URL.revokeObjectURL(url)
  }

  const downloadTXT = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = filename; link.click()
    URL.revokeObjectURL(url)
  }

  const buildReportContent = (docType: 'participants' | 'attendance' | 'scanlogs', format: 'csv' | 'txt'): { filename: string; headers?: string[]; rows?: string[][]; content?: string } => {
    const eventName = event?.title || `Event ${eventId}`
    const dateStr = new Date().toLocaleDateString('en-PH')

    const summary = [
      `Event: ${eventName}`,
      `Date: ${event ? new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}`,
      `Venue: ${event?.venue || 'N/A'}`,
      `Report Generated: ${dateStr}`,
      ``,
      `=== SUMMARY ===`,
      `Total Registered: ${confirmedCount}`,
      `Checked In: ${sessions.length}`,
      `Currently Inside: ${checkedInCount}`,
      `Checked Out: ${completedCount}`,
      `Early Outs: ${earlyOutCount}`,
      `No-Shows: ${noShowCount < 0 ? 0 : noShowCount}`,
      `Attendance Rate: ${confirmedCount > 0 ? Math.round((completedCount / confirmedCount) * 100) : 0}%`,
      ``,
      `=== RECORDS ===`,
    ].join('\n')

    if (docType === 'participants') {
      const headers = ['Participant ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Status', 'Label', 'Label Description', 'Registered At']
      const rows = participants.map(p => [
        String(p.participant_id), p.agent_code, p.full_name, p.branch_name, p.team_name,
        p.registration_status, p.label ? 'Yes' : 'No', p.label_description || '', new Date(p.registered_at).toLocaleString('en-PH')
      ])
      if (format === 'csv') return { filename: `participants-${eventId}-${dateStr}.csv`, headers, rows }
      const lines = [summary, headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
      return { filename: `participants-${eventId}-${dateStr}.txt`, content: lines }
    }

    if (docType === 'attendance') {
      const headers = ['Session ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status']
      const rows = sessions.map(s => [
        String(s.session_id), s.agent_code, s.full_name, s.branch_name, s.team_name,
        new Date(s.check_in_time).toLocaleString('en-PH'),
        s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : 'Not yet checked out',
        s.check_out_method === 'early_out' ? 'Early Out' : s.check_out_time ? 'Completed' : 'Inside'
      ])
      if (format === 'csv') return { filename: `attendance-${eventId}-${dateStr}.csv`, headers, rows }
      const lines = [summary, headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
      return { filename: `attendance-${eventId}-${dateStr}.txt`, content: lines }
    }

    if (docType === 'scanlogs') {
      const headers = ['Scan ID', 'Agent Code', 'Full Name', 'Scan Type', 'Denial Reason', 'Scanned At']
      const rows = scanLogs.map(s => [
        String(s.scan_id), s.agent_code || 'Unknown', s.full_name || 'Unknown',
        s.scan_type, s.denial_reason || '', new Date(s.scanned_at).toLocaleString('en-PH')
      ])
      if (format === 'csv') return { filename: `scanlogs-${eventId}-${dateStr}.csv`, headers, rows }
      const lines = [summary, headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
      return { filename: `scanlogs-${eventId}-${dateStr}.txt`, content: lines }
    }

    // fallback
    return { filename: `report-${eventId}-${dateStr}.csv`, headers: [], rows: [] }
  }

  const handleExport = (docType: 'participants' | 'attendance' | 'scanlogs', format: 'csv' | 'txt') => {
    const built = buildReportContent(docType, format)
    if (format === 'csv' && built.headers && built.rows) {
      downloadCSV(built.filename, built.headers, built.rows)
    } else if (format === 'txt' && built.content) {
      downloadTXT(built.filename, built.content)
    }
    setExportDropdown(null)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register/${event?.event_id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Computed stats ──
  const confirmedCount = participants.filter(p => p.registration_status === 'confirmed').length
  const checkedInCount = sessions.filter(s => s.check_in_time && !s.check_out_time).length
  const completedCount = sessions.filter(s => s.check_in_time && s.check_out_time).length
  const earlyOutCount = sessions.filter(s => s.check_out_method === 'early_out').length
  const noShowCount = confirmedCount - sessions.length

  const recentCheckIns = [...sessions]
    .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
    .slice(0, 6)

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // Participants who have NOT checked in yet
  const checkedInParticipantIds = new Set(sessions.map(s => s.participant_id))

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

  const ongoing = isEventOngoing(event)

  const tabs: { key: TabType; label: string }[] = [
    { key: 'participants', label: `Participants (${confirmedCount})` },
    { key: 'attendance', label: `Attendance (${sessions.length})` },
    { key: 'scanlogs', label: `Scan Logs (${scanLogs.length})` },
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

            {/* Ongoing indicator */}
            {ongoing && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
            )}

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

          {/* ── STATS + RECENT ── */}
          <div className="flex gap-5 flex-shrink-0">
            <div className="flex-1 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <StatCard num={confirmedCount} label="Registered" accent={false} barWidth={100} icon={<UsersIcon />} />
                <StatCard num={checkedInCount} label="Checked In" accent={true}
                  barWidth={confirmedCount ? Math.round((checkedInCount / confirmedCount) * 100) : 0}
                  icon={<CheckIcon />} iconRed />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatCard num={completedCount} label="Checked Out" accent={false}
                  barWidth={confirmedCount ? Math.round((completedCount / confirmedCount) * 100) : 0}
                  icon={<LogoutIcon />} />
                <StatCard num={noShowCount < 0 ? 0 : noShowCount} label="No-Shows" accent={false} barWidth={0} icon={<AlertIcon />} />
                <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
                    <AlertIcon />
                  </div>
                  <div className="text-[48px] font-extrabold text-yellow-500 tracking-tight leading-none mb-1.5">{earlyOutCount}</div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Early Out
                    <span className="block text-xs font-semibold text-yellow-500 mt-0.5">Flagged</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
                    <div className="h-full bg-yellow-400" style={{ width: `${confirmedCount ? Math.round((earlyOutCount / confirmedCount) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Check-In */}
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
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterStatus === f
                  ? 'bg-[#DC143C] border-[#DC143C] text-white shadow-sm shadow-red-200'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#DC143C] hover:text-[#DC143C]'
                  }`}
              >
                {f === 'all' ? 'All' : f === 'checked_in' ? 'Checked In' : f === 'checked_out' ? 'Checked Out' : 'Flagged'}
              </button>
            ))}
            <div className="relative flex-1 ml-1">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, agent code, branch…"
                className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
            </div>
          </div>

          {/* ── TABS + TABLE ── */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => { setActiveTab(tab.key); setExportDropdown(null) }}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${activeTab === tab.key
                    ? 'border-[#DC143C] text-[#DC143C]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}>
                  {tab.label}
                </button>
              ))}
              <div className="flex-1" />
              {/* Export button for current tab */}
              <div className="relative mb-1">
                <button
                  onClick={() => setExportDropdown(exportDropdown === activeTab ? null : activeTab)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:border-[#DC143C] hover:text-[#DC143C] transition-all"
                >
                  <DownloadIcon />
                  Export
                </button>
                {exportDropdown === activeTab && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
                    <button
                      onClick={() => handleExport(activeTab as 'participants' | 'attendance' | 'scanlogs', 'csv')}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                      <DownloadIcon /> Export CSV
                    </button>
                    <button
                      onClick={() => handleExport(activeTab as 'participants' | 'attendance' | 'scanlogs', 'txt')}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    >
                      <DownloadIcon /> Export TXT
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Table content */}
            <div className="flex-1 overflow-auto">

              {/* ── PARTICIPANTS ── */}
              {activeTab === 'participants' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                    <tr>
                      {['Agent Code', 'Full Name', 'Branch', 'Team', 'Status', 'Label', 'Registered At', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {participants.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-16 text-gray-400 dark:text-gray-500">No participants registered yet.</td></tr>
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
                        {/* Customizable label column */}
                        <td className="px-5 py-3.5">
                          {p.label && p.label_description ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              <TagIcon />
                              {p.label_description}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">{new Date(p.registered_at).toLocaleString('en-PH')}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex gap-2">
                            {/* Label button */}
                            {(isAdmin || user.role === 'staff') && (
                              <button
                                onClick={() => openLabelModal(p)}
                                className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${p.label ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                              >
                                {p.label ? '🏷 Edit Label' : '🏷 Add Label'}
                              </button>
                            )}
                            <button onClick={() => handleCancel(p.participant_id)} className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">Cancel</button>
                          </div>
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
                      {['Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filteredSessions.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500">No attendance sessions found.</td></tr>
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
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.check_out_method === 'early_out' ? 'bg-yellow-100 text-yellow-700' :
                            s.check_out_time ? 'bg-gray-100 text-gray-600' :
                              'bg-green-100 text-green-700'
                            }`}>
                            {s.check_out_method === 'early_out' ? 'Early Out' : s.check_out_time ? 'Completed' : 'Inside'}
                          </span>
                          {s.check_out_method === 'early_out' && s.early_out_reason && (
                            <div className="text-xs text-yellow-600 mt-1 max-w-[140px] truncate" title={s.early_out_reason}>
                              {s.early_out_reason}
                            </div>
                          )}
                        </td>
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
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.scan_type === 'check_in' ? 'bg-green-100 text-green-700' :
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




            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#171717] flex-shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {activeTab === 'participants' && `${participants.length} participant${participants.length !== 1 ? 's' : ''}`}
                {activeTab === 'attendance' && `${filteredSessions.length} of ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
                {activeTab === 'scanlogs' && `${scanLogs.length} scan log${scanLogs.length !== 1 ? 's' : ''}`}

              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">Auto-refreshes every 30 seconds</span>
            </div>
          </div>
        </div>

      </div>{/* end flex-1 */}


      {/* ── LABEL MODAL ── */}
      {labelModal.open && labelModal.participant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {labelModal.participant.label ? 'Edit Label' : 'Add Label'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {labelModal.participant.full_name} · {labelModal.participant.agent_code}
            </p>

            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Label Type</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {LABEL_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setLabelType(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${labelType === opt ? 'bg-[#DC143C] border-[#DC143C] text-white' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C]'}`}>
                  {opt}
                </button>
              ))}
            </div>

            {labelType === 'Custom…' && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Custom Label</label>
                <input type="text" value={labelCustom} onChange={e => setLabelCustom(e.target.value)}
                  placeholder="e.g. Best Agent, Million Club…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-white text-sm outline-none focus:border-[#DC143C]"
                />
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={() => setLabelModal({ open: false, participant: null })}
                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#333333] transition-all">
                Cancel
              </button>
              {labelModal.participant.label && (
                <button onClick={() => handleSetLabel(false)} disabled={labelLoading}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-[#333333] transition-all disabled:opacity-50">
                  Remove Label
                </button>
              )}
              <button onClick={() => handleSetLabel(true)} disabled={labelLoading || (labelType === 'Custom…' && !labelCustom.trim())}
                className="flex-1 px-4 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg disabled:opacity-50">
                {labelLoading ? 'Saving...' : '🏷 Confirm Label'}
              </button>
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