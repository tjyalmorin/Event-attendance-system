import { useEffect, useState, useCallback, useRef } from 'react'
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

type TabType = 'registrants' | 'attendance' | 'scanlogs' | 'reports' | 'staff' | 'trash'

interface AssignedStaff {
  user_id: string
  full_name: string
  agent_code: string
  branch_name: string
  email: string
  assigned_at: string
}

const LABEL_OPTIONS = ['Awardee', 'VIP', 'Sponsor', 'Speaker', 'Staff', 'Custom…']

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string }> = {
  'Awardee':  { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300',  darkBg: 'dark:bg-amber-900/30',  darkText: 'dark:text-amber-300' },
  'VIP':      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-300' },
  'Sponsor':  { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   darkBg: 'dark:bg-blue-900/30',   darkText: 'dark:text-blue-300' },
  'Speaker':  { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-300',   darkBg: 'dark:bg-teal-900/30',   darkText: 'dark:text-teal-300' },
  'Staff':    { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300',   darkBg: 'dark:bg-gray-800',      darkText: 'dark:text-gray-300' },
}
const getLabelColor = (label: string) => LABEL_COLORS[label] ?? { bg: 'bg-red-100', text: 'text-[#DC143C]', border: 'border-red-300', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-300' }

const fmt12h = (t: string) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

const fmtAgentCode = (code: string) =>
  code || '—'

// ── Masked DateTime Input: MM/DD/YYYY HH:MM:SS AM ──
// Slots: 0-1=MM, 3-4=DD, 6-9=YYYY, 11-12=HH, 14-15=MM, 17-18=SS, 20-21=AM/PM
const MASK = 'MM/DD/YYYY HH:MM:SS AM'
const MASK_FIXED = new Set([2, 5, 10, 13, 16, 19]) // positions of / : space
const AMPM_POS = 20 // start of AM/PM slot

function MaskedDateTimeInput({ value, onChange, className }: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize blank mask
  const blank = () => '__/__/____ __:__:__ __'

  const applyMask = (raw: string): string => {
    // raw should already be in masked format; just ensure length
    if (!raw) return blank()
    return raw.padEnd(MASK.length, '_').slice(0, MASK.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    let pos = el.selectionStart ?? 0
    const chars = value.split('')

    if (e.key === 'Tab' || e.key === 'Enter') return

    e.preventDefault()

    // Skip over fixed characters to next editable slot
    const nextEditable = (from: number, dir: 1 | -1 = 1): number => {
      let p = from
      while (p >= 0 && p < MASK.length) {
        if (!MASK_FIXED.has(p)) return p
        p += dir
      }
      return from
    }

    if (e.key === 'ArrowRight') {
      if (pos >= AMPM_POS) return // already at end, do nothing
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
      if (pos >= AMPM_POS) return // don't allow erasing AM/PM
      const p = nextEditable(pos, -1)
      if (p >= 0 && !MASK_FIXED.has(p)) {
        chars[p] = '_'
        onChange(chars.join(''))
        setTimeout(() => el.setSelectionRange(p, p + 1), 0)
      }
      return
    }

    // AM/PM slot — only A or P accepted, then blur (done editing)
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

    // Numeric input
    if (/^\d$/.test(e.key)) {
      const p = nextEditable(pos)
      if (p < AMPM_POS) {
        chars[p] = e.key
        onChange(chars.join(''))
        // Advance — if next slot is AM/PM, move there; otherwise next editable
        const next = nextEditable(p + 1)
        setTimeout(() => el.setSelectionRange(next, next + 1), 0)
      }
    }
  }

  const handleFocus = () => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.setSelectionRange(0, 1)
    }, 0)
  }

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const pos = el.selectionStart ?? 0
    // Snap to nearest editable slot
    let p = pos
    if (MASK_FIXED.has(p)) {
      // try right first, then left
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
      onChange={() => {}} // controlled via keydown
      className={className}
      spellCheck={false}
    />
  )
}


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
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
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

// ── PaginationBar ──
function PaginationBar({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
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
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold border transition-all ${
                page === p
                  ? 'bg-[#DC143C] border-[#DC143C] text-white'
                  : 'border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
              }`}
            >
              {p}
            </button>
          )
        )
      }

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
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

export default function EventDetail() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'admin'
  useStaffProtection()

  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [cancelledParticipants, setCancelledParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('registrants')
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'checked_in' | 'checked_out' | 'flagged' | 'no_show'>('all')
  const [copied, setCopied] = useState(false)
  const [statusToggling, setStatusToggling] = useState(false)

  const [labelType, setLabelType] = useState('Awardee')
  const [labelCustom, setLabelCustom] = useState('')
  const [labelLoading, setLabelLoading] = useState(false)
  const [labelViewModal, setLabelViewModal] = useState<{ open: boolean; participant: Participant | null; editMode: boolean }>({ open: false, participant: null, editMode: false })
  const [labelNote, setLabelNote] = useState('')

  const [removeModal, setRemoveModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [removeLoading, setRemoveLoading] = useState(false)

  // ── Trash Bin state ──
  const [permDeleteModal, setPermDeleteModal] = useState<{ open: boolean; participant: Participant | null }>({ open: false, participant: null })
  const [permDeleteLoading, setPermDeleteLoading] = useState(false)

  const [earlyOutModal, setEarlyOutModal] = useState<{ open: boolean; session: AttendanceSession | null }>({ open: false, session: null })

  // ── Attendance edit state ──
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editCheckIn, setEditCheckIn]   = useState('')
  const [editCheckOut, setEditCheckOut] = useState('')
  const [editSaving, setEditSaving]     = useState(false)

  // ── Bulk check-out state ──
  const [bulkCheckOutLoading, setBulkCheckOutLoading] = useState(false)
  const [bulkCheckOutModal, setBulkCheckOutModal]     = useState(false)

  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([])
  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null)
  const [removeStaffModal, setRemoveStaffModal] = useState<{ open: boolean; staff: AssignedStaff | null }>({ open: false, staff: null })

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
  const [attendancePage, setAttendancePage]   = useState(1)
  const [scanlogsPage, setScanlogsPage]       = useState(1)
  const [staffPage, setStaffPage]             = useState(1)
  const [trashPage, setTrashPage]             = useState(1)

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (registrantsSortRef.current && !registrantsSortRef.current.contains(e.target as Node)) setRegistrantsSortOpen(false)
      if (attendanceSortRef.current && !attendanceSortRef.current.contains(e.target as Node)) setAttendanceSortOpen(false)
      if (scanlogsSortRef.current && !scanlogsSortRef.current.contains(e.target as Node)) setScanlogsSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setRegistrantsPage(1) }, [registrantsSearch, registrantsSort])
  useEffect(() => { setAttendancePage(1) },  [attendanceSearch, attendanceSort, filterStatus])
  useEffect(() => { setScanlogsPage(1) },    [scanlogsSearch, scanlogsSort, scanlogsType])
  useEffect(() => { setTrashPage(1) },       [trashSearch])

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

  // ── Trash Bin handlers ──
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

  // ── Start editing a session row ──
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

  // ── Bulk check-out all currently checked-in attendees ──
  const handleBulkCheckOut = async () => {
    setBulkCheckOutLoading(true)
    try {
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

    const safeSheetName = (name: string) =>
      name.replace(/[:\\/?*[\]]/g, '-').slice(0, 31)

    // ── Write one team block; returns next cursor row ──
    const writeTeamBlock = (
      ws: ExcelJS.Worksheet,
      teamName: string,
      colHeaders: string[],
      flatRows: (string | number | null)[],
      startRow: number,
      colCount: number,
    ): number => {
      let cursor = startRow

      // Team heading
      const teamHeadRow = ws.getRow(cursor)
      teamHeadRow.getCell(1).value = teamName
      teamHeadRow.getCell(1).font = { bold: true, size: 11, color: { argb: color.teamText } }
      teamHeadRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.teamBg } }
      teamHeadRow.getCell(1).alignment = { vertical: 'middle' }
      ws.mergeCells(cursor, 1, cursor, colCount)
      teamHeadRow.height = 20
      cursor++

      // Column headers
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

      // Data rows
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

        // Totals row
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

      cursor++ // spacer row
      return cursor
    }

    // ── All unique branches ──
    const allBranches = isAdmin
      ? [...new Set([
          ...participants.map(p => p.branch_name),
          ...sessions.map(s => s.branch_name),
        ])].filter(Boolean).sort()
      : [user.branch_name]

    // ── Summary sheet builder (registrants + attendance reports) ──
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

      // ── Event title header ──
      const evtTitleRow = ws.getRow(cursor)
      evtTitleRow.getCell(1).value = event.title
      evtTitleRow.getCell(1).font = { bold: true, size: 20, color: { argb: C.header } }
      evtTitleRow.getCell(1).alignment = { vertical: 'middle' }
      ws.mergeCells(cursor, 1, cursor, colCount)
      evtTitleRow.height = 32
      cursor++

      // ── Report label ──
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
      cursor++ // spacer

      // ─────────────────────────────────
      // SECTION 1: Overall Numbers
      // ─────────────────────────────────
      cursor = writeSectionTitle('Overall Numbers')
      const confirmedPts = pts.filter(p => p.registration_status === 'confirmed')
      const totalReg     = confirmedPts.length
      const totalAtt     = sess.length
      const totalIn      = sess.filter(s => s.check_in_time && !s.check_out_time).length
      const totalOut     = sess.filter(s => s.check_in_time && s.check_out_time).length
      const totalEarly   = sess.filter(s => s.check_out_method === 'early_out').length
      const totalNoShow  = Math.max(0, totalReg - totalAtt)
      const attRate      = totalReg > 0 ? Math.round((totalAtt / totalReg) * 100) : 0

      const overallData: [string, string | number][] = [
        ['Total Registered',  totalReg],
        ['Total Attended',    totalAtt],
        ['Attendance Rate',   `${attRate}%`],
        ['Currently Inside',  totalIn],
        ['Checked Out',       totalOut],
        ['Early Outs',        totalEarly],
        ['No-Shows',          totalNoShow],
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
      cursor++ // spacer

      // ─────────────────────────────────
      // SECTION 2: Per-Branch Breakdown
      // ─────────────────────────────────
      cursor = writeSectionTitle('Per-Branch Breakdown')
      cursor = writeTableHeader(['Branch', 'Registered', 'Attended', 'Att. Rate', 'Early Outs', 'No-Shows'])
      allBranches.forEach((branch, ri) => {
        const bReg   = confirmedPts.filter(p => p.branch_name === branch).length
        const bAtt   = sess.filter(s => s.branch_name === branch).length
        const bEarly = sess.filter(s => s.branch_name === branch && s.check_out_method === 'early_out').length
        const bNo    = Math.max(0, bReg - bAtt)
        const bRate  = bReg > 0 ? `${Math.round((bAtt / bReg) * 100)}%` : '—'
        cursor = writeDataRow([branch, bReg, bAtt, bRate, bEarly, bNo], ri)
      })
      // Branch totals row
      const totRow = ws.getRow(cursor)
      ;['TOTAL', totalReg, totalAtt, `${attRate}%`, totalEarly, totalNoShow].forEach((v, i) => {
        const cell = totRow.getCell(i + 1)
        cell.value = v
        cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.header } }
        cell.alignment = { vertical: 'middle', horizontal: i === 0 ? 'left' : 'center' }
      })
      ws.mergeCells(cursor, 1, cursor, 1)
      totRow.height = 18
      cursor++
      cursor++ // spacer

      // ─────────────────────────────────
      // SECTION 3: Per-Team Breakdown
      // ─────────────────────────────────
      cursor = writeSectionTitle('Per-Team Breakdown')
      cursor = writeTableHeader(['Team', 'Registered', 'Attended', 'Att. Rate', 'Early Outs', 'No-Shows'])
      const allTeams = [...new Set([
        ...confirmedPts.map(p => p.team_name || '(No Team)'),
        ...sess.map(s => s.team_name || '(No Team)'),
      ])].sort()
      allTeams.forEach((team, ri) => {
        const tReg   = confirmedPts.filter(p => (p.team_name || '(No Team)') === team).length
        const tAtt   = sess.filter(s => (s.team_name || '(No Team)') === team).length
        const tEarly = sess.filter(s => (s.team_name || '(No Team)') === team && s.check_out_method === 'early_out').length
        const tNo    = Math.max(0, tReg - tAtt)
        const tRate  = tReg > 0 ? `${Math.round((tAtt / tReg) * 100)}%` : '—'
        cursor = writeDataRow([team, tReg, tAtt, tRate, tEarly, tNo], ri)
      })
      cursor++ // spacer

      // ─────────────────────────────────
      // SECTION 4: Peak Check-in Hours
      // ─────────────────────────────────
      cursor = writeSectionTitle('Top Check-in Times (Peak Hours)')
      cursor = writeTableHeader(['Hour', 'Check-ins', 'Check-outs', 'Net Inside'])
      const hourMap: Record<number, { in: number; out: number }> = {}
      sess.forEach(s => {
        if (s.check_in_time) {
          const h = new Date(s.check_in_time).getHours()
          if (!hourMap[h]) hourMap[h] = { in: 0, out: 0 }
          hourMap[h].in++
        }
        if (s.check_out_time) {
          const h = new Date(s.check_out_time).getHours()
          if (!hourMap[h]) hourMap[h] = { in: 0, out: 0 }
          hourMap[h].out++
        }
      })
      const hourEntries = Object.entries(hourMap)
        .map(([h, v]) => ({ hour: Number(h), ...v }))
        .sort((a, b) => a.hour - b.hour)

      if (hourEntries.length === 0) {
        const noRow = ws.getRow(cursor)
        noRow.getCell(1).value = 'No check-in data yet.'
        noRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 }
        ws.mergeCells(cursor, 1, cursor, 4)
        cursor++
      } else {
        const maxIns = Math.max(...hourEntries.map(e => e.in))
        hourEntries.forEach((e, ri) => {
          const h12 = e.hour % 12 || 12
          const ampm = e.hour < 12 ? 'AM' : 'PM'
          const label = `${h12}:00 ${ampm}${e.in === maxIns ? ' ⭐ Peak' : ''}`
          const net = e.in - e.out
          cursor = writeDataRow([label, e.in, e.out, net >= 0 ? `+${net}` : `${net}`], ri)
        })
      }
    }

    if (docType === 'registrants') {
      const colHeaders = ['Agent Code', 'Full Name', 'Team', 'Registered At']
      const colCount = colHeaders.length

      writeSummarySheet({ allBranches, participants, sessions, reportLabel: 'Registration Report' })

      allBranches.forEach(branch => {
        const ws = wb.addWorksheet(safeSheetName(branch))
        ws.columns = [{ width: 20 }, { width: 30 }, { width: 22 }, { width: 24 }]

        const branchParticipants = participants.filter(p => p.branch_name === branch && p.registration_status === 'confirmed')
        const teams = [...new Set(branchParticipants.map(p => p.team_name))].filter(Boolean).sort() as string[]

        let cursor = 1

        // Branch title
        const titleRow = ws.getRow(cursor)
        titleRow.getCell(1).value = branch
        titleRow.getCell(1).font = { bold: true, size: 24, color: { argb: color.header } }
        titleRow.getCell(1).alignment = { vertical: 'middle' }
        ws.mergeCells(cursor, 1, cursor, colCount)
        titleRow.height = 38
        cursor++

        // Subtitle
        const subRow = ws.getRow(cursor)
        subRow.getCell(1).value = `${event.title} · ${new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
        subRow.getCell(1).font = { size: 10, color: { argb: 'FF6B7280' } }
        ws.mergeCells(cursor, 1, cursor, colCount)
        subRow.height = 16
        cursor++
        cursor++ // spacer

        if (branchParticipants.length === 0) {
          const noDataRow = ws.getRow(cursor)
          noDataRow.getCell(1).value = 'No registrants in this branch.'
          noDataRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 }
          ws.mergeCells(cursor, 1, cursor, colCount)
        } else {
          const allTeams = [...teams]
          if (branchParticipants.some(p => !p.team_name)) allTeams.push('(No Team)')

          allTeams.forEach(team => {
            const members = team === '(No Team)'
              ? branchParticipants.filter(p => !p.team_name)
              : branchParticipants.filter(p => p.team_name === team)
            const flatRows = members.flatMap(p => [
              p.agent_code, p.full_name, p.team_name || '',
              new Date(p.registered_at).toLocaleString('en-PH'),
            ])
            cursor = writeTeamBlock(ws, team, colHeaders, flatRows, cursor, colCount)
          })

          // Branch total
          const branchTotalRow = ws.getRow(cursor)
          branchTotalRow.getCell(1).value = `Branch Total: ${branchParticipants.length} registrant${branchParticipants.length !== 1 ? 's' : ''}`
          branchTotalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
          branchTotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
          for (let ci = 2; ci <= colCount; ci++) ws.getRow(cursor).getCell(ci).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
          ws.mergeCells(cursor, 1, cursor, colCount)
          branchTotalRow.height = 22
        }
      })

      await download(`${event.title.replace(/\s+/g, '_')}_RegistrationReport.xlsx`)
    }

    if (docType === 'attendance') {
      const colHeaders = ['Agent Code', 'Full Name', 'Team', 'Check In', 'Check Out', 'Status']
      const colCount = colHeaders.length

      writeSummarySheet({ allBranches, participants, sessions, reportLabel: 'Attendance Report' })

      allBranches.forEach(branch => {
        const ws = wb.addWorksheet(safeSheetName(branch))
        ws.columns = [{ width: 18 }, { width: 28 }, { width: 22 }, { width: 24 }, { width: 24 }, { width: 16 }]

        const branchSessions = sessions.filter(s => s.branch_name === branch)
        const teams = [...new Set(branchSessions.map(s => s.team_name))].filter(Boolean).sort() as string[]

        let cursor = 1

        // Branch title
        const titleRow = ws.getRow(cursor)
        titleRow.getCell(1).value = branch
        titleRow.getCell(1).font = { bold: true, size: 24, color: { argb: color.header } }
        titleRow.getCell(1).alignment = { vertical: 'middle' }
        ws.mergeCells(cursor, 1, cursor, colCount)
        titleRow.height = 38
        cursor++

        // Subtitle
        const subRow = ws.getRow(cursor)
        subRow.getCell(1).value = `${event.title} · ${new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
        subRow.getCell(1).font = { size: 10, color: { argb: 'FF6B7280' } }
        ws.mergeCells(cursor, 1, cursor, colCount)
        subRow.height = 16
        cursor++
        cursor++ // spacer

        if (branchSessions.length === 0) {
          const noDataRow = ws.getRow(cursor)
          noDataRow.getCell(1).value = 'No attendance records in this branch.'
          noDataRow.getCell(1).font = { italic: true, color: { argb: 'FF9CA3AF' }, size: 10 }
          ws.mergeCells(cursor, 1, cursor, colCount)
        } else {
          const allTeams = [...teams]
          if (branchSessions.some(s => !s.team_name)) allTeams.push('(No Team)')

          allTeams.forEach(team => {
            const members = team === '(No Team)'
              ? branchSessions.filter(s => !s.team_name)
              : branchSessions.filter(s => s.team_name === team)
            const flatRows = members.flatMap(s => {
              const status = s.check_out_method === 'early_out' ? 'Early Out'
                : s.check_out_time ? 'Checked Out' : 'Checked In'
              return [
                s.agent_code, s.full_name, s.team_name || '',
                new Date(s.check_in_time).toLocaleString('en-PH'),
                s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : 'Not yet checked out',
                status,
              ]
            })
            cursor = writeTeamBlock(ws, team, colHeaders, flatRows, cursor, colCount)
          })

          // Branch total
          const branchTotalRow = ws.getRow(cursor)
          branchTotalRow.getCell(1).value = `Branch Total: ${branchSessions.length} attendee${branchSessions.length !== 1 ? 's' : ''}`
          branchTotalRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
          branchTotalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
          for (let ci = 2; ci <= colCount; ci++) ws.getRow(cursor).getCell(ci).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.header } }
          ws.mergeCells(cursor, 1, cursor, colCount)
          branchTotalRow.height = 22
        }
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

  // ── Branch-filtered data ──
  const visibleParticipants = isAdmin
    ? participants
    : participants.filter(p => p.branch_name === user.branch_name)

  const visibleSessions = isAdmin
    ? sessions
    : sessions.filter(s => s.branch_name === user.branch_name)

  // ── Stats ──
  const visibleConfirmedCount = visibleParticipants.filter(p => p.registration_status === 'confirmed').length
  const visibleCheckedInCount = visibleSessions.filter(s => s.check_in_time && !s.check_out_time).length
  const visibleCompletedCount = visibleSessions.filter(s => s.check_in_time && s.check_out_time).length
  const visibleEarlyOutCount  = visibleSessions.filter(s => s.check_out_method === 'early_out').length
  const visibleTotalAttended  = visibleSessions.length
  const visibleNoShowCount    = Math.max(0, visibleConfirmedCount - visibleTotalAttended)

  const recentCheckIns = [...visibleSessions]
    .sort((a, b) => new Date(b.check_in_time).getTime() - new Date(a.check_in_time).getTime())
    .slice(0, 5)

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // ── Filtered registrants ──
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

  // ── Attendance merged rows: sessions + pending (Waiting/No-Show) ──
  const buildAttendanceRows = (ended: boolean) => {
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

    const sessionRows = visibleSessions.map(s => ({
      ...s,
      _isPending: false,
      _isNoShow: false,
    }))

    return [...sessionRows, ...pendingRows]
  }

  // ── Scan logs ──
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

  // ── Filtered trash ──
  const filteredTrash = cancelledParticipants
    .filter(p => {
      if (!trashSearch.trim()) return true
      const q = trashSearch.toLowerCase()
      return p.full_name?.toLowerCase().includes(q) || p.agent_code?.toLowerCase().includes(q) || p.branch_name?.toLowerCase().includes(q)
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

  const allAttendanceRows = buildAttendanceRows(ended)

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

            {/* Left: stat cards + registration link stacked */}
            <div className="flex-1 flex flex-col gap-3">
              {!isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/30 text-[#DC143C]">
                    Viewing: {user.branch_name}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">Data filtered to your branch</span>
                </div>
              )}

              {/* Row 1: 2 big cards */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard num={visibleConfirmedCount} label="Registered" accent={false} barWidth={100} icon={<UsersIcon />} />
                <StatCard num={visibleCheckedInCount} label="Currently Inside" accent={true}
                  barWidth={visibleConfirmedCount ? Math.round((visibleCheckedInCount / visibleConfirmedCount) * 100) : 0}
                  icon={<CheckIcon />} iconRed />
              </div>

              {/* Row 2: 4 small cards */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard num={visibleCompletedCount} label="Checked Out" accent={false}
                  barWidth={visibleConfirmedCount ? Math.round((visibleCompletedCount / visibleConfirmedCount) * 100) : 0}
                  icon={<LogoutIcon />} />
                <StatCard num={visibleEarlyOutCount} label="Early Out" accent={false}
                  barWidth={visibleConfirmedCount ? Math.round((visibleEarlyOutCount / visibleConfirmedCount) * 100) : 0}
                  icon={<AlertIcon />} />
                <StatCard
                  num={ended ? visibleNoShowCount : visibleNoShowCount}
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

              {/* Registration Link */}
              <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm px-5 py-3.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Registration Link</p>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 dark:text-white flex-shrink-0"><GlobeIcon /></span>
                      <p className="text-sm text-[#DC143C] dark:text-white font-mono truncate">{window.location.origin}/register/{event.event_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-xl hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                      <CopyIcon />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <a
                      href={`${window.location.origin}/register/${event.event_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] px-3 py-2 rounded-xl hover:border-[#DC143C] hover:text-[#DC143C] transition-all">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
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
            </div>

            {/* Right: Recent Check-In */}
            <div className="w-[300px] flex-shrink-0 bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-[#2a2a2a] flex-shrink-0">
                <span className="text-sm font-bold text-gray-800 dark:text-white">Recent Check-In</span>
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
                      <col className="w-[130px]" />
                      <col className="w-[220px]" />
                      <col className="w-[150px]" />
                      <col className="w-[150px]" />
                      <col className="w-[180px]" />
                      <col className="w-[80px]" />
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
                                  <button onClick={() => openLabelView(p)}
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
                                onLabel={() => openLabelView(p, true)}
                                onRemove={() => setRemoveModal({ open: true, participant: p })}
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
                      <button
                        onClick={() => setBulkCheckOutModal(true)}
                        className="flex items-center gap-2 h-9 px-3 rounded-xl bg-[#DC143C] text-white text-xs font-bold hover:bg-[#b01030] transition-all shadow-[0_2px_8px_rgba(220,20,60,0.25)] ml-auto flex-shrink-0">
                        <BulkOutIcon />
                        Check Out All ({visibleCheckedInCount})
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col className="w-[120px]" />
                      <col className="w-[180px]" />
                      <col className="w-[130px]" />
                      <col className="w-[120px]" />
                      <col className="w-[200px]" />
                      <col className="w-[200px]" />
                      <col className="w-[110px]" />
                      {isAdmin && <col className="w-[110px]" />}
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
                                  <button onClick={() => openLabelView(p)}
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

                          {/* ── Check In cell ── */}
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">
                            {isEditing ? (
                              <MaskedDateTimeInput
                                value={editCheckIn}
                                onChange={setEditCheckIn}
                                className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-800 dark:text-white text-xs outline-none focus:border-[#DC143C] transition-colors tabular-nums"
                              />
                            ) : (
                              s.check_in_time ? new Date(s.check_in_time).toLocaleString('en-PH') : '—'
                            )}
                          </td>

                          {/* ── Check Out cell ── */}
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs tabular-nums">
                            {isEditing ? (
                              <MaskedDateTimeInput
                                value={editCheckOut}
                                onChange={setEditCheckOut}
                                className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#141414] text-gray-800 dark:text-white text-xs outline-none focus:border-[#DC143C] transition-colors tabular-nums"
                              />
                            ) : (
                              s.check_out_time ? new Date(s.check_out_time).toLocaleString('en-PH') : '—'
                            )}
                          </td>

                          {/* ── Status cell ── */}
                          <td className="pl-2 pr-5 py-3.5">
                            {s._isPending ? (
                              ended ? (
                                <span className="inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                  No-Show
                                </span>
                              ) : (
                                <span className="inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                  Waiting
                                </span>
                              )
                            ) : s.check_out_method === 'early_out' ? (
                              <button
                                onClick={() => setEarlyOutModal({ open: true, session: s as any })}
                                className="inline-flex items-center whitespace-nowrap text-xs font-semibold px-2.5 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:opacity-80 transition-opacity"
                              >
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

                          {/* ── Admin Actions cell ── */}
                          {isAdmin && (
                            <td className="px-5 py-3.5 pl-7">
                              {s._isPending ? (
                                <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                              ) : isEditing ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleSaveEdit(s.session_id)}
                                    disabled={editSaving}
                                    title="Save"
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-colors">
                                    {editSaving
                                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    }
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    title="Cancel"
                                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-400 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(s as any)}
                                  title="Edit times"
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
                      <col className="w-[130px]" />
                      <col className="w-[200px]" />
                      <col className="w-[120px]" />
                      <col className="w-[200px]" />
                      <col className="w-[180px]" />
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

              {/* ── REPORTS TAB ── */}
              {activeTab === 'reports' && (
                <div className="flex-1 overflow-auto">
                <div className="p-6 flex flex-col gap-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Event Summary</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Total Registered', value: visibleConfirmedCount },
                        { label: 'Total Attended', value: visibleTotalAttended },
                        { label: 'Attendance Rate', value: visibleConfirmedCount > 0 ? `${Math.round((visibleTotalAttended / visibleConfirmedCount) * 100)}%` : '—' },
                        { label: 'Currently Inside', value: visibleCheckedInCount },
                        { label: 'Early Outs', value: visibleEarlyOutCount },
                        { label: 'No-Shows', value: ended ? visibleNoShowCount : '—' },
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
                        { key: 'attendance'  as TabType, label: 'Attendance Report',  desc: `${visibleSessions.length} sessions`,   color: '276221' },
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
                </div>
              )}

              {/* ── ASSIGNED STAFF TAB ── */}
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
                        <col className="w-[130px]" />
                        <col className="w-[200px]" />
                        <col className="w-[160px]" />
                        <col className="w-[180px]" />
                        <col className="w-[120px]" />
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
                              <button
                                onClick={() => setRemoveStaffModal({ open: true, staff: s })}
                                disabled={removingStaffId === s.user_id}
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

              {/* ── TRASH TAB ── */}
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
                        <col className="w-[130px]" />
                        <col className="w-[220px]" />
                        <col className="w-[150px]" />
                        <col className="w-[150px]" />
                        <col className="w-[200px]" />
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
                                <button
                                  onClick={() => handleRestoreParticipant(p)}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all">
                                  <RestoreIcon />
                                  Restore
                                </button>
                                <button
                                  onClick={() => setPermDeleteModal({ open: true, participant: p })}
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

            {/* Table footer with pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#171717] flex-shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {activeTab === 'registrants' && `${filteredRegistrants.length} registrant${filteredRegistrants.length !== 1 ? 's' : ''}`}
                {activeTab === 'attendance'  && `${filteredAttendanceSorted.length} of ${totalAttendanceEntries} entries`}
                {activeTab === 'scanlogs'    && `${filteredScanLogs.length} scan log${filteredScanLogs.length !== 1 ? 's' : ''}`}
                {activeTab === 'staff'       && `${assignedStaff.length} staff member${assignedStaff.length !== 1 ? 's' : ''} assigned`}
                {activeTab === 'trash'       && `${filteredTrash.length} removed registrant${filteredTrash.length !== 1 ? 's' : ''}`}
              </span>

              {/* Pagination controls */}
              {activeTab === 'registrants' && registrantsTotalPages > 1 && (
                <PaginationBar page={safeRegPage} totalPages={registrantsTotalPages} onChange={setRegistrantsPage} />
              )}
              {activeTab === 'attendance' && attendanceTotalPages > 1 && (
                <PaginationBar page={safeAttPage} totalPages={attendanceTotalPages} onChange={setAttendancePage} />
              )}
              {activeTab === 'scanlogs' && scanlogsTotalPages > 1 && (
                <PaginationBar page={safeScanPage} totalPages={scanlogsTotalPages} onChange={setScanlogsPage} />
              )}
              {activeTab === 'staff' && staffTotalPages > 1 && (
                <PaginationBar page={safeStaffPage} totalPages={staffTotalPages} onChange={setStaffPage} />
              )}
              {activeTab === 'trash' && trashTotalPages > 1 && (
                <PaginationBar page={safeTrashPage} totalPages={trashTotalPages} onChange={setTrashPage} />
              )}
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
                    <button onClick={() => setLabelViewModal(v => ({ ...v, editMode: true }))}
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
                    <button onClick={() => p.label ? setLabelViewModal(v => ({ ...v, editMode: false })) : setLabelViewModal({ open: false, participant: null, editMode: false })}
                      className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">
                      Cancel
                    </button>
                    {p.label && (
                      <button onClick={() => handleSetLabel(false)} disabled={labelLoading}
                        className="px-4 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 text-sm">
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => handleSetLabel(true)}
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

      {/* ── REMOVE REGISTRANT MODAL ── */}
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
              Are you sure you want to remove <strong className="text-gray-700 dark:text-gray-200">{removeModal.participant.full_name}</strong> from this event? They will be moved to Trash and can be restored later.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveModal({ open: false, participant: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={handleRemoveConfirm} disabled={removeLoading}
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
              <button onClick={() => setPermDeleteModal({ open: false, participant: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Permanently delete <strong className="text-gray-700 dark:text-gray-200">{permDeleteModal.participant.full_name}</strong>? This will remove all their scan logs and attendance records. <span className="text-red-500 font-semibold">This cannot be undone.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPermDeleteModal({ open: false, participant: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={handlePermDeleteConfirm} disabled={permDeleteLoading}
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
              <button onClick={() => setRemoveStaffModal({ open: false, staff: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Remove <strong className="text-gray-700 dark:text-gray-200">{removeStaffModal.staff.full_name}</strong> from this event? They will lose access to this event's data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveStaffModal({ open: false, staff: null })}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={handleRemoveStaff} disabled={!!removingStaffId}
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
              <button onClick={() => setBulkCheckOutModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will check out all <strong className="text-gray-700 dark:text-gray-200">{visibleCheckedInCount} attendee{visibleCheckedInCount !== 1 ? 's' : ''}</strong> currently inside the event. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBulkCheckOutModal(false)}
                className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                Cancel
              </button>
              <button onClick={handleBulkCheckOut} disabled={bulkCheckOutLoading}
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
              <button onClick={() => setEarlyOutModal({ open: false, session: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
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
    </div>
  )
}