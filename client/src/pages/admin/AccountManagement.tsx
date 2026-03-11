import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Sidebar from '../../components/Sidebar'
import { getAllUsersApi, createUserApi, deleteUserApi, updateUserApi, toggleUserActiveApi } from '../../api/users.api'
import { getAuditLogsApi, createAuditLogApi, AuditLogEntry, deleteAuditLogsByIdsApi, deleteAuditLogsOlderThanApi, clearAllAuditLogsApi } from '../../api/audit-logs.api'
import { User } from '../../types'
import { getAllBranchesApi, BranchItem } from '../../api/branches.api'

// ── Icons ──────────────────────────────────────────────────
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
)
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const BanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
)
const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
    <line x1="12" y1="7" x2="12" y2="12"/><line x1="12" y1="12" x2="15" y2="14"/>
  </svg>
)

// ── Scrollbar styles ───────────────────────────────────────

const SCROLLBAR_STYLES = `
  [data-custom-select-list]::-webkit-scrollbar { width: 6px; }
  [data-custom-select-list]::-webkit-scrollbar-track { background: transparent; }
  [data-custom-select-list]::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  [data-custom-select-list]::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  .dark [data-custom-select-list]::-webkit-scrollbar-track { background: #1c1c1c; }
  .dark [data-custom-select-list]::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
  .dark [data-custom-select-list]::-webkit-scrollbar-thumb:hover { background: #DC143C; }
`
const SCROLLBAR_COLOR_LIGHT = '#d1d5db transparent'
const SCROLLBAR_COLOR_DARK  = '#3a3a3a #1c1c1c'

// ── Helpers ────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}
const formatTime = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// ── Password validation ────────────────────────────────────
const pwChecks = (pw: string) => ({
  length:    pw.length >= 8,
  uppercase: /[A-Z]/.test(pw),
  number:    /[0-9]/.test(pw),
})

// ── Types ──────────────────────────────────────────────────
type ModalType = 'create' | 'edit' | 'delete' | 'toggle' | null
type PageView = 'accounts' | 'history'

interface UserFormState {
  agent_code: string; full_name: string; email: string; password: string
  branch_name: string; role: 'admin' | 'staff'; team_name: string
}

// ── History Entry — backed by DB via AuditLogEntry ────────
type HistoryEntry = AuditLogEntry

const ITEMS_PER_PAGE = 10
const EMPTY_FORM: UserFormState = {
  agent_code: '', full_name: '', email: '', password: '', branch_name: '', role: 'staff', team_name: ''
}

// ── Action badge colors ────────────────────────────────────
const actionBadge = (action: HistoryEntry['action']) => {
  switch (action) {
    case 'created':          return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/40'
    case 'edited':           return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'
    case 'deactivated':      return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800/40'
    case 'reactivated':      return 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200 dark:border-teal-800/40'
    case 'deleted':          return 'bg-red-50 text-[#DC143C] dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/40'
    case 'password_changed': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
    default:                 return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
  }
}
const actionLabel = (action: HistoryEntry['action']) => {
  switch (action) {
    case 'created':          return 'Created'
    case 'edited':           return 'Edited'
    case 'deactivated':      return 'Deactivated'
    case 'reactivated':      return 'Reactivated'
    case 'deleted':          return 'Deleted'
    case 'password_changed': return 'Password Changed'
  }
}

// ── Custom Select Dropdown ─────────────────────────────────
interface SelectOption { label: string; value: string }
interface CustomSelectProps {
  value: string
  onChange: (val: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  centered?: boolean
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = 'Select...', centered = false }) => {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const openRef = useRef(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => { openRef.current = open }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const clickedBtn = btnRef.current?.contains(target)
      const clickedDrop = dropRef.current?.contains(target)
      if (!clickedBtn && !clickedDrop) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const onResize = () => setOpen(false)
    const onScroll = (e: Event) => {
      if (dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
      requestAnimationFrame(() => {
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        let top: number
        if (centered) {
          const dropHeight = Math.min(options.length * 42, 208)
          const centeredTop = rect.top + rect.height / 2 - dropHeight / 2
          top = Math.max(12, Math.min(centeredTop, window.innerHeight - dropHeight - 12))
        } else {
          top = rect.bottom + 4
        }
        setDropPos({ top, left: rect.left, width: rect.width })
        setOpen(p => !p)
      })
    }
  }

  const dropdown = open ? createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999 }}
      className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl"
      onWheel={e => e.stopPropagation()}
    >
      <style>{SCROLLBAR_STYLES}</style>
      <div
        data-custom-select-list
        className="max-h-52 overflow-y-auto rounded-xl"
        onWheel={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        style={{ scrollbarWidth: 'thin', scrollbarColor: document.documentElement.classList.contains('dark') ? SCROLLBAR_COLOR_DARK : SCROLLBAR_COLOR_LIGHT }}
      >
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setOpen(false) }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors
              ${opt.value === value
                ? 'bg-[#DC143C]/10 text-[#DC143C] font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`h-[44px] w-full rounded-xl border-[1.5px] bg-gray-50 dark:bg-[#0f0f0f] px-4 text-sm outline-none transition-all flex items-center justify-between
          ${open
            ? 'border-[#DC143C] bg-white dark:bg-[#0f0f0f] shadow-[0_0_0_3px_rgba(220,20,60,0.08)]'
            : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] cursor-pointer'
          }`}
      >
        <span className={selected ? 'text-gray-800 dark:text-white' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-[#DC143C]' : 'text-gray-400'}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {dropdown}
    </>
  )
}

// ── Shared Cancel Button ───────────────────────────────────
const CancelBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all">
    Cancel
  </button>
)

// ── Filter Dropdown (Sort-By style) ───────────────────────
interface FilterDropdownProps {
  value: string
  onChange: (val: string) => void
  options: { value: string; label: string }[]
  label?: string
}
const FilterDropdown: React.FC<FilterDropdownProps> = ({ value, onChange, options, label }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between gap-2 px-3.5 py-2 h-9 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#333] transition-all shadow-sm min-w-[148px]"
      >
        <span className="flex items-center gap-1.5">
          {label && <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}:</span>}
          <span className={value !== options[0]?.value ? 'text-[#DC143C]' : ''}>{selected?.label ?? 'All'}</span>
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 min-w-full bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-30">
          {options.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors whitespace-nowrap
                ${opt.value === value ? 'bg-[#DC143C]/10 text-[#DC143C] font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Date Range Picker ──────────────────────────────────────
const DATE_RANGE_STYLES = `
  .dtrp .react-datepicker { font-family: inherit; border: none; box-shadow: none; background: transparent; }
  .dtrp .react-datepicker__month-container { background: transparent; }
  .dtrp .react-datepicker__header { background: transparent; border-bottom: 1px solid #f3f4f6; padding: 0 0 10px 0; }
  .dark .dtrp .react-datepicker__header { border-bottom-color: #2a2a2a; }
  .dtrp .react-datepicker__current-month { font-size: 13px; font-weight: 700; color: #111827; margin-bottom: 8px; }
  .dark .dtrp .react-datepicker__current-month { color: #fff; }
  .dtrp .react-datepicker__day-name { color: #9ca3af; font-size: 11px; font-weight: 600; width: 2rem; line-height: 2rem; }
  .dtrp .react-datepicker__day { width: 2rem; line-height: 2rem; border-radius: 8px; font-size: 13px; color: #374151; transition: all 0.15s; margin: 1px; }
  .dark .dtrp .react-datepicker__day { color: #e5e7eb; }
  .dtrp .react-datepicker__day:hover { background: #fee2e2; color: #DC143C; }
  .dark .dtrp .react-datepicker__day:hover { background: rgba(220,20,60,0.15); color: #DC143C; }
  .dtrp .react-datepicker__day--selected, .dtrp .react-datepicker__day--keyboard-selected { background: #DC143C !important; color: #fff !important; font-weight: 700; border-radius: 8px !important; }
  .dtrp .react-datepicker__day--keyboard-selected:not(.react-datepicker__day--selected) { background: transparent !important; color: inherit !important; font-weight: normal !important; }
  .dtrp .react-datepicker__day--today { font-weight: 700; color: #DC143C; }
  .dark .dtrp .react-datepicker__day--today { color: #ff6b6b; }
  .dtrp .react-datepicker__day--outside-month { color: #d1d5db; }
  .dark .dtrp .react-datepicker__day--outside-month { color: #4b5563; }
  .dtrp .react-datepicker__day--disabled { color: #d1d5db !important; cursor: not-allowed !important; background: transparent !important; }
  .dark .dtrp .react-datepicker__day--disabled { color: #3a3a3a !important; }
  .dtrp .react-datepicker__navigation-icon::before { border-color: #9ca3af; }
  .dtrp .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before { border-color: #DC143C; }
  .dtrp .react-datepicker__navigation { top: 0; }
  .dtrp .react-datepicker__triangle { display: none; }
`

interface DateRangePickerProps {
  from: Date | null
  to: Date | null
  onChange: (from: Date | null, to: Date | null) => void
}
const DateRangePicker: React.FC<DateRangePickerProps> = ({ from, to, onChange }) => {
  const [open, setOpen] = useState(false)
  const [tempFrom, setTempFrom] = useState<Date | null>(from)
  const [tempTo, setTempTo] = useState<Date | null>(to)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) { setTempFrom(from); setTempTo(to) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const fmt = (d: Date | null) => d
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const hasRange = from || to
  const label = from && to
    ? `${fmt(from)} → ${fmt(to)}`
    : from ? fmt(from)!
    : 'Select dates'

  return (
    <div className="relative" ref={ref}>
      <style>{DATE_RANGE_STYLES}</style>

      {/* Single trigger button */}
      <button type="button" onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 h-9 px-3.5 rounded-xl text-sm font-semibold border transition-all shadow-sm focus:outline-none
          ${hasRange
            ? 'bg-[#DC143C]/5 border-[#DC143C]/30 text-[#DC143C]'
            : open
              ? 'border-[#DC143C] bg-white dark:bg-[#1c1c1c] ring-2 ring-[#DC143C]/20 text-gray-700 dark:text-gray-300'
              : 'bg-white dark:bg-[#1c1c1c] border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-[#333]'
          }`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>{label}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 flex-shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Shared popover with two inline calendars */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl shadow-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] p-5">
          <div className="dtrp flex gap-6">
            {/* From calendar */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">From</p>
              <DatePicker
                selected={tempFrom}
                onChange={(d: Date | null) => { setTempFrom(d) }}
                inline
                dateFormat="MMM d, yyyy"
              />
            </div>
            <div className="w-px bg-gray-100 dark:bg-[#2a2a2a]" />
            {/* To calendar */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">To</p>
              <DatePicker
                selected={tempTo}
                onChange={(d: Date | null) => { setTempTo(d) }}
                inline
                dateFormat="MMM d, yyyy"
                minDate={tempFrom ?? undefined}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-[#2a2a2a]">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {tempFrom && tempTo
                ? `${fmt(tempFrom)} → ${fmt(tempTo)}`
                : tempFrom ? `From ${fmt(tempFrom)}` : 'Select a start date'
              }
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)}
                className="px-4 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-all">
                Cancel
              </button>
              <button type="button" onClick={() => { onChange(tempFrom, tempTo); setOpen(false) }}
                className="px-4 py-1.5 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Shared Modal Shell ─────────────────────────────────────
interface ModalShellProps {
  onClose: () => void
  icon: React.ReactNode
  iconClass?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode
  wide?: boolean
}

const ModalShell: React.FC<ModalShellProps> = ({
  onClose, icon, iconClass = 'text-gray-500 dark:text-gray-400',
  title, subtitle, children, footer, wide = false,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className={`bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full mx-4 ${wide ? 'max-w-lg' : 'max-w-md'}`}>
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424] rounded-t-2xl">
        <div className="flex items-center gap-3">
          <span className={iconClass}>{icon}</span>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors">
          <XIcon />
        </button>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{children}</div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      <div className="flex justify-end gap-2.5 px-5 py-4 bg-gray-50 dark:bg-[#242424] rounded-b-2xl">{footer}</div>
    </div>
  </div>
)

// ── Action Dropdown ────────────────────────────────────────
interface ActionDropdownProps {
  user: User & { is_active: boolean }
  isSelf: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ user, isSelf, onEdit, onToggle, onDelete }) => {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, dropUp: false })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const clickHandler = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!el.closest('[data-dropdown]')) setOpen(false)
    }
    const scrollHandler = () => setOpen(false)
    document.addEventListener('mousedown', clickHandler)
    window.addEventListener('scroll', scrollHandler, true)
    return () => {
      document.removeEventListener('mousedown', clickHandler)
      window.removeEventListener('scroll', scrollHandler, true)
    }
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const dropUp = rect.bottom + 160 > window.innerHeight
      setPos({
        top: dropUp ? rect.top - 8 : rect.bottom + 4,
        left: rect.right - 176,
        dropUp,
      })
    }
    setOpen(p => !p)
  }

  return (
    <div data-dropdown>
      <button ref={btnRef} onClick={handleOpen} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded">
        <DotsIcon />
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top:    pos.dropUp ? undefined : pos.top,
            bottom: pos.dropUp ? window.innerHeight - pos.top : undefined,
            left:   pos.left,
            zIndex: 9999,
          }}
          className="w-44 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden"
        >
          <button onClick={() => { setOpen(false); onEdit() }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
            <EditIcon />Edit Account
          </button>
          <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mx-2" />
          <button onClick={() => { setOpen(false); onToggle() }} disabled={isSelf}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {user.is_active ? <BanIcon /> : <CheckCircleIcon />}
            {user.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
          <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mx-2" />
          <button onClick={() => { setOpen(false); onDelete() }} disabled={isSelf}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <TrashIcon />Delete Account
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export default function AccountManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<(User & { is_active: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'agent_code'>('date')
  const [openSortDropdown, setOpenSortDropdown] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageView, setPageView] = useState<PageView>('accounts')

  // History — DB-backed
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  // History table state
  const [histPage, setHistPage] = useState(1)
  const [histSelected, setHistSelected] = useState<Set<number>>(new Set())
  const [histDateFrom, setHistDateFrom] = useState<Date | null>(null)
  const [histDateTo, setHistDateTo] = useState<Date | null>(null)
  const [histActionFilter, setHistActionFilter] = useState<string>('all')
  const [histSearchQuery, setHistSearchQuery] = useState('')
  // Modals for history
  const [showClearModal, setShowClearModal] = useState(false)
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false)
  const [showRetentionModal, setShowRetentionModal] = useState(false)
  const [retentionDays, setRetentionDays] = useState(90)
  const [histActionLoading, setHistActionLoading] = useState(false)

  const loadHistory = async () => {
    setHistoryLoading(true)
    try { setHistory(await getAuditLogsApi()) } catch {}
    finally { setHistoryLoading(false) }
  }

  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<(User & { is_active: boolean }) | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = storedUser?.role || 'staff'
  const [BRANCHES, setBRANCHES] = useState<BranchItem[]>([])

  useEffect(() => { getAllBranchesApi().then(setBRANCHES).catch(() => {}) }, [])
  useEffect(() => {
    if (userRole !== 'admin') { navigate('/admin/settings/profile'); return }
    loadUsers()
    loadHistory()
  }, [])
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) setOpenSortDropdown(false)
    }
    const scrollHandler = () => setOpenSortDropdown(false)
    document.addEventListener('mousedown', clickHandler)
    window.addEventListener('scroll', scrollHandler, true)
    return () => {
      document.removeEventListener('mousedown', clickHandler)
      window.removeEventListener('scroll', scrollHandler, true)
    }
  }, [])
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t) }
  }, [toast])
  useEffect(() => {
    if (modalType === 'create' || modalType === 'edit') document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [modalType])

  const loadUsers = async () => {
    try { setUsers(await getAllUsersApi() as any) }
    catch { navigate('/admin/login') }
    finally { setLoading(false) }
  }

  // ── Add history entry — saved to DB ───────────────────
  const addHistory = async (entry: {
    action: HistoryEntry['action']
    target_id: string
    target_name: string
    target_role: string
    details?: string | null
  }) => {
    try {
      const log = await createAuditLogApi(entry)
      setHistory(prev => [log, ...prev])
    } catch (err) {
      console.error('Failed to save audit log:', err)
    }
  }

  const openModal = (type: ModalType, user?: User & { is_active: boolean }) => {
    setModalType(type); setSelectedUser(user || null)
    setModalError(''); setShowPassword(false)
    if (type === 'edit' && user) {
      setForm({
        agent_code: user.agent_code ?? '',
        full_name: user.full_name ?? '',
        email: user.email ?? '',
        password: '',
        branch_name: (user as any).branch_name ?? '',
        role: (user.role as 'admin' | 'staff') ?? 'staff',
        team_name: (user as any).team_name ?? '',
      })
    } else { setForm(EMPTY_FORM) }
  }
  const closeModal = () => { setModalType(null); setSelectedUser(null) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setModalLoading(true); setModalError('')
    if (form.agent_code && form.agent_code.length !== 8) { setModalError('Agent code must be exactly 8 digits'); setModalLoading(false); return }
    try {
      const payload: any = {
        full_name: form.full_name, email: form.email, password: form.password,
        branch_name: form.branch_name, role: form.role,
        agent_code: form.agent_code.trim() || '', team_name: form.team_name.trim() || null,
      }
      const created = await createUserApi(payload)
      setUsers(prev => [created as any, ...prev])
      await addHistory({
        action: 'created',
        target_id: (created as any).user_id,
        target_name: form.full_name,
        target_role: form.role,
        details: `Created ${form.role} account for ${form.full_name}${form.branch_name ? ` · Branch: ${form.branch_name}` : ''}${form.team_name ? ` · Team: ${form.team_name}` : ''}`,
      })
      closeModal()
      setToast('Account created successfully')
    } catch (err: any) { setModalError(err.response?.data?.error || 'Failed to create account') }
    finally { setModalLoading(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setModalLoading(true); setModalError('')
    if (form.agent_code && form.agent_code.length !== 8) { setModalError('Agent code must be exactly 8 digits'); setModalLoading(false); return }
    try {
      const payload: any = { agent_code: form.agent_code.trim() || '', full_name: form.full_name, email: form.email, branch_name: form.branch_name, role: form.role, team_name: form.team_name.trim() || null }
      if (form.password.trim()) payload.password = form.password
      const updated = await updateUserApi(selectedUser!.user_id, payload)
      setUsers(prev => prev.map(u => u.user_id === updated.user_id ? { ...u, ...updated } : u))
      // Build change details
      const changes: string[] = []
      const prev = selectedUser!
      if (form.full_name !== prev.full_name) changes.push(`Name: "${prev.full_name}" → "${form.full_name}"`)
      if (form.email !== prev.email) changes.push(`Email changed`)
      if (form.branch_name !== (prev as any).branch_name) changes.push(`Branch: "${(prev as any).branch_name || '—'}" → "${form.branch_name || '—'}"`)
      if (form.team_name !== (prev as any).team_name) changes.push(`Team: "${(prev as any).team_name || '—'}" → "${form.team_name || '—'}"`)
      if (form.role !== prev.role) changes.push(`Role: "${prev.role}" → "${form.role}"`)
      if (form.password.trim()) changes.push('Password changed')
      await addHistory({
        action: form.password.trim() && changes.length === 1 ? 'password_changed' : 'edited',
        target_id: selectedUser!.user_id,
        target_name: form.full_name,
        target_role: form.role,
        details: changes.length > 0 ? changes.join(' · ') : 'Account details updated',
      })
      closeModal()
      setToast('Account updated successfully')
    } catch (err: any) { setModalError(err.response?.data?.error || 'Failed to update account') }
    finally { setModalLoading(false) }
  }

  const handleToggle = async () => {
    setModalLoading(true); setModalError('')
    try {
      const updated = await toggleUserActiveApi(selectedUser!.user_id)
      setUsers(prev => prev.map(u => u.user_id === updated.user_id ? { ...u, ...updated } : u))
      await addHistory({
        action: updated.is_active ? 'reactivated' : 'deactivated',
        target_id: selectedUser!.user_id,
        target_name: selectedUser!.full_name,
        target_role: selectedUser!.role,
        details: `Account ${updated.is_active ? 'reactivated' : 'deactivated'} for ${selectedUser!.full_name}`,
      })
      closeModal()
      setToast(updated.is_active ? 'Account reactivated successfully' : 'Account deactivated successfully')
    } catch (err: any) { setModalError(err.response?.data?.error || 'Failed to update account') }
    finally { setModalLoading(false) }
  }

  const handleDelete = async () => {
    setModalLoading(true); setModalError('')
    try {
      await deleteUserApi(selectedUser!.user_id)
      setUsers(prev => prev.filter(u => u.user_id !== selectedUser!.user_id))
      await addHistory({
        action: 'deleted',
        target_id: selectedUser!.user_id,
        target_name: selectedUser!.full_name,
        target_role: selectedUser!.role,
        details: `Deleted account for ${selectedUser!.full_name} (${selectedUser!.role})`,
      })
      closeModal()
      setToast('Account deleted successfully')
    } catch (err: any) { setModalError(err.response?.data?.error || 'Failed to delete account') }
    finally { setModalLoading(false) }
  }

  // ── Stats ──
  const totalUsers = users.length
  const adminCount = users.filter(u => u.role === 'admin').length
  const staffCount = users.filter(u => u.role === 'staff').length
  const thisMonth  = users.filter(u => {
    const d = new Date((u as any).created_at); const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const filtered = users
    .filter(u => roleFilter === 'all' ? true : u.role === roleFilter)
    .filter(u => {
      const q = search.toLowerCase()
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.agent_code || '').toLowerCase().includes(q) ||
        ((u as any).branch_name || '').toLowerCase().includes(q) ||
        ((u as any).team_name || '').toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'name')       return a.full_name.localeCompare(b.full_name)
      if (sortBy === 'agent_code') return (a.agent_code || '').localeCompare(b.agent_code || '')
      return new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const getPageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages]
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage, '...', totalPages]
  }

  const sortLabels: Record<string, string> = {
    date: 'Date Created',
    name: 'Name A–Z',
    agent_code: 'Agent Code',
  }

  const selectedBranch = BRANCHES.find(b => b.name === form.branch_name)
  const teamOptions = [
    { value: '', label: 'None' },
    ...(selectedBranch?.teams ?? []).map((t: any) => ({ value: t.name, label: t.name })),
  ]

  const inputClass = "h-[44px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] px-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#0f0f0f] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
  const labelClass = "text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-400"
  const isEdit = modalType === 'edit'
  const checks = pwChecks(form.password)
  const showPwHints = (modalType === 'create' || modalType === 'edit') && form.password.length > 0

  return (
    <div className="flex min-h-screen bg-[#f0f1f3] dark:bg-[#0f0f0f]">
      <Sidebar userRole={userRole} />
      <div className="flex-1 overflow-auto">

        {/* ── HEADER ── */}
        <div className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="px-12 h-[76px] flex items-center justify-between">
            <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
              Account<span className="text-[#DC143C]">.</span>Management
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/20 text-[#DC143C] text-xs font-bold uppercase tracking-wide">
                <ShieldIcon />Admin Only
              </div>
              <button onClick={() => openModal('create')}
                className="flex items-center gap-2 bg-[#DC143C] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#b01030] transition-all hover:shadow-lg hover:-translate-y-px shadow-[0_4px_16px_rgba(220,20,60,0.22)]">
                <PlusIcon />Create Account
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-5">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { num: totalUsers, label: 'Total Accounts',  accent: true,  fill: 100,                                                          icon: <UsersIcon />,  iconRed: true  },
              { num: adminCount, label: 'Admins',           accent: false, fill: totalUsers ? Math.round((adminCount / totalUsers) * 100) : 0, icon: <ShieldIcon />, iconRed: false },
              { num: staffCount, label: 'Staff Accounts',   accent: false, fill: totalUsers ? Math.round((staffCount / totalUsers) * 100) : 0, icon: <UserIcon />,   iconRed: false },
              { num: thisMonth,  label: 'Added This Month', accent: false, fill: totalUsers ? Math.round((thisMonth  / totalUsers) * 100) : 0, icon: <ClockIcon />,  iconRed: false },
            ].map((s, i) => (
              <div key={i} className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5 pb-6 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${s.iconRed ? 'bg-[#DC143C]/10 text-[#DC143C]' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>{s.icon}</div>
                <div className={`text-4xl font-extrabold tracking-tight leading-none mb-1 ${s.accent ? 'text-[#DC143C]' : 'text-gray-900 dark:text-white'}`}>{loading ? '—' : s.num}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-[#2a2a2a]">
                  <div className="h-full bg-[#DC143C] rounded-r-full transition-all duration-700" style={{ width: `${s.fill}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── TAB SWITCHER + FILTER ROW ── */}
          <div className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-sm">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-100 dark:border-[#2a2a2a]">
              <button
                onClick={() => setPageView('accounts')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px
                  ${pageView === 'accounts'
                    ? 'border-[#DC143C] text-[#DC143C]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <UsersIcon />
                Accounts
              </button>
              <button
                onClick={() => { setPageView('history'); loadHistory() }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-all -mb-px
                  ${pageView === 'history'
                    ? 'border-[#DC143C] text-[#DC143C]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <HistoryIcon />
                Modification History
                {history.length > 0 && (
                  <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-[#DC143C]/10 text-[#DC143C]">
                    {history.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── ACCOUNTS VIEW ── */}
            {pageView === 'accounts' && (
              <>
                {/* Filter row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-[1px] text-gray-400 whitespace-nowrap">Role</span>
                  {(['all', 'admin', 'staff'] as const).map(r => (
                    <button key={r} onClick={() => { setRoleFilter(r); setCurrentPage(1) }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${roleFilter === r ? 'bg-[#DC143C] border-[#DC143C] text-white' : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'}`}>
                      {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}

                  <div className="w-px h-5 bg-gray-200 dark:bg-[#2a2a2a] mx-1" />
                  <div className="flex-1" />

                  {/* Search */}
                  <div className="relative w-72">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
                    <input
                      className="w-full h-9 pl-9 pr-3 rounded-lg border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 focus:border-[#DC143C] transition-all"
                      placeholder="Search name, agent code, branch…"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                    />
                  </div>

                  {/* Sort dropdown */}
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      onClick={() => setOpenSortDropdown(prev => !prev)}
                      className="flex items-center justify-between gap-2 px-4 py-2 w-[160px] bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#333333] transition-all shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400">
                        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
                      </svg>
                      <span className="flex-1 text-left">{sortLabels[sortBy]}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${openSortDropdown ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                    {openSortDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-30">
                        {(['date', 'name', 'agent_code'] as const).map(s => (
                          <button key={s} onClick={() => { setSortBy(s); setOpenSortDropdown(false) }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === s ? 'bg-[#DC143C]/10 text-[#DC143C] font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]'}`}>
                            {sortLabels[s]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-y border-gray-100 dark:border-[#2a2a2a] bg-gray-50/70 dark:bg-[#161616]">
                        {['Agent Code', 'Name / Email', 'Branch', 'Team', 'Role', 'Date Created', 'Actions'].map((h, i) => (
                          <th key={h} className={`py-3 text-[11px] font-bold uppercase tracking-[1px] text-gray-400 dark:text-gray-500 ${i === 0 ? 'pl-7 pr-5' : 'px-5'} ${h === 'Actions' ? 'pr-7 text-center' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} className="py-20 text-center text-gray-400 text-sm">Loading...</td></tr>
                      ) : paginated.length === 0 ? (
                        <tr><td colSpan={7} className="py-20 text-center text-gray-400 text-sm">No accounts found</td></tr>
                      ) : paginated.map(u => {
                        const inactive = !u.is_active
                        const createdAt = (u as any).created_at || ''
                        return (
                          <tr key={u.user_id} className={`border-b border-gray-50 dark:border-[#2a2a2a] last:border-b-0 transition-colors ${inactive ? 'bg-gray-50 dark:bg-[#161616]' : 'hover:bg-[#fdf5f7] dark:hover:bg-[#1f1416]'}`}>
                            <td className={`pl-7 pr-5 py-3.5 ${inactive ? 'opacity-40' : ''}`}>
                              <span className={`font-bold text-xs tracking-wide ${inactive ? 'text-gray-400' : 'text-[#DC143C]'}`}>{u.agent_code || '—'}</span>
                            </td>
                            <td className={`px-5 py-3.5 ${inactive ? 'opacity-40' : ''}`}>
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0
                                  ${u.role === 'admin'
                                    ? 'bg-[#DC143C]/10 border-[#DC143C]/20 text-[#DC143C]'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400'
                                  }`}>
                                  {u.full_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white text-sm">{u.full_name}</div>
                                  <div className="text-xs text-gray-400">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className={`px-5 py-3.5 ${inactive ? 'opacity-40' : ''}`}>
                              <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 text-xs font-medium">
                                {(u as any).branch_name || '—'}
                              </span>
                            </td>
                            <td className={`px-5 py-3.5 text-gray-600 dark:text-gray-400 text-sm ${inactive ? 'opacity-40' : ''}`}>
                              {(u as any).team_name || '—'}
                            </td>
                            <td className={`px-5 py-3.5 ${inactive ? 'opacity-40' : ''}`}>
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                                u.role === 'admin'
                                  ? 'bg-[#DC143C]/10 text-[#DC143C] dark:bg-[#DC143C]/20'
                                  : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                              }`}>{u.role}</span>
                            </td>
                            <td className={`px-5 py-3.5 ${inactive ? 'opacity-40' : ''}`}>
                              <div className="group relative w-fit">
                                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-default">{formatDate(createdAt)}</span>
                                {createdAt && (
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 pointer-events-none">
                                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">{formatTime(createdAt)}</div>
                                    <div className="w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45 ml-3 -mt-1" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="pr-7 px-5 py-3.5">
                              <div className="flex justify-center">
                                <ActionDropdown
                                  user={u}
                                  isSelf={u.user_id === storedUser?.user_id}
                                  onEdit={() => openModal('edit', u)}
                                  onToggle={() => openModal('toggle', u)}
                                  onDelete={() => openModal('delete', u)}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-7 py-3.5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616] rounded-b-xl">
                  <span className="text-xs text-gray-400">
                    {filtered.length === 0 ? 'No accounts' : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} account${filtered.length !== 1 ? 's' : ''}`}
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeftIcon />
                      </button>
                      {getPageNums().map((p, i) => p === '...'
                        ? <span key={`d${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
                        : <button key={p} onClick={() => setCurrentPage(p as number)}
                            className={`w-7 h-7 rounded-lg border text-xs font-semibold transition-all ${currentPage === p ? 'bg-[#DC143C] border-[#DC143C] text-white' : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C]'}`}>
                            {p}
                          </button>
                      )}
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRightIcon />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── HISTORY VIEW ── */}
            {pageView === 'history' && (() => {
              const HIST_PER_PAGE = 10
              const filteredHist = history.filter(e => {
                const d = new Date(e.created_at)
                if (histDateFrom) { const f = new Date(histDateFrom); f.setHours(0,0,0,0); if (d < f) return false }
                if (histDateTo)   { const t = new Date(histDateTo); t.setHours(23,59,59,999); if (d > t) return false }
                if (histActionFilter !== 'all' && e.action !== histActionFilter) return false
                if (histSearchQuery) {
                  const q = histSearchQuery.toLowerCase()
                  if (!e.target_name.toLowerCase().includes(q) && !e.actor_name.toLowerCase().includes(q) && !(e.details || '').toLowerCase().includes(q)) return false
                }
                return true
              })
              const histTotalPages = Math.max(1, Math.ceil(filteredHist.length / HIST_PER_PAGE))
              const histPaginated  = filteredHist.slice((histPage - 1) * HIST_PER_PAGE, histPage * HIST_PER_PAGE)
              const allPageSelected = histPaginated.length > 0 && histPaginated.every(e => histSelected.has(e.log_id))
              const getHistPageNums = () => {
                if (histTotalPages <= 5) return Array.from({ length: histTotalPages }, (_, i) => i + 1)
                if (histPage <= 3) return [1, 2, 3, '...', histTotalPages]
                if (histPage >= histTotalPages - 2) return [1, '...', histTotalPages - 2, histTotalPages - 1, histTotalPages]
                return [1, '...', histPage, '...', histTotalPages]
              }
              const toggleSelectAll = () => {
                if (allPageSelected) {
                  setHistSelected(prev => { const n = new Set(prev); histPaginated.forEach(e => n.delete(e.log_id)); return n })
                } else {
                  setHistSelected(prev => { const n = new Set(prev); histPaginated.forEach(e => n.add(e.log_id)); return n })
                }
              }

              return (
                <div>
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/60 dark:bg-[#161616]">
                    {/* Search */}
                    <div className="relative w-52">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><SearchIcon /></div>
                      <input className="w-full h-9 pl-9 pr-3 rounded-lg border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 focus:border-[#DC143C] transition-all"
                        placeholder="Search name, actor..."
                        value={histSearchQuery}
                        onChange={e => { setHistSearchQuery(e.target.value); setHistPage(1) }} />
                    </div>

                    {/* Action filter */}
                    <FilterDropdown
                      value={histActionFilter}
                      onChange={v => { setHistActionFilter(v); setHistPage(1) }}
                      label="Action"
                      options={[
                        { value: 'all', label: 'All Actions' },
                        { value: 'created', label: 'Created' },
                        { value: 'edited', label: 'Edited' },
                        { value: 'deactivated', label: 'Deactivated' },
                        { value: 'reactivated', label: 'Reactivated' },
                        { value: 'deleted', label: 'Deleted' },
                        { value: 'password_changed', label: 'Password Changed' },
                      ]}
                    />

                    {/* Date range */}
                    <DateRangePicker
                      from={histDateFrom}
                      to={histDateTo}
                      onChange={(f, t) => { setHistDateFrom(f); setHistDateTo(t); setHistPage(1) }}
                    />
                    {(histDateFrom || histDateTo || histActionFilter !== 'all' || histSearchQuery) && (
                      <button onClick={() => { setHistDateFrom(null); setHistDateTo(null); setHistActionFilter('all'); setHistSearchQuery(''); setHistPage(1) }}
                        className="h-9 px-3 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a2a] hover:border-[#DC143C] hover:text-[#DC143C] transition-all bg-white dark:bg-[#0f0f0f]">
                        Clear filters
                      </button>
                    )}

                    <div className="flex-1" />

                    {/* Delete selected */}
                    {histSelected.size > 0 && (
                      <button onClick={() => setShowDeleteSelectedModal(true)}
                        className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/20 text-[#DC143C] border border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                        <TrashIcon />Delete {histSelected.size} selected
                      </button>
                    )}

                    {/* Auto-retention */}
                    <button onClick={() => setShowRetentionModal(true)}
                      className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a] transition-all bg-white dark:bg-[#1c1c1c]">
                      <ClockIcon />Auto-Delete
                    </button>

                    {/* Clear all */}
                    <button onClick={() => setShowClearModal(true)}
                      className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-[#DC143C] border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all">
                      <TrashIcon />Clear All
                    </button>
                  </div>

                  {/* Record count */}
                  <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {filteredHist.length} record{filteredHist.length !== 1 ? 's' : ''}
                      {histSelected.size > 0 && <span className="ml-2 text-[#DC143C] font-semibold">· {histSelected.size} selected</span>}
                    </span>
                  </div>

                  {/* Table */}
                  {historyLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-8 h-8 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-sm text-gray-400">Loading history...</p>
                    </div>
                  ) : filteredHist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-400 mb-3"><HistoryIcon /></div>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No records found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-[#2a2a2a] bg-gray-50/70 dark:bg-[#161616]">
                              <th className="pl-5 pr-3 py-3 w-10">
                                <button
                                  onClick={toggleSelectAll}
                                  className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    allPageSelected
                                      ? 'border-[#DC143C] bg-[#DC143C]'
                                      : 'border-gray-300 dark:border-[#3a3a3a] hover:border-[#DC143C]'
                                  }`}
                                >
                                  {allPageSelected && (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  )}
                                </button>
                              </th>
                              {['Action', 'Target', 'Details', 'Performed By', 'Date & Time'].map(h => (
                                <th key={h} className="px-3 py-3 text-[11px] font-bold uppercase tracking-[1px] text-gray-400 dark:text-gray-500 text-left last:pr-5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {histPaginated.map(entry => {
                              const isSelected = histSelected.has(entry.log_id)
                              return (
                                <tr key={entry.log_id}
                                  onClick={() => setHistSelected(prev => { const n = new Set(prev); isSelected ? n.delete(entry.log_id) : n.add(entry.log_id); return n })}
                                  className={`border-b border-gray-50 dark:border-[#1e1e1e] last:border-b-0 transition-colors cursor-pointer
                                    ${isSelected ? 'bg-[#DC143C]/5 dark:bg-[#DC143C]/10' : 'hover:bg-gray-50/80 dark:hover:bg-[#1a1a1a]'}`}>
                                  <td className="pl-5 pr-3 py-3.5" onClick={e => e.stopPropagation()}>
                                    <button
                                      onClick={() => setHistSelected(prev => { const n = new Set(prev); isSelected ? n.delete(entry.log_id) : n.add(entry.log_id); return n })}
                                      className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected
                                          ? 'border-[#DC143C] bg-[#DC143C]'
                                          : 'border-gray-300 dark:border-[#3a3a3a] hover:border-[#DC143C]'
                                      }`}
                                    >
                                      {isSelected && (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                                          <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-3 py-3.5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${actionBadge(entry.action)}`}>
                                      {actionLabel(entry.action)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">{entry.target_name}</span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                                        entry.target_role === 'admin' ? 'bg-[#DC143C]/10 text-[#DC143C]' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                      }`}>{entry.target_role}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3.5 max-w-[260px]">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                                      {entry.details || <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                                    </p>
                                  </td>
                                  <td className="px-3 py-3.5">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                                        ${entry.actor_role === 'admin' ? 'bg-[#DC143C]/10 text-[#DC143C]' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                                        {entry.actor_name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{entry.actor_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3.5 pr-5 whitespace-nowrap">
                                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(entry.created_at)}</div>
                                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{formatTime(entry.created_at)}</div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616] rounded-b-xl">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Showing {(histPage - 1) * HIST_PER_PAGE + 1}–{Math.min(histPage * HIST_PER_PAGE, filteredHist.length)} of {filteredHist.length}
                        </span>
                        {histTotalPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1}
                              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <ChevronLeftIcon />
                            </button>
                            {getHistPageNums().map((p, i) => p === '...'
                              ? <span key={`d${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
                              : <button key={p} onClick={() => setHistPage(p as number)}
                                  className={`w-7 h-7 rounded-lg border text-xs font-semibold transition-all ${histPage === p ? 'bg-[#DC143C] border-[#DC143C] text-white' : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C]'}`}>
                                  {p}
                                </button>
                            )}
                            <button onClick={() => setHistPage(p => Math.min(histTotalPages, p + 1))} disabled={histPage === histTotalPages}
                              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-500 hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                              <ChevronRightIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

          </div>
        </div>
      </div>


      {/* ── HISTORY: Clear All Modal ── */}
      {showClearModal && (
        <ModalShell onClose={() => setShowClearModal(false)} icon={<TrashIcon />} iconClass="text-red-500"
          title="Clear All History"
          footer={
            <>
              <CancelBtn onClick={() => setShowClearModal(false)} />
              <button disabled={histActionLoading} onClick={async () => {
                setHistActionLoading(true)
                try {
                  await clearAllAuditLogsApi()
                  setHistory([])
                  setHistSelected(new Set())
                  setHistPage(1)
                  setShowClearModal(false)
                  setToast('Modification history cleared')
                } catch { setToast('Failed to clear history') }
                finally { setHistActionLoading(false) }
              }} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                {histActionLoading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Clearing...</> : 'Clear All History'}
              </button>
            </>
          }>
          <p>Are you sure you want to delete <strong>all {history.length} modification records</strong>?</p>
          <p className="mt-2 text-xs text-red-500 font-medium">This action cannot be undone.</p>
        </ModalShell>
      )}

      {/* ── HISTORY: Delete Selected Modal ── */}
      {showDeleteSelectedModal && (
        <ModalShell onClose={() => setShowDeleteSelectedModal(false)} icon={<TrashIcon />} iconClass="text-red-500"
          title="Delete Selected Records"
          footer={
            <>
              <CancelBtn onClick={() => setShowDeleteSelectedModal(false)} />
              <button disabled={histActionLoading} onClick={async () => {
                setHistActionLoading(true)
                try {
                  const ids = Array.from(histSelected)
                  await deleteAuditLogsByIdsApi(ids)
                  setHistory(prev => prev.filter(e => !histSelected.has(e.log_id)))
                  setHistSelected(new Set())
                  setShowDeleteSelectedModal(false)
                  setToast(`Deleted ${ids.length} record${ids.length !== 1 ? 's' : ''}`)
                } catch { setToast('Failed to delete records') }
                finally { setHistActionLoading(false) }
              }} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                {histActionLoading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</> : `Delete ${histSelected.size} record${histSelected.size !== 1 ? 's' : ''}`}
              </button>
            </>
          }>
          <p>Delete <strong>{histSelected.size} selected record{histSelected.size !== 1 ? 's' : ''}</strong> from modification history?</p>
          <p className="mt-2 text-xs text-red-500 font-medium">This action cannot be undone.</p>
        </ModalShell>
      )}

      {/* ── HISTORY: Auto-Retention Modal ── */}
      {showRetentionModal && (
        <ModalShell onClose={() => setShowRetentionModal(false)} icon={<ClockIcon />} iconClass="text-blue-500"
          title="Auto-Delete Old Records"
          subtitle="Remove records older than a set number of days"
          footer={
            <>
              <CancelBtn onClick={() => setShowRetentionModal(false)} />
              <button disabled={histActionLoading} onClick={async () => {
                setHistActionLoading(true)
                try {
                  const result = await deleteAuditLogsOlderThanApi(retentionDays)
                  await loadHistory()
                  setHistSelected(new Set())
                  setShowRetentionModal(false)
                  setToast(`Deleted ${result.deleted} record${result.deleted !== 1 ? 's' : ''} older than ${retentionDays} days`)
                } catch { setToast('Failed to run auto-delete') }
                finally { setHistActionLoading(false) }
              }} className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                {histActionLoading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</> : 'Run Auto-Delete'}
              </button>
            </>
          }>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Delete all modification history records older than:</p>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {[30, 60, 90, 180, 365].map(d => (
              <button key={d} type="button" onClick={() => setRetentionDays(d)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${retentionDays === d ? 'bg-[#DC143C] border-[#DC143C] text-white shadow-sm' : 'border-gray-200 dark:border-[#3a3a3a] text-gray-600 dark:text-gray-300 hover:border-[#DC143C] hover:text-[#DC143C] bg-white dark:bg-[#1c1c1c]'}`}>
                {d} days
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Custom</span>
            <input type="number" min={1} max={3650} value={retentionDays}
              onChange={e => setRetentionDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 h-9 px-3 rounded-lg border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0f0f0f] text-sm text-gray-800 dark:text-white outline-none focus:border-[#DC143C] transition-all text-center font-semibold" />
            <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
          </div>

          {/* Warning */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/40 px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              Records older than <strong>{retentionDays} day{retentionDays !== 1 ? 's' : ''}</strong> will be permanently deleted and cannot be recovered.
            </p>
          </div>
        </ModalShell>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircleIcon />
          {toast}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Create / Edit */}
      {(modalType === 'create' || modalType === 'edit') && (
        <ModalShell
          onClose={closeModal}
          icon={modalType === 'create' ? <PlusIcon /> : <EditIcon />}
          title={modalType === 'create' ? 'Create Account' : 'Edit Account'}
          subtitle={modalType === 'edit' ? selectedUser?.full_name : undefined}
          wide
          footer={
            <>
              <CancelBtn onClick={closeModal} />
              <button form="account-form" type="submit" disabled={modalLoading}
                className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {modalLoading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>{isEdit ? 'Saving...' : 'Creating...'}</>
                  : isEdit ? 'Save Changes' : 'Create Account'
                }
              </button>
            </>
          }
        >
          <form id="account-form" onSubmit={isEdit ? handleEdit : handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} placeholder="Full name" required />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="email@example.com" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Agent Code <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                <input className={inputClass} value={form.agent_code}
                  onChange={e => { const digits = e.target.value.replace(/\D/g, '').slice(0, 8); setForm(p => ({ ...p, agent_code: digits })) }}
                  placeholder="8-digit code" maxLength={8} inputMode="numeric" />
                {form.agent_code.length > 0 && form.agent_code.length !== 8 && (
                  <span className="text-[11px] text-red-500">Must be exactly 8 digits</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Role</label>
                <CustomSelect
                  value={form.role}
                  onChange={val => setForm(p => ({ ...p, role: val as 'admin' | 'staff' }))}
                  options={[{ value: 'staff', label: 'Staff' }, { value: 'admin', label: 'Admin' }]}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>Branch</label>
                <CustomSelect
                  value={form.branch_name}
                  onChange={val => setForm(p => ({ ...p, branch_name: val, team_name: '' }))}
                  options={BRANCHES.map(b => ({ value: b.name, label: b.name }))}
                  placeholder="— Select branch —"
                  centered
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>Team <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                <CustomSelect
                  value={form.team_name}
                  onChange={val => setForm(p => ({ ...p, team_name: val }))}
                  options={teamOptions}
                  placeholder={form.branch_name ? '— Select team —' : '— Select a branch first —'}
                  centered
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>
                  {isEdit ? <>New Password <span className="ml-1 normal-case font-normal text-gray-400">(leave blank to keep current)</span></> : 'Password'}
                </label>
                <div className="relative">
                  <input className={`${inputClass} pr-11`} type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(p => ({...p, password: e.target.value}))}
                    placeholder={isEdit ? 'Enter new password to change' : 'Min. 8 chars, 1 uppercase, 1 number'}
                    required={!isEdit} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {showPwHints && (
                  <div className="flex gap-3 mt-1">
                    {[{ ok: checks.length, label: '8+ chars' }, { ok: checks.uppercase, label: 'Uppercase' }, { ok: checks.number, label: 'Number' }].map(c => (
                      <span key={c.label} className={`text-[11px] font-semibold flex items-center gap-1 ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                        <span>{c.ok ? '✓' : '○'}</span> {c.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {modalError && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{modalError}</div>}
          </form>
        </ModalShell>
      )}

      {/* Toggle Active */}
      {modalType === 'toggle' && selectedUser && (() => { const u = selectedUser; return (
        <ModalShell onClose={closeModal} icon={u.is_active ? <BanIcon /> : <CheckCircleIcon />}
          iconClass={u.is_active ? 'text-orange-500' : 'text-green-500'}
          title={u.is_active ? 'Deactivate Account' : 'Reactivate Account'}
          subtitle={u.full_name}
          footer={
            <>
              <CancelBtn onClick={closeModal} />
              <button onClick={handleToggle} disabled={modalLoading}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${u.is_active ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}>
                {modalLoading ? 'Updating...' : u.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            </>
          }
        >
          {u.is_active
            ? <><p>Are you sure you want to <strong>deactivate</strong> this account?</p><p className="mt-2 text-xs text-orange-500">This user will be blocked from logging in.</p></>
            : <><p>Are you sure you want to <strong>reactivate</strong> this account?</p><p className="mt-2 text-xs text-green-600">This user will be able to log in again.</p></>
          }
          {modalError && <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{modalError}</div>}
        </ModalShell>
      )})()}

      {/* Delete */}
      {modalType === 'delete' && selectedUser && (() => { const u = selectedUser; return (
        <ModalShell onClose={closeModal} icon={<TrashIcon />} iconClass="text-red-500"
          title="Delete Account" subtitle={u.full_name}
          footer={
            <>
              <CancelBtn onClick={closeModal} />
              <button onClick={handleDelete} disabled={modalLoading}
                className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {modalLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </>
          }
        >
          <p>Are you sure you want to permanently delete <strong>{u.full_name}</strong>'s account?</p>
          <p className="mt-2 text-xs text-red-500">This action cannot be undone.</p>
          {modalError && <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{modalError}</div>}
        </ModalShell>
      )})()}
    </div>
  )
}