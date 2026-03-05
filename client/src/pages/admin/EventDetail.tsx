import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { getEventByIdApi, updateEventStatusApi } from '../../api/events.api'
import { getParticipantsByEventApi, cancelParticipantApi, setLabelApi } from '../../api/participants.api'
import { getSessionsByEventApi, getScanLogsByEventApi } from '../../api/scan.api'
import { Event, Participant, AttendanceSession, ScanLog } from '../../types'
import Sidebar from '../../components/Sidebar'

type TabType = 'registrants' | 'attendance' | 'scanlogs' | 'reports'

const LABEL_OPTIONS = ['Awardee', 'VIP', 'Sponsor', 'Speaker', 'Staff', 'Custom…']

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string }> = {
  'Awardee':  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  darkBg: 'dark:bg-amber-900/30',  darkText: 'dark:text-amber-300' },
  'VIP':      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  'Sponsor':  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-300' },
  'Speaker':  { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-300',   darkBg: 'dark:bg-teal-900/30',   darkText: 'dark:text-teal-300' },
  'Staff':    { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300',   darkBg: 'dark:bg-gray-800',      darkText: 'dark:text-gray-300' },
}
const getLabelColor = (label: string) => LABEL_COLORS[label] ?? { bg: 'bg-red-100', text: 'text-[#DC143C]', border: 'border-red-300', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' }

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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
  </svg>
)
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

// ── Helper: is event currently happening? ──
function isEventOngoing(event: Event): boolean {
  const now = new Date()
  const eventDateStr = event.event_date.slice(0, 10)
  const todayStr = now.toLocaleDateString('en-CA')
  if (eventDateStr !== todayStr) return false
  if (!event.start_time || !event.end_time) return true
  const [sh, sm] = event.start_time.split(':').map(Number)
  const [eh, em] = event.end_time.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes
}

// ── Helper: has event ended? ──
function isEventEnded(event: Event): boolean {
  const now = new Date()
  const eventDateStr = event.event_date.slice(0, 10)
  const todayStr = now.toLocaleDateString('en-CA')
  if (eventDateStr > todayStr) return false
  if (eventDateStr < todayStr) return true
  if (!event.end_time) return false
  const [eh, em] = event.end_time.split(':').map(Number)
  const endMinutes = eh * 60 + em
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes > endMinutes
}

// ── Registrant Action Dropdown ──
function RegistrantDropdown({ participant, onLabel, onRemove }: {
  participant: Participant
  onLabel: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, dropUp: false })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.closest('[data-dropdown]')?.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const dropUp = window.innerHeight - rect.bottom < 120
      setPos({ top: dropUp ? rect.top - 8 : rect.bottom + 4, left: rect.right - 176, dropUp })
    }
    setOpen(p => !p)
  }

  return (
    <div data-dropdown>
      <button ref={btnRef} onClick={handleOpen}
        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded">
        <DotsIcon />
      </button>
      {open && (
        <div style={{
          position: 'fixed',
          top: pos.dropUp ? undefined : pos.top,
          bottom: pos.dropUp ? window.innerHeight - pos.top : undefined,
          left: pos.left, zIndex: 9999,
        }} className="w-44 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden">
          <button onClick={() => { setOpen(false); onLabel() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
            <TagIcon />
            {participant.label ? 'Edit Label' : 'Add Label'}
          </button>
          <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mx-2" />
          <button onClick={() => { setOpen(false); onRemove() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <TrashIcon />
            Remove Registrant
          </button>
        </div>
      )}
    </div>
  )
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
  const [activeTab, setActiveTab] = useState<TabType>('registrants')
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out' | 'flagged'>('all')
  const [copied, setCopied] = useState(false)
  const [statusToggling, setStatusToggling] = useState(false)

  // Label modal
  const [labelModal, setLabelModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [labelType, setLabelType] = useState('Awardee')
  const [labelCustom, setLabelCustom] = useState('')
  const [labelLoading, setLabelLoading] = useState(false)
  const [labelViewModal, setLabelViewModal] = useState<{ open: boolean; participant: Participant | null; editMode: boolean }>({ open: false, participant: null, editMode: false })
  const [labelNote, setLabelNote] = useState('')

  // Remove registrant confirmation modal
  const [removeModal, setRemoveModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [removeLoading, setRemoveLoading] = useState(false)

  // ── Per-tab search, sort, filter states ──
  const [registrantsSearch, setRegistrantsSearch] = useState('')
  const [registrantsSort, setRegistrantsSort] = useState<'name' | 'date'>('date')
  const [registrantsSortOpen, setRegistrantsSortOpen] = useState(false)
  const registrantsSortRef = useRef<HTMLDivElement>(null)

  const [attendanceSearch, setAttendanceSearch] = useState('')
  const [attendanceSort, setAttendanceSort] = useState<'checkin' | 'name'>('checkin')
  const [attendanceSortOpen, setAttendanceSortOpen] = useState(false)
  const attendanceSortRef = useRef<HTMLDivElement>(null)

  const [scanlogsSearch, setScanlogsSearch] = useState('')
  const [scanlogsSort, setScanlogsSort] = useState<'latest' | 'oldest'>('latest')
  const [scanlogsSortOpen, setScanlogsSortOpen] = useState(false)
  const [scanlogsType, setScanlogsType] = useState<'all' | 'check_in' | 'check_out' | 'denied'>('all')
  const scanlogsSortRef = useRef<HTMLDivElement>(null)

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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  // Close sort dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (registrantsSortRef.current && !registrantsSortRef.current.contains(e.target as Node)) setRegistrantsSortOpen(false)
      if (attendanceSortRef.current && !attendanceSortRef.current.contains(e.target as Node)) setAttendanceSortOpen(false)
      if (scanlogsSortRef.current && !scanlogsSortRef.current.contains(e.target as Node)) setScanlogsSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Label handlers ──
  const openLabelView = (p: Participant, editMode = false) => {
    setLabelViewModal({ open: true, participant: p, editMode })
    const existingLabel = (typeof p.label === 'string' ? p.label : null) || 'Awardee'
    if (LABEL_OPTIONS.includes(existingLabel)) {
      setLabelType(existingLabel); setLabelCustom('')
    } else {
      setLabelType('Custom…'); setLabelCustom(existingLabel)
    }
    setLabelNote(p.label_description || '')
  }

  const handleSetLabel = async (enable: boolean) => {
    const activeParticipant = labelModal.participant || labelViewModal.participant
    if (!activeParticipant) return
    setLabelLoading(true)
    const labelValue = enable ? (labelType === 'Custom…' ? labelCustom.trim() : labelType) : null
    const descValue = enable ? (labelNote.trim() || null) : null
    try {
      await setLabelApi(activeParticipant.participant_id, { label: labelValue, label_description: descValue })
      await fetchData()
      setLabelModal({ open: false, participant: null })
      setLabelViewModal({ open: false, participant: null, editMode: false })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update label')
    } finally { setLabelLoading(false) }
  }

  // ── Remove registrant ──
  const handleRemoveConfirm = async () => {
    if (!removeModal.participant) return
    setRemoveLoading(true)
    try {
      await cancelParticipantApi(removeModal.participant.participant_id)
      setParticipants(prev => prev.filter(p => p.participant_id !== removeModal.participant!.participant_id))
      setRemoveModal({ open: false, participant: null })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove registrant')
    } finally { setRemoveLoading(false) }
  }

  // ── Registration open/close toggle ──
  const handleStatusToggle = async () => {
    if (!event || !isAdmin) return
    setStatusToggling(true)
    const newStatus = event.status === 'open' ? 'closed' : 'open'
    try {
      await updateEventStatusApi(event.event_id, newStatus)
      setEvent(prev => prev ? { ...prev, status: newStatus as Event['status'] } : prev)
    } catch (err) {
      console.error(err)
    } finally { setStatusToggling(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register/${event?.event_id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Export to XLSX (ExcelJS) ──
  const handleExport = async (docType: TabType) => {
    if (!event) return
    const colorMap: Partial<Record<TabType, string>> = {
      registrants: '023E8A',
      attendance:  '276221',
      scanlogs:    '01796F',
    }
    const headerColor = colorMap[docType]

    const wb = new ExcelJS.Workbook()

    const applyHeader = (ws: ExcelJS.Worksheet, headers: string[]) => {
      ws.addRow(headers)
      const headerRow = ws.getRow(1)
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${headerColor}` } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top:    { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          left:   { style: 'thin', color: { argb: 'FFFFFFFF' } },
          right:  { style: 'thin', color: { argb: 'FFFFFFFF' } },
        }
      })
      headerRow.height = 22
      ws.columns = headers.map(() => ({ width: 26 }))
    }

    const styleDataRows = (ws: ExcelJS.Worksheet) => {
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        row.eachCell(cell => {
          cell.alignment = { vertical: 'middle', wrapText: false }
          cell.border = {
            top:    { style: 'hair', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
            left:   { style: 'hair', color: { argb: 'FFE5E7EB' } },
            right:  { style: 'hair', color: { argb: 'FFE5E7EB' } },
          }
        })
        row.height = 18
      })
    }

    if (docType === 'registrants') {
      const ws = wb.addWorksheet('Registrants')
      const headers = ['Participant ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Status', 'Registered At']
      applyHeader(ws, headers)
      participants.forEach(p => {
        ws.addRow([
          p.participant_id, p.agent_code, p.full_name, p.branch_name, p.team_name,
          p.registration_status, new Date(p.registered_at).toLocaleString('en-PH')
        ])
      })
      styleDataRows(ws)
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${event?.title?.replace(/\s+/g, '_') ?? eventId}_RegistrationReport.xlsx`; a.click()
      URL.revokeObjectURL(url)
    }

    if (docType === 'attendance') {
      const ws = wb.addWorksheet('Attendance')
      const headers = ['Session ID', 'Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status']
      applyHeader(ws, headers)
      sessions.forEach(s => {
        ws.addRow([
          s.session_id, s.agent_code, s.full_name, s.branch_name, s.team_name,
          new Date(s.check_in_time).toLocaleString('en-PH'),
          s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : 'Not yet checked out',
          s.check_out_method === 'early_out' ? 'Early Out' : s.check_out_time ? 'Completed' : 'Inside'
        ])
      })
      styleDataRows(ws)
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${event?.title?.replace(/\s+/g, '_') ?? eventId}_AttendanceReport.xlsx`; a.click()
      URL.revokeObjectURL(url)
    }

    if (docType === 'scanlogs') {
      const ws = wb.addWorksheet('Scan Logs')
      const headers = ['Scan ID', 'Agent Code', 'Full Name', 'Scan Type', 'Denial Reason', 'Scanned At']
      applyHeader(ws, headers)
      scanLogs.forEach(s => {
        ws.addRow([
          s.scan_id, s.agent_code || 'Unknown', s.full_name || 'Unknown',
          s.scan_type, s.denial_reason || '', new Date(s.scanned_at).toLocaleString('en-PH')
        ])
      })
      styleDataRows(ws)
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${event?.title?.replace(/\s+/g, '_') ?? eventId}_ScanLogsReport.xlsx`; a.click()
      URL.revokeObjectURL(url)
    }

  }

  // ── Computed stats ──
  const confirmedCount  = participants.filter(p => p.registration_status === 'confirmed').length
  // FIX #1: currently inside = checked in but NOT yet checked out
  const checkedInCount  = sessions.filter(s => s.check_in_time && !s.check_out_time).length
  const completedCount  = sessions.filter(s => s.check_in_time && s.check_out_time).length
  const earlyOutCount   = sessions.filter(s => s.check_out_method === 'early_out').length
  const totalAttended   = sessions.length
  // FIX #2: no-shows only shown after event ends
  const noShowCount     = Math.max(0, confirmedCount - totalAttended)

  const recentCheckIns = [...sessions]
    .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
    .slice(0, 6)

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()



  // ── Filtered & sorted registrants ──
  const filteredRegistrants = participants
    .filter(p => {
      if (!registrantsSearch.trim()) return true
      const q = registrantsSearch.toLowerCase()
      return p.full_name?.toLowerCase().includes(q) || p.agent_code?.toLowerCase().includes(q) || p.branch_name?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (registrantsSort === 'name') return a.full_name.localeCompare(b.full_name)
      return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
    })

  // ── Filtered & sorted attendance ──
  const filteredAttendanceSorted = sessions
    .filter(s => {
      const matchSearch = !attendanceSearch.trim() ||
        s.full_name?.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        s.agent_code?.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        s.branch_name?.toLowerCase().includes(attendanceSearch.toLowerCase())
      const matchFilter =
        filterStatus === 'all' ? true :
        filterStatus === 'checked_in'  ? (s.check_in_time && !s.check_out_time) :
        filterStatus === 'checked_out' ? !!s.check_out_time :
        filterStatus === 'flagged'     ? s.check_out_method === 'early_out' : true
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (attendanceSort === 'name') return (a.full_name || '').localeCompare(b.full_name || '')
      return new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()
    })

  // ── Filtered & sorted scan logs ──
  const filteredScanLogs = scanLogs
    .filter(s => {
      const matchSearch = !scanlogsSearch.trim() ||
        s.full_name?.toLowerCase().includes(scanlogsSearch.toLowerCase()) ||
        s.agent_code?.toLowerCase().includes(scanlogsSearch.toLowerCase())
      const matchType =
        scanlogsType === 'all' ? true :
        scanlogsType === 'denied' ? s.scan_type === 'denied' :
        s.scan_type === scanlogsType
      return matchSearch && matchType
    })
    .sort((a, b) => {
      const diff = new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
      return scanlogsSort === 'latest' ? diff : -diff
    })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      upcoming:  'bg-blue-100 text-blue-700',
      ongoing:   'bg-green-100 text-green-700',
      draft:     'bg-gray-100 text-gray-600',
      completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
      open:      'bg-green-100 text-green-700',
      closed:    'bg-gray-100 text-gray-600',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
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
  const ended   = isEventEnded(event)
  const isOpen  = event.status === 'open'

  const tabs: { key: TabType; label: string }[] = [
    { key: 'registrants', label: `Registrants (${confirmedCount})` },
    { key: 'attendance',  label: `Attendance (${sessions.length})` },
    { key: 'scanlogs',   label: `Scan Logs (${scanLogs.length})` },
    { key: 'reports',    label: 'Reports' },
  ]

  return (
    <div className="min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f] flex">
      <Sidebar userRole={isAdmin ? 'admin' : 'staff'} />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ── HEADER ── */}
        <header className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a] shadow-sm flex-shrink-0">
          <div className="px-12 h-[76px] flex items-center gap-4">
            <button onClick={() => navigate('/admin/events')}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors mr-2">
              <ArrowLeftIcon />
              <span className="font-medium">Back</span>
            </button>

            <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              {event.title.split(' ').map((word, i) =>
                i === 0
                  ? <span key={i}>{word}<span className="text-[#DC143C]">.</span></span>
                  : <span key={i}> {word}</span>
              )}
            </h1>

            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadge(event.status)}`}>
              {event.status.toUpperCase()}
            </span>

            {ongoing && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                LIVE
              </span>
            )}

            <div className="flex-1" />

            {/* #7 Check-in Station button */}
            <button
              onClick={() => navigate(`/admin/events/${eventId}/scanner`)}
              className="flex items-center gap-2 bg-[#DC143C] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#b01030] transition-all shadow-[0_4px_16px_rgba(220,20,60,0.22)]">
              <ScannerIcon />
              Check-in Station
            </button>
          </div>
        </header>

        {/* ── EVENT INFO BAR ── */}
        <div className="bg-[#fafafa] dark:bg-[#161616] border-b border-gray-200 dark:border-[#2a2a2a] px-12 py-2.5 flex items-center gap-5 flex-shrink-0">
          {/* Date */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          {/* Time */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">{event.start_time} – {event.end_time}</span>
          </div>
          {event.venue && (
            <>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              {/* Venue */}
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">{event.venue}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col px-12 py-7 gap-5 overflow-hidden">

          {/* ── STATS ── */}
          <div className="flex gap-5 flex-shrink-0">
            <div className="flex-1 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <StatCard num={confirmedCount} label="Registered" accent={false} barWidth={100} icon={<UsersIcon />} />
                {/* FIX #1: Currently Inside */}
                <StatCard num={checkedInCount} label="Currently Inside" accent={true}
                  barWidth={confirmedCount ? Math.round((checkedInCount / confirmedCount) * 100) : 0}
                  icon={<CheckIcon />} iconRed />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {/* Checked Out — gray */}
                <StatCard num={completedCount} label="Checked Out" accent={false}
                  barWidth={confirmedCount ? Math.round((completedCount / confirmedCount) * 100) : 0}
                  icon={<LogoutIcon />} />
                {/* Early Out — gray, no yellow */}
                <StatCard num={earlyOutCount} label="Early Out" accent={false}
                  barWidth={confirmedCount ? Math.round((earlyOutCount / confirmedCount) * 100) : 0}
                  icon={<AlertIcon />} />
                {/* No-Shows — red (critical after event ends, 0 before) */}
                <StatCard num={ended ? noShowCount : 0} label="No-Shows" accent={ended && noShowCount > 0} barWidth={0} icon={<AlertIcon />} iconRed={ended && noShowCount > 0} />
                {/* Attendance Rate — gray */}
                <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-400">
                    <CheckIcon />
                  </div>
                  <div className="text-[48px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none mb-1.5">
                    {confirmedCount > 0 ? `${Math.round((totalAttended / confirmedCount) * 100)}%` : '—'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
                    <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${confirmedCount ? Math.round((totalAttended / confirmedCount) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Check-In */}
            <div className="w-[340px] flex-shrink-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm flex flex-col overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#2a2a2a]">
                <span className="text-sm font-bold text-gray-800 dark:text-white">Recent Check-In</span>
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

          {/* ── REGISTRATION LINK ── */}
          <div className="flex-shrink-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-5 py-4 max-w-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Registration Link</p>
                <div className="flex items-center gap-2 min-w-0">
                  <GlobeIcon />
                  <p className="text-sm text-[#DC143C] font-mono truncate">{window.location.origin}/register/{event.event_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-xl hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                  <CopyIcon />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                {isAdmin && event.status !== 'draft' && (
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-semibold ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {statusToggling ? 'Updating...' : isOpen ? 'Registration Open' : 'Registration Closed'}
                    </span>
                    <button
                      onClick={handleStatusToggle}
                      disabled={statusToggling}
                      className="relative flex-shrink-0 disabled:opacity-60"
                      aria-label="Toggle registration"
                    >
                      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${isOpen ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isOpen ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── TABS + TABLE ── */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">

            {/* Tab bar */}
            <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${activeTab === tab.key
                    ? 'border-[#DC143C] text-[#DC143C]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Table content */}
            <div className="flex-1 overflow-auto">

              {/* ── REGISTRANTS ── */}
              {activeTab === 'registrants' && (
                <>
                  {/* Registrants toolbar */}
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50">
                    <div className="relative flex-1">
                      <input value={registrantsSearch} onChange={e => setRegistrantsSearch(e.target.value)}
                        placeholder="Search name, agent code, branch…"
                        className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
                    </div>
                    <SortDropdown
                      options={[{ value: 'date', label: 'Date Registered' }, { value: 'name', label: 'Name A–Z' }]}
                      value={registrantsSort}
                      onChange={v => setRegistrantsSort(v as any)}
                      dropdownRef={registrantsSortRef}
                      open={registrantsSortOpen}
                      setOpen={setRegistrantsSortOpen}
                    />
                  </div>
                  <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                    <tr>
                      {['Agent Code', 'Full Name', 'Branch', 'Team', 'Registered At', 'Actions'].map(h => (
                        <th key={h} className={`px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap ${h === 'Actions' ? 'text-left pl-2' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filteredRegistrants.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-16 text-gray-400 dark:text-gray-500">No registrants found.</td></tr>
                    ) : filteredRegistrants.map(p => (
                      <tr key={p.participant_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[#DC143C] text-xs tracking-wide font-mono">{p.agent_code}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-white">{p.full_name}</span>
                            {p.label && (() => {
                              const c = getLabelColor(String(p.label))
                              return (
                                <button onClick={() => openLabelView(p)}
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} hover:opacity-80 transition-opacity`}>
                                  {p.label}
                                </button>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{p.branch_name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-sm">{p.team_name}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">
                          {new Date(p.registered_at).toLocaleString('en-PH')}
                        </td>
                        {/* FIX #5: Triple dots dropdown */}
                        <td className="px-5 py-3.5">
                          <RegistrantDropdown
                            participant={p}
                            onLabel={() => openLabelView(p, true)}
                            onRemove={() => setRemoveModal({ open: true, participant: p })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>
              )}

              {/* ── ATTENDANCE ── */}
              {activeTab === 'attendance' && (
                <>
                  {/* Attendance toolbar */}
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50 flex-wrap">
                    {/* Status filters */}
                    <div className="flex items-center gap-1.5">
                      {(['all', 'checked_in', 'checked_out', 'flagged'] as const).map(f => (
                        <button key={f} onClick={() => setFilterStatus(f)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterStatus === f
                            ? 'bg-[#DC143C] border-[#DC143C] text-white'
                            : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                          }`}>
                          {f === 'all' ? 'All' : f === 'checked_in' ? 'Checked In' : f === 'checked_out' ? 'Checked Out' : 'Early Out'}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1 min-w-[180px]">
                      <input value={attendanceSearch} onChange={e => setAttendanceSearch(e.target.value)}
                        placeholder="Search name, agent code…"
                        className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
                    </div>
                    <SortDropdown
                      options={[{ value: 'checkin', label: 'Check-in Time' }, { value: 'name', label: 'Name A–Z' }]}
                      value={attendanceSort}
                      onChange={v => setAttendanceSort(v as any)}
                      dropdownRef={attendanceSortRef}
                      open={attendanceSortOpen}
                      setOpen={setAttendanceSortOpen}
                    />
                  </div>
                  <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                    <tr>
                      {['Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filteredAttendanceSorted.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500">No attendance sessions found.</td></tr>
                    ) : filteredAttendanceSorted.map(s => (
                      <tr key={s.session_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[#DC143C] text-xs tracking-wide font-mono">{s.agent_code}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-white">{s.full_name}</span>
                            {(() => {
                              const p = participants.find(p => p.agent_code === s.agent_code)
                              if (!p?.label) return null
                              const c = getLabelColor(String(p.label))
                              return (
                                <button onClick={() => openLabelView(p)}
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText} hover:opacity-80 transition-opacity`}>
                                  {p.label}
                                </button>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{s.branch_name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-sm">{s.team_name}</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">{new Date(s.check_in_time).toLocaleString('en-PH')}</td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">{s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            s.check_out_method === 'early_out' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            s.check_out_time ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
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
                </>
              )}

              {/* ── SCAN LOGS ── */}
              {activeTab === 'scanlogs' && (
                <>
                  {/* Scan Logs toolbar */}
                  <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50">
                    {/* Type filters */}
                    <div className="flex items-center gap-1.5">
                      {([
                        { value: 'all', label: 'All' },
                        { value: 'check_in', label: 'Check In' },
                        { value: 'check_out', label: 'Check Out' },
                        { value: 'denied', label: 'Denied' },
                      ] as const).map(f => (
                        <button key={f.value} onClick={() => setScanlogsType(f.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${scanlogsType === f.value
                            ? 'bg-[#DC143C] border-[#DC143C] text-white'
                            : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                          }`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1 min-w-[180px]">
                      <input value={scanlogsSearch} onChange={e => setScanlogsSearch(e.target.value)}
                        placeholder="Search name, agent code…"
                        className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
                    </div>
                    <SortDropdown
                      options={[{ value: 'latest', label: 'Latest First' }, { value: 'oldest', label: 'Oldest First' }]}
                      value={scanlogsSort}
                      onChange={v => setScanlogsSort(v as any)}
                      dropdownRef={scanlogsSortRef}
                      open={scanlogsSortOpen}
                      setOpen={setScanlogsSortOpen}
                    />
                  </div>
                  <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                    <tr>
                      {['Agent Code', 'Full Name', 'Type', 'Denial Reason', 'Scanned At'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filteredScanLogs.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-16 text-gray-400 dark:text-gray-500">No scan logs found.</td></tr>
                    ) : filteredScanLogs.map(s => (
                      <tr key={s.scan_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-[#DC143C] text-xs tracking-wide font-mono">{s.agent_code || s.qr_token}</span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-white">{s.full_name || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            s.scan_type === 'check_in'  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            s.scan_type === 'check_out' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
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
                </>
              )}

              {/* ── REPORTS TAB ── */}
              {activeTab === 'reports' && (
                <div className="p-6 flex flex-col gap-5">
                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Event Summary</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Registered', value: confirmedCount },
                        { label: 'Total Attended', value: totalAttended },
                        { label: 'Attendance Rate', value: confirmedCount > 0 ? `${Math.round((totalAttended / confirmedCount) * 100)}%` : '—' },
                        { label: 'Currently Inside', value: checkedInCount },
                        { label: 'Early Outs', value: earlyOutCount },
                        { label: 'No-Shows', value: ended ? noShowCount : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 dark:bg-[#171717] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#2a2a2a]">
                          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                          <p className="text-xl font-extrabold text-gray-800 dark:text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export options */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Export Data</h3>
                    <div className="flex flex-col gap-2.5">
                      {([
                        { key: 'registrants' as TabType, label: 'Registrants Report', desc: `${confirmedCount} registrants`, color: '023E8A' },
                        { key: 'attendance'  as TabType, label: 'Attendance Report',  desc: `${sessions.length} sessions`,   color: '276221' },
                        { key: 'scanlogs'   as TabType, label: 'Scan Logs Report',   desc: `${scanLogs.length} scan logs`,  color: '01796F' },
                      ]).map(({ key, label, desc, color }) => (
                        <div key={key} className="flex items-center justify-between px-4 py-3.5 bg-gray-50 dark:bg-[#171717] rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400" style={{ background: `#${color}20` }}>
                              <DownloadIcon />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">{label}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
                            </div>
                          </div>
                          <button onClick={() => handleExport(key)}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                            <DownloadIcon /> Export Excel
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
                {activeTab === 'registrants' && `${filteredRegistrants.length} of ${participants.length} registrant${participants.length !== 1 ? 's' : ''}`}
                {activeTab === 'attendance'  && `${filteredAttendanceSorted.length} of ${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
                {activeTab === 'scanlogs'    && `${filteredScanLogs.length} of ${scanLogs.length} scan log${scanLogs.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LABEL VIEW / EDIT MODAL ── */}
      {labelViewModal.open && labelViewModal.participant && (() => {
        const p = labelViewModal.participant
        const isEdit = labelViewModal.editMode || !p.label
        const c = p.label ? getLabelColor(String(p.label)) : getLabelColor('Custom…')
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLabelViewModal({ open: false, participant: null, editMode: false })}>
            <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-8" onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {!p.label ? 'Add Label' : isEdit ? 'Edit Label' : 'Label Details'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.full_name} · <span className="font-mono text-[#DC143C]">{p.agent_code}</span></p>
                </div>
                {p.label && !isEdit && (
                  <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText}`}>
                    {p.label}
                  </span>
                )}
              </div>

              {/* VIEW MODE */}
              {!isEdit && p.label && (
                <>
                  <div className="bg-gray-50 dark:bg-[#141414] rounded-2xl p-5 mb-6 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Label</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.label}</p>
                    </div>
                    {p.label_description && (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Note</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{p.label_description}</p>
                      </div>
                    )}
                    {!p.label_description && (
                      <p className="text-sm text-gray-400 dark:text-gray-600 italic">No note added.</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setLabelViewModal({ open: false, participant: null, editMode: false })}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">
                      Close
                    </button>
                    <button onClick={() => setLabelViewModal(v => ({ ...v, editMode: true }))}
                      className="flex-1 px-4 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg">
                      Edit
                    </button>
                  </div>
                </>
              )}

              {/* EDIT MODE */}
              {isEdit && (
                <>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Label Type</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {LABEL_OPTIONS.map(opt => {
                      const oc = getLabelColor(opt === 'Custom…' ? 'Custom…' : opt)
                      return (
                        <button key={opt} onClick={() => setLabelType(opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            labelType === opt
                              ? `${oc.bg} ${oc.text} ${oc.border} ${oc.darkBg} ${oc.darkText}`
                              : 'border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 hover:border-gray-400'
                          }`}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {labelType === 'Custom…' && (
                    <input type="text" value={labelCustom} onChange={e => setLabelCustom(e.target.value)}
                      placeholder="e.g. Best Agent, Million Club…"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-white text-sm outline-none focus:border-[#DC143C] mb-4"
                    />
                  )}
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-1">Note <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                  <textarea value={labelNote} onChange={e => setLabelNote(e.target.value)}
                    placeholder="e.g. Seated at Table 2, Row 5 · Perform after opening remarks"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-white text-sm outline-none focus:border-[#DC143C] resize-none mb-5"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => p.label ? setLabelViewModal(v => ({ ...v, editMode: false })) : setLabelViewModal({ open: false, participant: null, editMode: false })}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">
                      Cancel
                    </button>
                    {p.label && (
                      <button onClick={() => { setLabelModal({ open: true, participant: p }); handleSetLabel(false) }} disabled={labelLoading}
                        className="px-4 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 text-sm">
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => { setLabelModal({ open: true, participant: p }); handleSetLabel(true) }}
                      disabled={labelLoading || (labelType === 'Custom…' && !labelCustom.trim())}
                      className="flex-1 px-4 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg disabled:opacity-50">
                      {labelLoading ? 'Saving...' : 'Save Label'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── LEGACY LABEL MODAL (kept for triple-dots flow) ── */}
      {labelModal.open && labelModal.participant && !labelViewModal.open && (
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
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-1">Note <span className="font-normal normal-case">optional</span></label>
            <textarea value={labelNote} onChange={e => setLabelNote(e.target.value)}
              placeholder="e.g. Seated at Table 2, Row 5"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-white text-sm outline-none focus:border-[#DC143C] resize-none mb-4"
            />
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
                {labelLoading ? 'Saving...' : 'Save Label'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE REGISTRANT CONFIRMATION MODAL ── */}
      {removeModal.open && removeModal.participant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-[#DC143C] mt-[1px] [&>svg]:w-6 [&>svg]:h-6"><TrashIcon /></span>
                Remove Registrant
              </h2>
              <button onClick={() => setRemoveModal({ open: false, participant: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to remove <strong className="text-gray-700 dark:text-gray-200">{removeModal.participant.full_name}</strong> from this event? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveModal({ open: false, participant: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={handleRemoveConfirm} disabled={removeLoading}
                className="flex-1 h-[44px] rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {removeLoading ? 'Removing...' : 'Remove Registrant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sort Dropdown ──
function SortDropdown({ options, value, onChange, dropdownRef, open, setOpen }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  dropdownRef: React.RefObject<HTMLDivElement>
  open: boolean
  setOpen: (v: boolean) => void
}) {
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/>
        </svg>
        <span className="text-xs font-semibold">{options.find(o => o.value === value)?.label}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden min-w-[160px]">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sort by</span>
          </div>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                value === opt.value
                  ? 'text-[#DC143C] bg-red-50 dark:bg-[#DC143C]/10 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
              }`}>
              {opt.label}
              {value === opt.value && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── StatCard ──
interface StatCardProps {
  num: number; label: string; accent: boolean
  barWidth: number; icon: React.ReactNode; iconRed?: boolean
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