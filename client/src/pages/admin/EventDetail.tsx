import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExcelJS from 'exceljs'
import { getEventByIdApi, updateEventStatusApi, getEventStaffApi, removeEventStaffApi } from '../../api/events.api'
import {
  getParticipantsByEventApi,
  cancelParticipantApi,
  setLabelApi,
  restoreParticipantApi,
  deleteParticipantApi,
  getCancelledParticipantsByEventApi,
} from '../../api/participants.api'
import { getSessionsByEventApi, getScanLogsByEventApi, updateSessionTimesApi, bulkCheckOutApi } from '../../api/scan.api'
import { Event, Participant, AttendanceSession, ScanLog } from '../../types'
import Sidebar from '../../components/Sidebar'
import { useStaffProtection } from '../../hooks/useStaffProtection'
import EventDetailTabs, { AssignedStaff, TabType } from './EventDetailTabs'
import EditEventModal from '../../components/EditEventModal'

// ─────────────────────────────────────────────────────────────
// Constants / helpers
// ─────────────────────────────────────────────────────────────
const LABEL_OPTIONS = ['Awardee', 'VIP', 'Sponsor', 'Speaker', 'Staff', 'Custom…']

const fmt12h = (t: string) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const ScannerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 7 3 3 7 3" /><polyline points="17 3 21 3 21 7" /><polyline points="21 17 21 21 17 21" /><polyline points="7 21 3 21 3 17" />
    <rect x="7" y="7" width="10" height="10" />
  </svg>
)
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
)
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

// ─────────────────────────────────────────────────────────────
// Small UI components
// ─────────────────────────────────────────────────────────────
function isEventOngoing(event: Event): boolean {
  const now = new Date()
  const eventDateStr = event.event_date.slice(0, 10)
  const todayStr = now.toLocaleDateString('en-CA')
  if (eventDateStr !== todayStr) return false
  if (!event.start_time || !event.end_time) return false
  const [sh, sm] = event.start_time.split(':').map(Number)
  const [eh, em] = event.end_time.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes
}

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

interface StatCardProps {
  num: number; label: string; accent: boolean
  barWidth: number; icon: React.ReactNode; iconRed?: boolean
}
function StatCard({ num, label, accent, barWidth, icon, iconRed }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className={`absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center ${iconRed ? 'bg-red-50 dark:bg-red-900/30 text-[#DC143C] dark:text-red-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
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

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'
  useStaffProtection()

  // ── Data state ──
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [cancelledParticipants, setCancelledParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([])
  const [loading, setLoading] = useState(true)

  // ── UI state ──
  const [copied, setCopied] = useState(false)
  const [statusToggling, setStatusToggling] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // ── Label modal state ──
  const [labelType, setLabelType] = useState('Awardee')
  const [labelCustom, setLabelCustom] = useState('')
  const [labelLoading, setLabelLoading] = useState(false)
  const [labelViewModal, setLabelViewModal] = useState<{ open: boolean; participant: Participant | null; editMode: boolean }>({ open: false, participant: null, editMode: false })
  const [labelNote, setLabelNote] = useState('')

  // ── Remove registrant modal ──
  const [removeModal, setRemoveModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [removeLoading, setRemoveLoading] = useState(false)

  // ── Trash / perm delete modal ──
  const [permDeleteModal, setPermDeleteModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [permDeleteLoading, setPermDeleteLoading] = useState(false)

  // ── Early out modal ──
  const [earlyOutModal, setEarlyOutModal] = useState<{ open: boolean; session: AttendanceSession | null }>({ open: false, session: null })

  // ── Attendance edit state ──
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editCheckIn, setEditCheckIn]   = useState('')
  const [editCheckOut, setEditCheckOut] = useState('')
  const [editSaving, setEditSaving]     = useState(false)

  // ── Bulk check-out state ──
  const [bulkCheckOutLoading, setBulkCheckOutLoading] = useState(false)
  const [bulkCheckOutModal, setBulkCheckOutModal]     = useState(false)

  // ── Staff modal ──
  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null)
  const [removeStaffModal, setRemoveStaffModal] = useState<{ open: boolean; staff: AssignedStaff | null }>({ open: false, staff: null })

  // ─────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const id = Number(eventId)
    try {
      const [eventData, participantsData, cancelledData, sessionsData, logsData, staffData] = await Promise.all([
        getEventByIdApi(id),
        getParticipantsByEventApi(id),
        isAdmin ? getCancelledParticipantsByEventApi(id) : Promise.resolve([]),
        getSessionsByEventApi(id),
        getScanLogsByEventApi(id),
        isAdmin ? getEventStaffApi(id) : Promise.resolve([])
      ])
      setEvent(eventData)
      setParticipants(participantsData)
      setCancelledParticipants(cancelledData)
      setSessions(sessionsData)
      setScanLogs(logsData)
      setAssignedStaff(staffData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  // ─────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────
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
    const activeParticipant = labelViewModal.participant
    if (!activeParticipant) return
    setLabelLoading(true)
    const labelValue = enable ? (labelType === 'Custom…' ? labelCustom.trim() : labelType) : null
    const descValue = enable ? (labelNote.trim() || null) : null
    try {
      await setLabelApi(activeParticipant.participant_id, { label: labelValue, label_description: descValue })
      await fetchData()
      setLabelViewModal({ open: false, participant: null, editMode: false })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update label')
    } finally { setLabelLoading(false) }
  }

  const handleRemoveConfirm = async () => {
    if (!removeModal.participant) return
    setRemoveLoading(true)
    const removed = removeModal.participant
    try {
      await cancelParticipantApi(removed.participant_id)
      setParticipants(prev => prev.filter(p => p.participant_id !== removed.participant_id))
      setCancelledParticipants(prev => [...prev, { ...removed, registration_status: 'cancelled' }])
      setRemoveModal({ open: false, participant: null })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove registrant')
    } finally { setRemoveLoading(false) }
  }

  const handleRestoreParticipant = async (participant: Participant) => {
    try {
      await restoreParticipantApi(participant.participant_id)
      setCancelledParticipants(prev => prev.filter(p => p.participant_id !== participant.participant_id))
      setParticipants(prev => [...prev, { ...participant, registration_status: 'confirmed' }])
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restore participant')
    }
  }

  const handlePermDeleteConfirm = async () => {
    if (!permDeleteModal.participant) return
    setPermDeleteLoading(true)
    try {
      await deleteParticipantApi(permDeleteModal.participant.participant_id)
      setCancelledParticipants(prev => prev.filter(p => p.participant_id !== permDeleteModal.participant!.participant_id))
      setPermDeleteModal({ open: false, participant: null })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to permanently delete participant')
    } finally { setPermDeleteLoading(false) }
  }

  const handleRemoveStaff = async () => {
    if (!removeStaffModal.staff) return
    setRemovingStaffId(removeStaffModal.staff.user_id)
    try {
      await removeEventStaffApi(Number(eventId), removeStaffModal.staff.user_id)
      setAssignedStaff(prev => prev.filter(s => s.user_id !== removeStaffModal.staff!.user_id))
      setRemoveStaffModal({ open: false, staff: null })
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove staff access')
    } finally { setRemovingStaffId(null) }
  }

  const handleStartEdit = (s: AttendanceSession) => {
    setEditingSessionId(s.session_id)
    const toMasked = (iso: string | null) => {
      if (!iso) return '__/__/____ __:__:__ __'
      return new Date(iso).toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
      }).replace(',', '')
    }
    setEditCheckIn(toMasked(s.check_in_time))
    setEditCheckOut(toMasked(s.check_out_time))
  }

  const handleCancelEdit = () => {
    setEditingSessionId(null)
    setEditCheckIn('')
    setEditCheckOut('')
  }

  const handleSaveEdit = async (sessionId: number) => {
    const parseMasked = (val: string) => {
      if (!val || val.includes('_')) return null
      const d = new Date(val.trim())
      return isNaN(d.getTime()) ? null : d
    }
    if (!editCheckIn || editCheckIn.includes('_')) { alert('Check-in time is required and must be complete.'); return }
    const checkIn = parseMasked(editCheckIn)
    if (!checkIn) { alert('Invalid check-in time.'); return }
    const hasCheckOut = editCheckOut && !editCheckOut.includes('_') && editCheckOut !== '__/__/____ __:__:__ __'
    const checkOut = hasCheckOut ? parseMasked(editCheckOut) : null
    if (hasCheckOut && !checkOut) { alert('Invalid check-out time.'); return }
    if (checkOut && checkOut <= checkIn) { alert('Check-out time must be after check-in time.'); return }
    setEditSaving(true)
    try {
      await updateSessionTimesApi(sessionId, {
        check_in_time:  checkIn.toISOString(),
        check_out_time: checkOut ? checkOut.toISOString() : null,
      })
      await fetchData()
      setEditingSessionId(null)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update session times')
    } finally { setEditSaving(false) }
  }

  const handleBulkCheckOut = async () => {
    setBulkCheckOutLoading(true)
    try {
      const visibleSessions = isAdmin ? sessions : sessions.filter(s => s.branch_name === user.branch_name)
      const checkedInIds = visibleSessions
        .filter(s => s.check_in_time && !s.check_out_time)
        .map(s => s.session_id)
      if (checkedInIds.length === 0) { setBulkCheckOutModal(false); return }
      await bulkCheckOutApi(Number(eventId), checkedInIds)
      await fetchData()
      setBulkCheckOutModal(false)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to bulk check out')
    } finally { setBulkCheckOutLoading(false) }
  }

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

  // ─────────────────────────────────────────────────────────
  // Excel export (unchanged)
  // ─────────────────────────────────────────────────────────
  const handleExport = async (docType: TabType) => {
    if (!event) return

    const COLORS = {
      registrants: { header: 'FF023E8A', teamBg: 'FFE8F0FE', teamText: 'FF023E8A', totalBg: 'FFD0E4FF' },
      attendance:  { header: 'FF276221', teamBg: 'FFE8F5E9', teamText: 'FF276221', totalBg: 'FFC8E6C9' },
      scanlogs:    { header: 'FF01796F', teamBg: 'FFE0F2F1', teamText: 'FF01796F', totalBg: 'FFB2DFDB' },
    } as const
    const color = COLORS[docType as keyof typeof COLORS] ?? COLORS.registrants
    const wb = new ExcelJS.Workbook()

    const download = async (filename: string) => {
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    }

    const safeSheetName = (name: string) => name.replace(/[:\\/?*[\]]/g, '-').slice(0, 31)

    const writeTeamBlock = (
      ws: ExcelJS.Worksheet,
      teamName: string,
      colHeaders: string[],
      flatRows: (string | number | null)[],
      startRow: number,
      colCount: number,
    ): number => {
      let cursor = startRow
      const teamHeadRow = ws.getRow(cursor)
      teamHeadRow.getCell(1).value = teamName
      teamHeadRow.getCell(1).font = { bold: true, size: 11, color: { argb: color.teamText } }
      teamHeadRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.teamBg } }
      teamHeadRow.getCell(1).alignment = { vertical: 'middle' }
      ws.mergeCells(cursor, 1, cursor, colCount)
      teamHeadRow.height = 20
      cursor++
      const colHeaderRow = ws.getRow(cursor)
      colHeaders.forEach((h, i) => {
        const cell = colHeaderRow.getCell(i + 1)
        cell.value = h
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        }
      })
      colHeaderRow.height = 20
      cursor++
      const rowChunks: (string | number | null)[][] = []
      for (let i = 0; i < flatRows.length; i += colCount) rowChunks.push(flatRows.slice(i, i + colCount))
      if (rowChunks.length === 0) {
        const emptyRow = ws.getRow(cursor)
        emptyRow.getCell(1).value = 'No records'
        emptyRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 }
        emptyRow.height = 18
        cursor++
      } else {
        rowChunks.forEach((chunk, ri) => {
          const dataRow = ws.getRow(cursor)
          chunk.forEach((val, ci) => {
            const cell = dataRow.getCell(ci + 1)
            cell.value = val
            cell.font = { size: 10 }
            cell.alignment = { vertical: 'middle' }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ri % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' } }
            cell.border = {
              top: { style: 'hair', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
              left: { style: 'hair', color: { argb: 'FFE5E7EB' } }, right: { style: 'hair', color: { argb: 'FFE5E7EB' } },
            }
          })
          dataRow.height = 18
          cursor++
        })
        const totalRow = ws.getRow(cursor)
        totalRow.getCell(1).value = `Total: ${rowChunks.length} member${rowChunks.length !== 1 ? 's' : ''}`
        totalRow.getCell(1).font = { bold: true, size: 10, color: { argb: color.teamText } }
        totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.totalBg } }
        totalRow.getCell(1).alignment = { vertical: 'middle' }
        for (let ci = 2; ci <= colCount; ci++) {
          ws.getRow(cursor).getCell(ci).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.totalBg } }
        }
        ws.mergeCells(cursor, 1, cursor, colCount)
        totalRow.height = 18
        cursor++
      }
      cursor++
      return cursor
    }

    const allBranches = isAdmin
      ? [...new Set([...participants.map(p => p.branch_name), ...sessions.map(s => s.branch_name)])].filter(Boolean).sort()
      : [user.branch_name]

    const writeSummarySheet = (sourceData: {
      allBranches: string[]
      participants: Participant[]
      sessions: AttendanceSession[]
      reportLabel: string
    }) => {
      const { allBranches, participants: pts, sessions: sess, reportLabel } = sourceData
      const ws = wb.addWorksheet('📊 Summary')
      const C = color
      const colCount = 6
      ws.columns = [{ width: 28 }, { width: 16 }, { width: 16 }, { width: 18 }, { width: 16 }, { width: 16 }]
      let cursor = 1

      const writeSectionTitle = (title: string) => {
        const row = ws.getRow(cursor)
        row.getCell(1).value = title
        row.getCell(1).font = { bold: true, size: 13, color: { argb: C.header } }
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.teamBg } }
        row.getCell(1).alignment = { vertical: 'middle' }
        ws.mergeCells(cursor, 1, cursor, colCount)
        row.height = 24
        return ++cursor
      }

      const writeTableHeader = (headers: string[]) => {
        const row = ws.getRow(cursor)
        headers.forEach((h, i) => {
          const cell = row.getCell(i + 1)
          cell.value = h
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          }
        })
        row.height = 20
        return ++cursor
      }

      const writeDataRow = (values: (string | number)[], rowIndex: number) => {
        const row = ws.getRow(cursor)
        values.forEach((v, i) => {
          const cell = row.getCell(i + 1)
          cell.value = v
          cell.font = { size: 10 }
          cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center' }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowIndex % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' } }
          cell.border = {
            top: { style: 'hair', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
            left: { style: 'hair', color: { argb: 'FFE5E7EB' } }, right: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          }
        })
        row.height = 18
        return ++cursor
      }

      const evtTitleRow = ws.getRow(cursor)
      evtTitleRow.getCell(1).value = event.title
      evtTitleRow.getCell(1).font = { bold: true, size: 20, color: { argb: C.header } }
      evtTitleRow.getCell(1).alignment = { vertical: 'middle' }
      ws.mergeCells(cursor, 1, cursor, colCount)
      evtTitleRow.height = 32
      cursor++

      const reportLabelRow = ws.getRow(cursor)
      reportLabelRow.getCell(1).value = reportLabel
      reportLabelRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      reportLabelRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } }
      reportLabelRow.getCell(1).alignment = { vertical: 'middle' }
      ws.mergeCells(cursor, 1, cursor, colCount)
      reportLabelRow.height = 22
      cursor++

      const evtSubRow = ws.getRow(cursor)
      evtSubRow.getCell(1).value = new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        + (event.venue ? ` · ${event.venue}` : '')
      evtSubRow.getCell(1).font = { size: 10, color: { argb: 'FF6B7280' } }
      ws.mergeCells(cursor, 1, cursor, colCount)
      evtSubRow.height = 16
      cursor++
      cursor++

      cursor = writeSectionTitle('Overall Numbers')
      const confirmedPts = pts.filter(p => p.registration_status === 'confirmed')
      const totalReg    = confirmedPts.length
      const totalAtt    = sess.length
      const totalIn     = sess.filter(s => s.check_in_time && !s.check_out_time).length
      const totalOut    = sess.filter(s => s.check_in_time && s.check_out_time).length
      const totalEarly  = sess.filter(s => s.check_out_method === 'early_out').length
      const totalNoShow = Math.max(0, totalReg - totalAtt)
      const attRate     = totalReg > 0 ? Math.round((totalAtt / totalReg) * 100) : 0

      const overallData: [string, string | number][] = [
        ['Total Registered', totalReg], ['Total Attended', totalAtt], ['Attendance Rate', `${attRate}%`],
        ['Currently Inside', totalIn],  ['Checked Out', totalOut],    ['Early Outs', totalEarly], ['No-Shows', totalNoShow],
      ]
      overallData.forEach(([label, value], ri) => {
        const row = ws.getRow(cursor)
        row.getCell(1).value = label
        row.getCell(1).font = { size: 10, color: { argb: 'FF374151' } }
        row.getCell(1).alignment = { vertical: 'middle' }
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ri % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' } }
        row.getCell(2).value = value
        row.getCell(2).font = { bold: true, size: 11, color: { argb: C.teamText } }
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ri % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' } }
        ;[1, 2].forEach(ci => {
          row.getCell(ci).border = {
            top: { style: 'hair', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
            left: { style: 'hair', color: { argb: 'FFE5E7EB' } }, right: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          }
        })
        row.height = 18
        cursor++
      })
      cursor++

      cursor = writeSectionTitle('Per-Branch Breakdown')
      cursor = writeTableHeader(['Branch', 'Registered', 'Attended', 'Att. Rate', 'Early Outs', 'No-Shows'])
      allBranches.forEach((branch, ri) => {
        const bReg    = confirmedPts.filter(p => p.branch_name === branch).length
        const bAtt    = sess.filter(s => s.branch_name === branch).length
        const bEarly  = sess.filter(s => s.branch_name === branch && s.check_out_method === 'early_out').length
        const bNoShow = Math.max(0, bReg - bAtt)
        const bRate   = bReg > 0 ? `${Math.round((bAtt / bReg) * 100)}%` : '—'
        cursor = writeDataRow([branch, bReg, bAtt, bRate, bEarly, bNoShow], ri)
      })
    }

    if (docType === 'registrants') {
      writeSummarySheet({ allBranches, participants, sessions, reportLabel: '📋 Registration Report' })
      const colCount = 4
      allBranches.forEach(branch => {
        const ws = wb.addWorksheet(safeSheetName(branch))
        ws.columns = [{ width: 18 }, { width: 28 }, { width: 20 }, { width: 22 }]
        const branchParticipants = participants.filter(p => p.branch_name === branch && p.registration_status === 'confirmed')
        const teams = [...new Set(branchParticipants.map(p => p.team_name))].filter(Boolean).sort()
        let cursor = 1
        const branchRow = ws.getRow(cursor)
        branchRow.getCell(1).value = branch
        branchRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
        branchRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        branchRow.getCell(1).alignment = { vertical: 'middle' }
        ws.mergeCells(cursor, 1, cursor, colCount)
        branchRow.height = 26
        cursor++
        cursor++
        teams.forEach(team => {
          const teamParticipants = branchParticipants.filter(p => p.team_name === team)
          const flatRows = teamParticipants.flatMap(p => [
            p.agent_code || '—', p.full_name,
            typeof p.label === 'string' ? p.label : '—',
            new Date(p.registered_at).toLocaleString('en-PH'),
          ])
          cursor = writeTeamBlock(ws, team, ['Agent Code', 'Full Name', 'Label', 'Registered At'], flatRows, cursor, colCount)
        })
        const branchTotalRow = ws.getRow(cursor)
        branchTotalRow.getCell(1).value = `Branch Total: ${branchParticipants.length} registrant${branchParticipants.length !== 1 ? 's' : ''}`
        branchTotalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
        branchTotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        for (let ci = 2; ci <= colCount; ci++) ws.getRow(cursor).getCell(ci).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        ws.mergeCells(cursor, 1, cursor, colCount)
        branchTotalRow.height = 22
      })
      await download(`${event.title.replace(/\s+/g, '_')}_RegistrationReport.xlsx`)
    }

    if (docType === 'attendance') {
      writeSummarySheet({ allBranches, participants, sessions, reportLabel: '✅ Attendance Report' })
      const colCount = 5
      allBranches.forEach(branch => {
        const ws = wb.addWorksheet(safeSheetName(branch))
        ws.columns = [{ width: 18 }, { width: 28 }, { width: 22 }, { width: 22 }, { width: 16 }]
        const branchSessions = sessions.filter(s => s.branch_name === branch)
        const teams = [...new Set(branchSessions.map(s => s.team_name))].filter(Boolean).sort()
        let cursor = 1
        const branchRow = ws.getRow(cursor)
        branchRow.getCell(1).value = branch
        branchRow.getCell(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
        branchRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        branchRow.getCell(1).alignment = { vertical: 'middle' }
        ws.mergeCells(cursor, 1, cursor, colCount)
        branchRow.height = 26
        cursor++
        cursor++
        teams.forEach(team => {
          const teamSessions = branchSessions.filter(s => s.team_name === team)
          const flatRows = teamSessions.flatMap(s => [
            s.agent_code || '—', s.full_name,
            s.check_in_time ? new Date(s.check_in_time).toLocaleString('en-PH') : '—',
            s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—',
            s.check_out_method === 'early_out' ? (s.early_out_reason || 'No reason') : '—',
          ])
          cursor = writeTeamBlock(ws, team, ['Agent Code', 'Full Name', 'Check In', 'Check Out', 'Early Out Reason'], flatRows, cursor, colCount)
        })
        const branchTotalRow = ws.getRow(cursor)
        branchTotalRow.getCell(1).value = `Branch Total: ${branchSessions.length} attendee${branchSessions.length !== 1 ? 's' : ''}`
        branchTotalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
        branchTotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        for (let ci = 2; ci <= colCount; ci++) ws.getRow(cursor).getCell(ci).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        ws.mergeCells(cursor, 1, cursor, colCount)
        branchTotalRow.height = 22
      })
      await download(`${event.title.replace(/\s+/g, '_')}_AttendanceReport.xlsx`)
    }

    if (docType === 'scanlogs') {
      const ws = wb.addWorksheet('Scan Logs')
      ws.columns = [{ width: 18 }, { width: 28 }, { width: 14 }, { width: 30 }, { width: 24 }]
      const headers = ['Agent Code', 'Full Name', 'Scan Type', 'Denial Reason', 'Scanned At']
      const headerRow = ws.addRow(headers)
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        }
      })
      headerRow.height = 22
      scanLogs.forEach((s, ri) => {
        const row = ws.addRow([
          s.agent_code || 'Unknown', s.full_name || 'Unknown',
          s.scan_type, s.denial_reason || '', new Date(s.scanned_at).toLocaleString('en-PH'),
        ])
        row.eachCell(cell => {
          cell.font = { size: 10 }
          cell.alignment = { vertical: 'middle' }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ri % 2 === 0 ? 'FFFFFFFF' : 'FFF9FAFB' } }
          cell.border = {
            top: { style: 'hair', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
            left: { style: 'hair', color: { argb: 'FFE5E7EB' } }, right: { style: 'hair', color: { argb: 'FFE5E7EB' } },
          }
        })
        row.height = 18
      })
      await download(`${event.title.replace(/\s+/g, '_')}_ScanLogsReport.xlsx`)
    }
  }

  // ─────────────────────────────────────────────────────────
  // Derived data
  // ─────────────────────────────────────────────────────────
  const visibleParticipants = isAdmin ? participants : participants.filter(p => p.branch_name === user.branch_name)
  const visibleSessions     = isAdmin ? sessions     : sessions.filter(s => s.branch_name === user.branch_name)

  const visibleConfirmedCount = visibleParticipants.filter(p => p.registration_status === 'confirmed').length
  const visibleCheckedInCount = visibleSessions.filter(s => s.check_in_time && !s.check_out_time).length
  const visibleCompletedCount = visibleSessions.filter(s => s.check_in_time && s.check_out_time).length
  const visibleEarlyOutCount  = visibleSessions.filter(s => s.check_out_method === 'early_out').length
  const visibleTotalAttended  = visibleSessions.length
  const visibleNoShowCount    = Math.max(0, visibleConfirmedCount - visibleTotalAttended)

  const recentCheckIns = [...visibleSessions]
    .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
    .slice(0, 5)

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-700', ongoing: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-600',    completed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',  open: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-600',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  // ─────────────────────────────────────────────────────────
  // Render guards
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────
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
              {event.title}
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

            {/* ── Edit Event Button (admin only) ── */}
            {isAdmin && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex items-center gap-2 border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold text-sm hover:border-[#DC143C] hover:text-[#DC143C] dark:hover:border-[#DC143C] dark:hover:text-[#DC143C] transition-all">
                <EditIcon />
                Edit Event
              </button>
            )}

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
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-sm text-gray-500 dark:text-gray-400">{fmt12h(event.start_time)} – {fmt12h(event.end_time)}</span>
          </div>
          {event.venue && (
            <>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="text-sm text-gray-500 dark:text-gray-400">{event.venue}</span>
              </div>
            </>
          )}
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col px-12 pt-5 pb-5 gap-3 overflow-hidden">

          {/* ── TOP ROW: Stats + Recent Check-In ── */}
          <div className="flex gap-3 flex-shrink-0">

            {/* Left: stat cards + registration window */}
            <div className="flex-1 flex flex-col gap-3">
              {!isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/30 text-[#DC143C]">
                    Viewing: {user.branch_name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Data filtered to your branch</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <StatCard num={visibleConfirmedCount} label="Registered" accent={false} barWidth={100} icon={<UsersIcon />} />
                <StatCard num={visibleCheckedInCount} label="Currently Inside" accent={true}
                  barWidth={visibleConfirmedCount ? Math.round((visibleCheckedInCount / visibleConfirmedCount) * 100) : 0}
                  icon={<CheckIcon />} iconRed />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <StatCard num={visibleCompletedCount} label="Checked Out" accent={false}
                  barWidth={visibleConfirmedCount ? Math.round((visibleCompletedCount / visibleConfirmedCount) * 100) : 0}
                  icon={<LogoutIcon />} />
                <StatCard num={visibleEarlyOutCount} label="Early Out" accent={false}
                  barWidth={visibleConfirmedCount ? Math.round((visibleEarlyOutCount / visibleConfirmedCount) * 100) : 0}
                  icon={<AlertIcon />} />
                <StatCard
                  num={visibleNoShowCount}
                  label={ended ? 'No-Shows' : 'Waiting'}
                  accent={ended && visibleNoShowCount > 0}
                  barWidth={0}
                  icon={<AlertIcon />}
                  iconRed={ended && visibleNoShowCount > 0}
                />
                <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-400">
                    <CheckIcon />
                  </div>
                  <div className="text-[48px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none mb-1.5">
                    {visibleConfirmedCount > 0 ? `${Math.round((visibleTotalAttended / visibleConfirmedCount) * 100)}%` : '—'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</div>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
                    <div className="h-full bg-gray-300 dark:bg-gray-600" style={{ width: `${visibleConfirmedCount ? Math.round((visibleTotalAttended / visibleConfirmedCount) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Registration Window */}
              <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-5 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Registration Window</p>
                    <div className="min-w-0">
                      {event.registration_start && event.registration_end ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {new Date(event.registration_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' at '}
                          {new Date(event.registration_start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          {' → '}
                          {new Date(event.registration_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' at '}
                          {new Date(event.registration_end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No registration window set</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-xl hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                      <CopyIcon />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a href={`${window.location.origin}/register/${event.event_id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-xl hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Open Link
                    </a>
                    {isAdmin && event.status !== 'draft' && (
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-semibold ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                          {statusToggling ? 'Updating...' : isOpen ? 'Registration Open' : 'Registration Closed'}
                        </span>
                        <button
                          onClick={handleStatusToggle}
                          disabled={statusToggling}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${isOpen ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'} disabled:opacity-60`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${isOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Recent Check-Ins panel */}
            <div className="w-[280px] bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm flex flex-col overflow-hidden flex-shrink-0">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Recent Check-Ins</p>
              </div>
              <div className="flex-1 overflow-hidden divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                {recentCheckIns.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No check-ins yet</p>
                ) : recentCheckIns.map(s => (
                  <div key={s.session_id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#333] flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
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

          {/* ── TABS + TABLES (delegated) ── */}
          <EventDetailTabs
            event={event}
            participants={participants}
            cancelledParticipants={cancelledParticipants}
            sessions={sessions}
            scanLogs={scanLogs}
            assignedStaff={assignedStaff}
            isAdmin={isAdmin}
            ended={ended}
            visibleParticipants={visibleParticipants}
            visibleSessions={visibleSessions}
            visibleConfirmedCount={visibleConfirmedCount}
            visibleCheckedInCount={visibleCheckedInCount}
            visibleTotalAttended={visibleTotalAttended}
            visibleEarlyOutCount={visibleEarlyOutCount}
            visibleNoShowCount={visibleNoShowCount}
            removingStaffId={removingStaffId}
            onLabelOpen={openLabelView}
            onRemoveOpen={(p: Participant) => setRemoveModal({ open: true, participant: p })}
            onRestoreParticipant={handleRestoreParticipant}
            onPermDeleteOpen={(p: Participant) => setPermDeleteModal({ open: true, participant: p })}
            onRemoveStaffOpen={(s: AssignedStaff) => setRemoveStaffModal({ open: true, staff: s })}
            onBulkCheckOutOpen={() => setBulkCheckOutModal(true)}
            onExport={handleExport}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onEarlyOutOpen={(s: AttendanceSession) => setEarlyOutModal({ open: true, session: s })}
            editingSessionId={editingSessionId}
            editCheckIn={editCheckIn}
            editCheckOut={editCheckOut}
            setEditCheckIn={setEditCheckIn}
            setEditCheckOut={setEditCheckOut}
            editSaving={editSaving}
            labelViewModal={labelViewModal}
            setLabelViewModal={setLabelViewModal}
            labelType={labelType}
            setLabelType={setLabelType}
            labelCustom={labelCustom}
            setLabelCustom={setLabelCustom}
            labelNote={labelNote}
            setLabelNote={setLabelNote}
            labelLoading={labelLoading}
            onSetLabel={handleSetLabel}
            removeModal={removeModal}
            setRemoveModal={setRemoveModal}
            removeLoading={removeLoading}
            onRemoveConfirm={handleRemoveConfirm}
            permDeleteModal={permDeleteModal}
            setPermDeleteModal={setPermDeleteModal}
            permDeleteLoading={permDeleteLoading}
            onPermDeleteConfirm={handlePermDeleteConfirm}
            removeStaffModal={removeStaffModal}
            setRemoveStaffModal={setRemoveStaffModal}
            onRemoveStaff={handleRemoveStaff}
            bulkCheckOutModal={bulkCheckOutModal}
            setBulkCheckOutModal={setBulkCheckOutModal}
            bulkCheckOutLoading={bulkCheckOutLoading}
            onBulkCheckOut={handleBulkCheckOut}
            earlyOutModal={earlyOutModal}
            setEarlyOutModal={setEarlyOutModal}
          />

        </div>
      </div>

      {/* ── EDIT EVENT MODAL ── */}
      {editModalOpen && (
        <EditEventModal
          event={event}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            setEditModalOpen(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}