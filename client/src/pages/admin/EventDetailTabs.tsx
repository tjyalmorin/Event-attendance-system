import { useState, useRef, useEffect } from 'react'
import { Event, Participant, AttendanceSession, ScanLog } from '../../types'

// ─────────────────────────────────────────────────────────────
// Re-exported types (for consumers of this file)
// ─────────────────────────────────────────────────────────────
export type TabType = 'registrants' | 'attendance' | 'scanlogs' | 'reports' | 'staff' | 'trash'

export interface AssignedStaff {
  user_id: string
  full_name: string
  agent_code: string
  branch_name: string
  email: string
  assigned_at: string
}

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface EventDetailTabsProps {
  event: Event
  participants: Participant[]
  cancelledParticipants: Participant[]
  sessions: AttendanceSession[]
  scanLogs: ScanLog[]
  assignedStaff: AssignedStaff[]
  isAdmin: boolean
  ended: boolean
  visibleParticipants: Participant[]
  visibleSessions: AttendanceSession[]
  visibleConfirmedCount: number
  visibleCheckedInCount: number
  visibleTotalAttended: number
  visibleEarlyOutCount: number
  visibleNoShowCount: number
  removingStaffId: string | null
  // handlers lifted from EventDetail
  onLabelOpen: (p: Participant, editMode?: boolean) => void
  onRemoveOpen: (p: Participant) => void
  onRestoreParticipant: (p: Participant) => void
  onPermDeleteOpen: (p: Participant) => void
  onRemoveStaffOpen: (s: AssignedStaff) => void
  onBulkCheckOutOpen: () => void
  onExport: (docType: TabType) => void
  onStartEdit: (s: AttendanceSession) => void
  onCancelEdit: () => void
  onSaveEdit: (sessionId: number) => void
  onEarlyOutOpen: (s: AttendanceSession) => void
  editingSessionId: number | null
  editCheckIn: string
  editCheckOut: string
  setEditCheckIn: (v: string) => void
  setEditCheckOut: (v: string) => void
  editSaving: boolean
  // label modal state (needed for modals rendered here)
  labelViewModal: { open: boolean; participant: Participant | null; editMode: boolean }
  setLabelViewModal: (v: { open: boolean; participant: Participant | null; editMode: boolean }) => void
  labelType: string
  setLabelType: (v: string) => void
  labelCustom: string
  setLabelCustom: (v: string) => void
  labelNote: string
  setLabelNote: (v: string) => void
  labelLoading: boolean
  onSetLabel: (enable: boolean) => void
  removeModal: { open: boolean; participant: Participant | null }
  setRemoveModal: (v: { open: boolean; participant: Participant | null }) => void
  removeLoading: boolean
  onRemoveConfirm: () => void
  permDeleteModal: { open: boolean; participant: Participant | null }
  setPermDeleteModal: (v: { open: boolean; participant: Participant | null }) => void
  permDeleteLoading: boolean
  onPermDeleteConfirm: () => void
  removeStaffModal: { open: boolean; staff: AssignedStaff | null }
  setRemoveStaffModal: (v: { open: boolean; staff: AssignedStaff | null }) => void
  onRemoveStaff: () => void
  bulkCheckOutModal: boolean
  setBulkCheckOutModal: (v: boolean) => void
  bulkCheckOutLoading: boolean
  onBulkCheckOut: () => void
  earlyOutModal: { open: boolean; session: AttendanceSession | null }
  setEarlyOutModal: (v: { open: boolean; session: AttendanceSession | null }) => void
}

// ─────────────────────────────────────────────────────────────
// Constants / helpers (duplicated here so this file is self-contained)
// ─────────────────────────────────────────────────────────────
const LABEL_OPTIONS = ['Awardee', 'VIP', 'Sponsor', 'Speaker', 'Staff', 'Custom…']

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string }> = {
  'Awardee': { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  darkBg: 'dark:bg-amber-900/30',  darkText: 'dark:text-amber-300' },
  'VIP':     { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  'Sponsor': { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-300' },
  'Speaker': { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-300',   darkBg: 'dark:bg-teal-900/30',   darkText: 'dark:text-teal-300' },
  'Staff':   { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300',   darkBg: 'dark:bg-gray-800',      darkText: 'dark:text-gray-300' },
}
const getLabelColor = (label: string) =>
  LABEL_COLORS[label] ?? { bg: 'bg-red-100', text: 'text-[#DC143C]', border: 'border-red-300', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' }

const fmtAgentCode = (code: string) => code || '—'

const MASK = 'MM/DD/YYYY HH:MM:SS AM'
const MASK_FIXED = new Set([2, 5, 10, 13, 16, 19])
const AMPM_POS = 20

function MaskedDateTimeInput({ value, onChange, className }: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const blank = () => '__/__/____ __:__:__ __'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    let pos = el.selectionStart ?? 0
    const chars = value.split('')

    if (e.key === 'Tab' || e.key === 'Enter') return
    e.preventDefault()

    const nextEditable = (from: number, dir: 1 | -1 = 1): number => {
      let p = from
      while (p >= 0 && p < MASK.length) {
        if (!MASK_FIXED.has(p)) return p
        p += dir
      }
      return from
    }

    if (e.key === 'ArrowRight') {
      if (pos >= AMPM_POS) return
      const next = nextEditable(pos + 1)
      el.setSelectionRange(next, next + 1)
      return
    }
    if (e.key === 'ArrowLeft') {
      const prev = nextEditable(pos - 1, -1)
      el.setSelectionRange(prev, prev + 1)
      return
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (pos >= AMPM_POS) return
      const p = nextEditable(pos, -1)
      if (p >= 0 && !MASK_FIXED.has(p)) {
        chars[p] = '_'
        onChange(chars.join(''))
        setTimeout(() => el.setSelectionRange(p, p + 1), 0)
      }
      return
    }
    if (pos >= AMPM_POS) {
      if (e.key.toUpperCase() === 'A') {
        chars[AMPM_POS] = 'A'; chars[AMPM_POS + 1] = 'M'
        onChange(chars.join(''))
        setTimeout(() => el.blur(), 0)
      } else if (e.key.toUpperCase() === 'P') {
        chars[AMPM_POS] = 'P'; chars[AMPM_POS + 1] = 'M'
        onChange(chars.join(''))
        setTimeout(() => el.blur(), 0)
      }
      return
    }
    if (/^\d$/.test(e.key)) {
      const p = nextEditable(pos)
      if (p < AMPM_POS) {
        chars[p] = e.key
        onChange(chars.join(''))
        const next = nextEditable(p + 1)
        setTimeout(() => el.setSelectionRange(next, next + 1), 0)
      }
    }
  }

  const handleFocus = () => {
    setTimeout(() => { if (inputRef.current) inputRef.current.setSelectionRange(0, 1) }, 0)
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const pos = el.selectionStart ?? 0
    let p = pos
    if (MASK_FIXED.has(p)) {
      let r = p + 1
      while (r < MASK.length && MASK_FIXED.has(r)) r++
      p = r < MASK.length ? r : p
    }
    setTimeout(() => el.setSelectionRange(p, p + 1), 0)
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value || blank()}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onClick={handleClick}
      onChange={() => {}}
      className={className}
      spellCheck={false}
    />
  )
}

// ─────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────
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
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
)
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
  </svg>
)
const RestoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" />
  </svg>
)
const PencilIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const BulkOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 16l4-4-4-4" /><path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
  </svg>
)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
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
        className="p-1.5 ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded">
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

function PaginationBar({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce<(number | '...')[]>((acc, p, idx, arr) => {
          if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
          acc.push(p)
          return acc
        }, [])
        .map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold border transition-all ${
                page === p ? 'bg-[#DC143C] border-[#DC143C] text-white' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
              }`}>
              {p}
            </button>
          )
        )
      }
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}

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

// ─────────────────────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────────────────────
export default function EventDetailTabs({
  event: _event,
  participants,
  cancelledParticipants,
  sessions: _sessions,
  scanLogs,
  assignedStaff,
  isAdmin,
  ended,
  visibleParticipants,
  visibleSessions,
  visibleConfirmedCount,
  visibleCheckedInCount,
  visibleTotalAttended,
  visibleEarlyOutCount,
  visibleNoShowCount,
  removingStaffId,
  onLabelOpen,
  onRemoveOpen,
  onRestoreParticipant,
  onPermDeleteOpen,
  onRemoveStaffOpen,
  onBulkCheckOutOpen,
  onExport,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEarlyOutOpen,
  editingSessionId,
  editCheckIn,
  editCheckOut,
  setEditCheckIn,
  setEditCheckOut,
  editSaving,
  labelViewModal,
  setLabelViewModal,
  labelType,
  setLabelType,
  labelCustom,
  setLabelCustom,
  labelNote,
  setLabelNote,
  labelLoading,
  onSetLabel,
  removeModal,
  setRemoveModal,
  removeLoading,
  onRemoveConfirm,
  permDeleteModal,
  setPermDeleteModal,
  permDeleteLoading,
  onPermDeleteConfirm,
  removeStaffModal,
  setRemoveStaffModal,
  onRemoveStaff,
  bulkCheckOutModal,
  setBulkCheckOutModal,
  bulkCheckOutLoading,
  onBulkCheckOut,
  earlyOutModal,
  setEarlyOutModal,
}: EventDetailTabsProps) {

  // ── Local tab + search/sort/filter state ──
  const [activeTab, setActiveTab] = useState<TabType>('registrants')

  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out' | 'flagged' | 'no_show'>('all')

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

  const [trashSearch, setTrashSearch] = useState('')

  const [registrantsPage, setRegistrantsPage] = useState(1)
  const [attendancePage,  setAttendancePage]   = useState(1)
  const [scanlogsPage,    setScanlogsPage]      = useState(1)
  const [staffPage,       setStaffPage]         = useState(1)
  const [trashPage,       setTrashPage]         = useState(1)

  // Close sort dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (registrantsSortRef.current && !registrantsSortRef.current.contains(e.target as Node)) setRegistrantsSortOpen(false)
      if (attendanceSortRef.current  && !attendanceSortRef.current.contains(e.target as Node))  setAttendanceSortOpen(false)
      if (scanlogsSortRef.current    && !scanlogsSortRef.current.contains(e.target as Node))    setScanlogsSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset pages on filter/sort change
  useEffect(() => { setRegistrantsPage(1) }, [registrantsSearch, registrantsSort])
  useEffect(() => { setAttendancePage(1) },  [attendanceSearch, attendanceSort, filterStatus])
  useEffect(() => { setScanlogsPage(1) },    [scanlogsSearch, scanlogsSort, scanlogsType])
  useEffect(() => { setTrashPage(1) },       [trashSearch])

  // ── Derived / filtered data ──
  const filteredRegistrants = visibleParticipants
    .filter(p => {
      if (!registrantsSearch.trim()) return true
      const q = registrantsSearch.toLowerCase()
      return p.full_name?.toLowerCase().includes(q) || p.agent_code?.toLowerCase().includes(q) || p.branch_name?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (registrantsSort === 'name') return a.full_name.localeCompare(b.full_name)
      return new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
    })

  const buildAttendanceRows = () => {
    const sessionAgentCodes = new Set(visibleSessions.map(s => s.agent_code))
    const pendingRows = visibleParticipants
      .filter(p => p.registration_status === 'confirmed' && !sessionAgentCodes.has(p.agent_code))
      .map(p => ({
        session_id: null as any,
        participant_id: p.participant_id,
        full_name: p.full_name,
        agent_code: p.agent_code,
        branch_name: p.branch_name,
        team_name: p.team_name,
        check_in_time: null as any,
        check_out_time: null as any,
        check_in_method: null,
        check_out_method: null,
        early_out_reason: null,
        _isPending: true,
        _isNoShow: ended,
      }))
    const sessionRows = visibleSessions.map(s => ({ ...s, _isPending: false, _isNoShow: false }))
    return [...sessionRows, ...pendingRows]
  }

  const allAttendanceRows = buildAttendanceRows()

  const filteredAttendanceSorted = allAttendanceRows
    .filter(s => {
      const matchSearch = !attendanceSearch.trim() ||
        s.full_name?.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        s.agent_code?.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        s.branch_name?.toLowerCase().includes(attendanceSearch.toLowerCase())
      const matchFilter =
        filterStatus === 'all'         ? true :
        filterStatus === 'checked_in'  ? (s.check_in_time && !s.check_out_time) :
        filterStatus === 'checked_out' ? !!s.check_out_time :
        filterStatus === 'flagged'     ? s.check_out_method === 'early_out' :
        filterStatus === 'no_show'     ? s._isPending : true
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      if (attendanceSort === 'name') return (a.full_name || '').localeCompare(b.full_name || '')
      if (!a.check_in_time && !b.check_in_time) return 0
      if (!a.check_in_time) return 1
      if (!b.check_in_time) return -1
      return new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime()
    })

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

  const filteredTrash = cancelledParticipants
    .filter(p => {
      if (!trashSearch.trim()) return true
      const q = trashSearch.toLowerCase()
      return p.full_name?.toLowerCase().includes(q) || p.agent_code?.toLowerCase().includes(q) || p.branch_name?.toLowerCase().includes(q)
    })

  // ── Tabs definition ──
  const tabs: { key: TabType; label: string }[] = [
    { key: 'registrants', label: `Registrants (${visibleConfirmedCount})` },
    { key: 'attendance',  label: `Attendance (${visibleSessions.length})` },
    { key: 'scanlogs',   label: `Scan Logs (${scanLogs.length})` },
    { key: 'reports',    label: 'Reports' },
    ...(isAdmin ? [
      { key: 'staff' as TabType, label: `Assigned Staff (${assignedStaff.length})` },
      { key: 'trash' as TabType, label: `Trash (${cancelledParticipants.length})` },
    ] : []),
  ]

  const totalAttendanceEntries = allAttendanceRows.length

  // ── Pagination ──
  const PAGE_SIZE = 10
  const registrantsTotalPages = Math.max(1, Math.ceil(filteredRegistrants.length / PAGE_SIZE))
  const attendanceTotalPages  = Math.max(1, Math.ceil(filteredAttendanceSorted.length / PAGE_SIZE))
  const scanlogsTotalPages    = Math.max(1, Math.ceil(filteredScanLogs.length / PAGE_SIZE))
  const staffTotalPages       = Math.max(1, Math.ceil(assignedStaff.length / PAGE_SIZE))
  const trashTotalPages       = Math.max(1, Math.ceil(filteredTrash.length / PAGE_SIZE))

  const safeRegPage   = Math.min(registrantsPage, registrantsTotalPages)
  const safeAttPage   = Math.min(attendancePage,  attendanceTotalPages)
  const safeScanPage  = Math.min(scanlogsPage,    scanlogsTotalPages)
  const safeStaffPage = Math.min(staffPage,        staffTotalPages)
  const safeTrashPage = Math.min(trashPage,        trashTotalPages)

  const pagedRegistrants = filteredRegistrants.slice((safeRegPage - 1) * PAGE_SIZE, safeRegPage * PAGE_SIZE)
  const pagedAttendance  = filteredAttendanceSorted.slice((safeAttPage - 1) * PAGE_SIZE, safeAttPage * PAGE_SIZE)
  const pagedScanLogs    = filteredScanLogs.slice((safeScanPage - 1) * PAGE_SIZE, safeScanPage * PAGE_SIZE)
  const pagedStaff       = assignedStaff.slice((safeStaffPage - 1) * PAGE_SIZE, safeStaffPage * PAGE_SIZE)
  const pagedTrash       = filteredTrash.slice((safeTrashPage - 1) * PAGE_SIZE, safeTrashPage * PAGE_SIZE)

  return (
    <>
      {/* ── TABS + TABLE ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden">

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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* ── REGISTRANTS ── */}
          {activeTab === 'registrants' && (
            <>
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50 flex-shrink-0">
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
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[130px]" /><col className="w-[220px]" /><col className="w-[150px]" />
                    <col className="w-[150px]" /><col className="w-[180px]" /><col className="w-[80px]" />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                    <tr>
                      {['Agent Code', 'Full Name', 'Branch', 'Team', 'Registered At', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filteredRegistrants.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-16 text-gray-400 dark:text-gray-500">No registrants found.</td></tr>
                    ) : pagedRegistrants.map(p => (
                      <tr key={p.participant_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors h-[52px]">
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-[#DC143C]">{fmtAgentCode(p.agent_code)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-white truncate">{p.full_name}</span>
                            {p.label && (() => {
                              const c = getLabelColor(String(p.label))
                              return (
                                <button onClick={() => onLabelOpen(p)}
                                  className={`inline-flex items-center whitespace-nowrap text-[10px] font-bold px-2 py-0.5 h-5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText}`}>
                                  {p.label}
                                </button>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{p.branch_name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs truncate max-w-0">{p.team_name}</td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">
                          {new Date(p.registered_at).toLocaleString('en-PH')}
                        </td>
                        <td className="px-5 py-3.5">
                          {isAdmin ? (
                            <RegistrantDropdown
                              participant={p}
                              onLabel={() => onLabelOpen(p, true)}
                              onRemove={() => onRemoveOpen(p)}
                            />
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── ATTENDANCE ── */}
          {activeTab === 'attendance' && (
            <>
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50 flex-wrap flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  {([
                    { value: 'all',         label: 'All' },
                    { value: 'checked_in',  label: 'Checked In' },
                    { value: 'checked_out', label: 'Checked Out' },
                    { value: 'flagged',     label: 'Early Out' },
                    { value: 'no_show',     label: ended ? 'No-Show' : 'Waiting' },
                  ] as const).map(f => (
                    <button key={f.value} onClick={() => setFilterStatus(f.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterStatus === f.value
                        ? 'bg-[#DC143C] border-[#DC143C] text-white'
                        : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                      }`}>
                      {f.label}
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
                {isAdmin && visibleCheckedInCount > 0 && (
                  <button onClick={onBulkCheckOutOpen}
                    className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[#DC143C] text-white text-xs font-bold hover:bg-[#b01030] transition-all shadow-[0_2px_8px_rgba(220,20,60,0.25)] ml-auto flex-shrink-0">
                    <BulkOutIcon />
                    Check Out All ({visibleCheckedInCount})
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[120px]" /><col className="w-[180px]" /><col className="w-[130px]" />
                    <col className="w-[120px]" /><col className="w-[200px]" /><col className="w-[200px]" />
                    <col className="w-[110px]" />{isAdmin && <col className="w-[110px]" />}
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                    <tr>
                      {['Agent Code', 'Full Name', 'Branch', 'Team', 'Check In', 'Check Out', 'Status', ...(isAdmin ? ['Actions'] : [])].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                    {filteredAttendanceSorted.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-16 text-gray-400 dark:text-gray-500">No attendance records found.</td></tr>
                    ) : pagedAttendance.map((s, idx) => {
                      const isEditing = isAdmin && !s._isPending && editingSessionId === s.session_id
                      return (
                        <tr key={s.session_id ?? `pending-${idx}`} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors h-[52px]">
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-[#DC143C]">{fmtAgentCode(s.agent_code)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 dark:text-white">{s.full_name}</span>
                              {(() => {
                                const p = participants.find(p => p.agent_code === s.agent_code)
                                if (!p?.label) return null
                                const c = getLabelColor(String(p.label))
                                return (
                                  <button onClick={() => onLabelOpen(p)}
                                    className={`inline-flex items-center whitespace-nowrap text-[10px] font-bold px-2 py-0.5 h-5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0 ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText}`}>
                                    {p.label}
                                  </button>
                                )
                              })()}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{s.branch_name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs">{s.team_name}</td>
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">
                            {isEditing ? (
                              <MaskedDateTimeInput value={editCheckIn} onChange={setEditCheckIn}
                                className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-800 dark:text-white text-xs outline-none focus:border-[#DC143C] transition-colors tabular-nums"
                              />
                            ) : (
                              s.check_in_time ? new Date(s.check_in_time).toLocaleString('en-PH') : '—'
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">
                            {isEditing ? (
                              <MaskedDateTimeInput value={editCheckOut} onChange={setEditCheckOut}
                                className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-800 dark:text-white text-xs outline-none focus:border-[#DC143C] transition-colors tabular-nums"
                              />
                            ) : (
                              s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'
                            )}
                          </td>
                          <td className="pl-2 pr-5 py-3.5">
                            {s._isPending ? (
                              ended ? (
                                <span className="inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">No-Show</span>
                              ) : (
                                <span className="inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Waiting</span>
                              )
                            ) : s.check_out_method === 'early_out' ? (
                              <button onClick={() => onEarlyOutOpen(s as any)}
                                className="inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:opacity-80 transition-opacity">
                                Early Out
                              </button>
                            ) : (
                              <span className={`inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full ${
                                s.check_out_time
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              }`}>
                                {s.check_out_time ? 'Checked Out' : 'Checked In'}
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-3.5 pl-7">
                              {s._isPending ? (
                                <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                              ) : isEditing ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => onSaveEdit(s.session_id)} disabled={editSaving} title="Save"
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                                    {editSaving
                                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    }
                                  </button>
                                  <button onClick={onCancelEdit} title="Cancel"
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => onStartEdit(s as any)} title="Edit times"
                                  className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:text-[#DC143C] hover:border-[#DC143C] transition-colors">
                                  <PencilIcon />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── SCAN LOGS ── */}
          {activeTab === 'scanlogs' && (
            <>
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50 flex-wrap flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  {([
                    { value: 'all',       label: 'All' },
                    { value: 'check_in',  label: 'Check In' },
                    { value: 'check_out', label: 'Check Out' },
                    { value: 'denied',    label: 'Denied' },
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
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[130px]" /><col className="w-[200px]" /><col className="w-[120px]" />
                    <col className="w-[200px]" /><col className="w-[180px]" />
                  </colgroup>
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
                    ) : pagedScanLogs.map(s => (
                      <tr key={s.scan_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors h-[52px]">
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-[#DC143C]">{fmtAgentCode(s.agent_code || s.qr_token || '')}</span>
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
              </div>
            </>
          )}

          {/* ── REPORTS ── */}
          {activeTab === 'reports' && (
            <div className="flex-1 overflow-auto">
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Event Summary</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Registered', value: visibleConfirmedCount },
                      { label: 'Total Attended',   value: visibleTotalAttended },
                      { label: 'Attendance Rate',  value: visibleConfirmedCount > 0 ? `${Math.round((visibleTotalAttended / visibleConfirmedCount) * 100)}%` : '—' },
                      { label: 'Currently Inside', value: visibleCheckedInCount },
                      { label: 'Early Outs',       value: visibleEarlyOutCount },
                      { label: 'No-Shows',         value: ended ? visibleNoShowCount : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 dark:bg-[#171717] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#2a2a2a]">
                        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-xl font-extrabold text-gray-800 dark:text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Export Data</h3>
                  <div className="flex flex-col gap-2.5">
                    {([
                      { key: 'registrants' as TabType, label: 'Registration Report', desc: `${visibleConfirmedCount} registrants`, color: '023E8A' },
                      { key: 'attendance'  as TabType, label: 'Attendance Report',   desc: `${visibleSessions.length} sessions`,   color: '276221' },
                      { key: 'scanlogs'   as TabType, label: 'Scan Logs Report',    desc: `${scanLogs.length} scan logs`,          color: '01796F' },
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
                        <button onClick={() => onExport(key)}
                          className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                          <DownloadIcon /> Export Excel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STAFF ── */}
          {activeTab === 'staff' && isAdmin && (
            <>
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50 flex-shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Staff members listed below can access this event's data filtered to their branch.
                </p>
              </div>
              {assignedStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-gray-300 dark:text-gray-600"><UsersIcon /></span>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No staff assigned to this event yet.</p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Assign staff when creating or editing an event.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col className="w-[130px]" /><col className="w-[200px]" /><col className="w-[160px]" />
                      <col className="w-[180px]" /><col className="w-[120px]" />
                    </colgroup>
                    <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                      <tr>
                        {['Agent Code', 'Full Name', 'Branch', 'Assigned At', 'Actions'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                      {pagedStaff.map(s => (
                        <tr key={s.user_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors h-[52px]">
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-[#DC143C]">{fmtAgentCode(s.agent_code)}</span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-white">{s.full_name}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{s.branch_name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs tabular-nums">
                            {new Date(s.assigned_at).toLocaleString('en-PH')}
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => onRemoveStaffOpen(s)} disabled={removingStaffId === s.user_id}
                              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50">
                              <TrashIcon />
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── TRASH ── */}
          {activeTab === 'trash' && isAdmin && (
            <>
              <div className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#171717]/50 flex-shrink-0">
                <div className="relative flex-1">
                  <input value={trashSearch} onChange={e => setTrashSearch(e.target.value)}
                    placeholder="Search name, agent code, branch…"
                    className="w-full h-9 pl-9 pr-4 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#DC143C] transition-colors"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><SearchIcon /></span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                  Removed registrants. Restore to reinstate or permanently delete.
                </p>
              </div>
              {filteredTrash.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <span className="text-gray-300 dark:text-gray-600"><TrashIcon /></span>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Trash is empty.</p>
                  <p className="text-gray-400 dark:text-gray-600 text-xs">Removed registrants will appear here.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col className="w-[130px]" /><col className="w-[220px]" /><col className="w-[150px]" />
                      <col className="w-[150px]" /><col className="w-[200px]" />
                    </colgroup>
                    <thead className="bg-gray-50 dark:bg-[#171717] sticky top-0 z-10">
                      <tr>
                        {['Agent Code', 'Full Name', 'Branch', 'Team', 'Actions'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#2a2a2a]">
                      {pagedTrash.map(p => (
                        <tr key={p.participant_id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors h-[52px]">
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-[#DC143C]">{fmtAgentCode(p.agent_code)}</span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-white">{p.full_name}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 text-xs font-medium">{p.branch_name}</span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs truncate max-w-0">{p.team_name}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => onRestoreParticipant(p)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
                                <RestoreIcon />
                                Restore
                              </button>
                              <button onClick={() => onPermDeleteOpen(p)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                                <TrashIcon />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── TABLE FOOTER + PAGINATION ── */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#171717] flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {activeTab === 'registrants' && `${filteredRegistrants.length} registrant${filteredRegistrants.length !== 1 ? 's' : ''}`}
            {activeTab === 'attendance'  && `${filteredAttendanceSorted.length} of ${totalAttendanceEntries} entries`}
            {activeTab === 'scanlogs'    && `${filteredScanLogs.length} scan log${filteredScanLogs.length !== 1 ? 's' : ''}`}
            {activeTab === 'staff'       && `${assignedStaff.length} staff member${assignedStaff.length !== 1 ? 's' : ''} assigned`}
            {activeTab === 'trash'       && `${filteredTrash.length} removed registrant${filteredTrash.length !== 1 ? 's' : ''}`}
          </span>
          {activeTab === 'registrants' && registrantsTotalPages > 1 && <PaginationBar page={safeRegPage}   totalPages={registrantsTotalPages} onChange={setRegistrantsPage} />}
          {activeTab === 'attendance'  && attendanceTotalPages  > 1 && <PaginationBar page={safeAttPage}   totalPages={attendanceTotalPages}  onChange={setAttendancePage} />}
          {activeTab === 'scanlogs'    && scanlogsTotalPages    > 1 && <PaginationBar page={safeScanPage}  totalPages={scanlogsTotalPages}    onChange={setScanlogsPage} />}
          {activeTab === 'staff'       && staffTotalPages       > 1 && <PaginationBar page={safeStaffPage} totalPages={staffTotalPages}       onChange={setStaffPage} />}
          {activeTab === 'trash'       && trashTotalPages       > 1 && <PaginationBar page={safeTrashPage} totalPages={trashTotalPages}       onChange={setTrashPage} />}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════ */}

      {/* ── LABEL VIEW / EDIT MODAL ── */}
      {labelViewModal.open && labelViewModal.participant && (() => {
        const p = labelViewModal.participant
        const isEdit = labelViewModal.editMode || !p.label
        const c = p.label ? getLabelColor(String(p.label)) : getLabelColor('Custom…')
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLabelViewModal({ open: false, participant: null, editMode: false })}>
            <div className="bg-white dark:bg-[#1c1c1c] rounded-3xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-8" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {!p.label ? 'Add Label' : isEdit ? 'Edit Label' : 'Label Details'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{p.full_name} · <span className="font-mono font-bold text-[#DC143C]">{fmtAgentCode(p.agent_code)}</span></p>
                </div>
                {p.label && !isEdit && (
                  <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${c.bg} ${c.text} ${c.border} ${c.darkBg} ${c.darkText}`}>
                    {p.label}
                  </span>
                )}
              </div>
              {!isEdit && p.label && (
                <>
                  <div className="bg-gray-50 dark:bg-[#141414] rounded-2xl p-5 mb-6 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Label</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.label}</p>
                    </div>
                    {p.label_description ? (
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Note</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{p.label_description}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-600 italic">No note added.</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setLabelViewModal({ open: false, participant: null, editMode: false })}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">
                      Close
                    </button>
                    <button onClick={() => setLabelViewModal({ open: labelViewModal.open, participant: labelViewModal.participant, editMode: true })}
                      className="flex-1 px-4 py-3 bg-[#DC143C] text-white rounded-xl font-semibold hover:bg-[#b01030] transition-all shadow-lg">
                      Edit
                    </button>
                  </div>
                </>
              )}
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
                              ? `${oc.bg} ${oc.text} ${oc.border} ${oc.darkBg} ${oc.darkText} ring-2 ring-offset-1 ring-current`
                              : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#2a2a2a] hover:border-gray-400'
                          }`}>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {labelType === 'Custom…' && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Label</label>
                      <input value={labelCustom} onChange={e => setLabelCustom(e.target.value)}
                        placeholder="e.g. Best Agent, Million Club…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-white text-sm outline-none focus:border-[#DC143C]"
                      />
                    </div>
                  )}
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 mt-1">Note <span className="font-normal normal-case">optional</span></label>
                  <textarea value={labelNote} onChange={e => setLabelNote(e.target.value)}
                    placeholder="e.g. Seated at Table 2, Row 5 · Perform after opening remarks"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#141414] text-gray-800 dark:text-white text-sm outline-none focus:border-[#DC143C] resize-none mb-5"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => p.label ? setLabelViewModal({ open: labelViewModal.open, participant: labelViewModal.participant, editMode: false }) : setLabelViewModal({ open: false, participant: null, editMode: false })}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">
                      Cancel
                    </button>
                    {p.label && (
                      <button onClick={() => onSetLabel(false)} disabled={labelLoading}
                        className="px-4 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 text-sm">
                        Remove
                      </button>
                    )}
                    <button onClick={() => onSetLabel(true)} disabled={labelLoading || (labelType === 'Custom…' && !labelCustom.trim())}
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

      {/* ── REMOVE REGISTRANT MODAL ── */}
      {removeModal.open && removeModal.participant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-[#DC143C] mt-[1px] [&>svg]:w-6 [&>svg]:h-6"><TrashIcon /></span>
                Remove Registrant
              </h2>
              <button onClick={() => setRemoveModal({ open: false, participant: null })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><XIcon /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to remove <strong className="text-gray-700 dark:text-gray-200">{removeModal.participant.full_name}</strong> from this event? They will be moved to Trash and can be restored later.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveModal({ open: false, participant: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={onRemoveConfirm} disabled={removeLoading}
                className="flex-1 h-[44px] rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {removeLoading ? 'Removing...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMANENT DELETE MODAL ── */}
      {permDeleteModal.open && permDeleteModal.participant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-[#DC143C] mt-[1px] [&>svg]:w-6 [&>svg]:h-6"><TrashIcon /></span>
                Permanently Delete
              </h2>
              <button onClick={() => setPermDeleteModal({ open: false, participant: null })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><XIcon /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Permanently delete <strong className="text-gray-700 dark:text-gray-200">{permDeleteModal.participant.full_name}</strong>? This will remove all their scan logs and attendance records. <span className="text-red-500 font-semibold">This cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPermDeleteModal({ open: false, participant: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={onPermDeleteConfirm} disabled={permDeleteLoading}
                className="flex-1 h-[44px] rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {permDeleteLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE STAFF MODAL ── */}
      {removeStaffModal.open && removeStaffModal.staff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Remove Staff Access</h2>
              <button onClick={() => setRemoveStaffModal({ open: false, staff: null })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><XIcon /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Remove <strong className="text-gray-700 dark:text-gray-200">{removeStaffModal.staff.full_name}</strong> from this event? They will lose access to this event's data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveStaffModal({ open: false, staff: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={onRemoveStaff} disabled={!!removingStaffId}
                className="flex-1 h-[44px] rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                {removingStaffId ? 'Removing...' : 'Remove Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK CHECK OUT MODAL ── */}
      {bulkCheckOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-[#DC143C] mt-[1px] [&>svg]:w-6 [&>svg]:h-6"><BulkOutIcon /></span>
                Check Out All
              </h2>
              <button onClick={() => setBulkCheckOutModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><XIcon /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will check out all <strong className="text-gray-700 dark:text-gray-200">{visibleCheckedInCount} attendee{visibleCheckedInCount !== 1 ? 's' : ''}</strong> currently inside the event. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBulkCheckOutModal(false)}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={onBulkCheckOut} disabled={bulkCheckOutLoading}
                className="flex-1 h-[44px] rounded-xl bg-[#DC143C] text-sm font-bold text-white hover:bg-[#b01030] transition-colors disabled:opacity-60">
                {bulkCheckOutLoading ? 'Checking out…' : `Check Out ${visibleCheckedInCount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EARLY OUT MODAL ── */}
      {earlyOutModal.open && earlyOutModal.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEarlyOutModal({ open: false, session: null })}>
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Early Out Details</h2>
              <button onClick={() => setEarlyOutModal({ open: false, session: null })} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><XIcon /></button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Participant</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{earlyOutModal.session.full_name}</p>
                <p className="text-xs text-[#DC143C] font-mono font-bold">{fmtAgentCode(earlyOutModal.session.agent_code)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-out Time</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {earlyOutModal.session.check_out_time ? new Date(earlyOutModal.session.check_out_time).toLocaleString('en-PH') : '—'}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {earlyOutModal.session.early_out_reason || <span className="italic text-gray-400">No reason provided.</span>}
                </p>
              </div>
            </div>
            <button onClick={() => setEarlyOutModal({ open: false, session: null })}
              className="w-full mt-4 h-[42px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}