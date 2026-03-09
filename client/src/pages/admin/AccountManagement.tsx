import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { getAllUsersApi, createUserApi, deleteUserApi, updateUserApi, toggleUserActiveApi } from '../../api/users.api'
import { User } from '../../types'
import { useBranches } from '../../hooks/useBranches'

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
    <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

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

interface UserFormState {
  agent_code: string; full_name: string; email: string; password: string
  branch_name: string; role: 'admin' | 'staff'
}

const ITEMS_PER_PAGE = 10
const EMPTY_FORM: UserFormState = {
  agent_code: '', full_name: '', email: '', password: '', branch_name: '', role: 'staff'
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

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = 'Select...', required, centered = false }) => {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
    }
  }, [open])

  const handleOpen = () => {
    if (btnRef.current) {
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
    }
    setOpen(p => !p)
  }

  const dropdown = open ? createPortal(
    <div
      style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999 }}
      className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl"
      onWheel={e => e.stopPropagation()}
    >
      <div className="max-h-52 overflow-y-auto rounded-xl" onWheel={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
        {options.map((opt, i) => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => { onChange(opt.value); setOpen(false) }}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
              ${i === 0 ? '' : 'border-t border-gray-50 dark:border-[#2a2a2a]'}
              ${value === opt.value
                ? 'bg-[#DC143C]/5 dark:bg-[#DC143C]/10 text-[#DC143C] font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]'
              }`}
          >
            {opt.label}
            {value === opt.value && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#DC143C] flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <div ref={ref} className="relative">
      {required && (
        <input tabIndex={-1} required value={value} onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none w-full" />
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className={`h-[44px] w-full rounded-xl border-[1.5px] bg-gray-50 dark:bg-[#1c1c1c] px-4 text-sm outline-none transition-all flex items-center justify-between gap-2
          ${open
            ? 'border-[#DC143C] bg-white dark:bg-[#1c1c1c] shadow-[0_0_0_3px_rgba(220,20,60,0.08)]'
            : 'border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
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
    </div>
  )
}

// ── Shared Cancel Button ───────────────────────────────────
const CancelBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-[#3a3a3a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#333] transition-all"
  >
    Cancel
  </button>
)

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
    <div className={`bg-white dark:bg-[#1c1c1c] rounded-2xl dark:shadow-[0_25px_50px_rgba(0,0,0,0.6)] border border-gray-200 dark:border-[#2a2a2a] w-full mx-4 overflow-clip ${wide ? 'max-w-lg' : 'max-w-md'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#242424]">
        <div className="flex items-center gap-3">
          <span className={iconClass}>{icon}</span>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#333] rounded-lg transition-colors"
        >
          <XIcon />
        </button>
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      {/* Body */}
      <div className="px-5 py-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {children}
      </div>
      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />
      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        {footer}
      </div>
    </div>
  </div>
)

// ── Success Toast ──────────────────────────────────────────
const SuccessToast: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed bottom-6 right-6 z-50 flex items-stretch bg-white dark:bg-[#1c1c1c] rounded-xl shadow-2xl border border-gray-100 dark:border-[#2a2a2a] overflow-hidden min-w-[280px]">
    <div className="w-3 bg-green-500 flex-shrink-0" />
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0 text-green-500">
        <CheckIcon />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800 dark:text-white">Success</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  </div>
)

// ── ActionDropdown ─────────────────────────────────────────
function ActionDropdown({ user, isSelf, onEdit, onToggle, onDelete }: {
  user: User & { is_active: boolean }
  isSelf: boolean
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, dropUp: false })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.closest('[data-dropdown]')?.contains(e.target as Node)) {
        setOpen(false)
      }
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
      const dropUp = window.innerHeight - rect.bottom < 160
      setPos({
        top:  dropUp ? rect.top - 8 : rect.bottom + 4,
        left: rect.right - 176,
        dropUp,
      })
    }
    setOpen(p => !p)
  }

  return (
    <div data-dropdown>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded"
      >
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
          <button
            onClick={() => { setOpen(false); onEdit() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors"
          >
            <EditIcon />
            Edit Account
          </button>

          <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mx-2" />

          <button
            onClick={() => { setOpen(false); onToggle() }}
            disabled={isSelf}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {user.is_active ? <BanIcon /> : <CheckCircleIcon />}
            {user.is_active ? 'Deactivate' : 'Reactivate'}
          </button>

          <div className="h-px bg-gray-100 dark:bg-[#2a2a2a] mx-2" />

          <button
            onClick={() => { setOpen(false); onDelete() }}
            disabled={isSelf}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <TrashIcon />
            Delete Account
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

  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<(User & { is_active: boolean }) | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM)

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = storedUser?.role || 'staff'
  const { branches: BRANCHES } = useBranches()

  useEffect(() => {
    if (userRole !== 'admin') { navigate('/admin/settings/profile'); return }
    loadUsers()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setOpenSortDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    if (modalType === 'create' || modalType === 'edit') {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modalType])

  const loadUsers = async () => {
    try { setUsers(await getAllUsersApi() as any) }
    catch { navigate('/admin/login') }
    finally { setLoading(false) }
  }

  const openModal = (type: ModalType, user?: User & { is_active: boolean }) => {
    setModalType(type); setSelectedUser(user || null)
    setModalError(''); setShowPassword(false)
    if (type === 'edit' && user) {
      setForm({
        agent_code: user.agent_code || '', full_name: user.full_name, email: user.email,
        password: '', branch_name: (user as any).branch_name || '', role: user.role as 'admin' | 'staff',
      })
    } else { setForm(EMPTY_FORM) }
  }
  const closeModal = () => { setModalType(null); setSelectedUser(null) }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setModalLoading(true); setModalError('')
    if (form.agent_code.length !== 8) { setModalError('Agent code must be exactly 8 digits'); setModalLoading(false); return }
    try {
      const created = await createUserApi(form)
      setUsers(prev => [created as any, ...prev])
      closeModal()
      setToast('Account created successfully')
    } catch (err: any) { setModalError(err.response?.data?.error || 'Failed to create account') }
    finally { setModalLoading(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setModalLoading(true); setModalError('')
    if (form.agent_code.length !== 8) { setModalError('Agent code must be exactly 8 digits'); setModalLoading(false); return }
    try {
      const payload: any = { agent_code: form.agent_code, full_name: form.full_name, email: form.email, branch_name: form.branch_name, role: form.role }
      if (form.password.trim()) payload.password = form.password
      const updated = await updateUserApi(selectedUser!.user_id, payload)
      setUsers(prev => prev.map(u => u.user_id === updated.user_id ? { ...u, ...updated } : u))
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

  const inputClass = "h-[44px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] px-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
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

          {/* ── FILTER ROW ── */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3 shadow-sm">
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
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <SearchIcon />
              </div>
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
                <div className="absolute right-0 top-11 z-50 w-44 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-[#2a2a2a]">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sort by</p>
                  </div>
                  {([
                    { key: 'date',       label: 'Date Created' },
                    { key: 'name',       label: 'Name A–Z'     },
                    { key: 'agent_code', label: 'Agent Code'   },
                  ] as const).map(({ key, label }) => (
                    <button key={key}
                      onClick={() => { setSortBy(key); setOpenSortDropdown(false) }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        sortBy === key
                          ? 'text-[#DC143C] bg-red-50 dark:bg-[#DC143C]/10 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]'
                      }`}
                    >
                      {label}
                      {sortBy === key && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-[#DC143C]">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── TABLE ── */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#161616] border-b border-gray-200 dark:border-[#2a2a2a]">
                    {['Agent Code', 'Full Name', 'Branch Name', 'Team', 'Role', 'Date Created', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.9px] text-gray-400 whitespace-nowrap ${i === 0 ? 'pl-7' : ''} ${h === 'Actions' ? 'pr-7 text-center' : 'text-left'}`}>{h}</th>
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
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#333] flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
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
                            <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-default">
                              {formatDate(createdAt)}
                            </span>
                            {createdAt && (
                              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20 pointer-events-none">
                                <div className="bg-gray-900 dark:bg-gray-700 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                                  {formatTime(createdAt)}
                                </div>
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

            {/* ── PAGINATION ── */}
            <div className="flex items-center justify-between px-7 py-3.5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616]">
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
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Create / Edit — wider modal with form */}
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
              <button
                form="account-form"
                type="submit"
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-semibold bg-[#DC143C] hover:bg-[#b01030] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
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
                <label className={labelClass}>Agent Code</label>
                <input
                  className={inputClass}
                  value={form.agent_code}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                    setForm(p => ({ ...p, agent_code: digits }))
                  }}
                  placeholder="8-digit code"
                  maxLength={8}
                  inputMode="numeric"
                  required
                />
                {form.agent_code.length > 0 && form.agent_code.length !== 8 && (
                  <span className="text-[11px] text-red-500">Must be exactly 8 digits</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Role</label>
                <CustomSelect
                  value={form.role}
                  onChange={val => setForm(p => ({ ...p, role: val as 'admin' | 'staff' }))}
                  options={[
                    { value: 'staff', label: 'Staff' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>Branch</label>
                <CustomSelect
                  value={form.branch_name}
                  onChange={val => setForm(p => ({ ...p, branch_name: val }))}
                  options={BRANCHES.map(b => ({ value: b.name, label: b.name }))}
                  placeholder="— Select branch —"
                  centered
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className={labelClass}>
                  {isEdit ? <>New Password <span className="ml-1 normal-case font-normal text-gray-400">(leave blank to keep current)</span></> : 'Password'}
                </label>
                <div className="relative">
                  <input className={`${inputClass} pr-11`} type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(p => ({...p, password: e.target.value}))}
                    placeholder={isEdit ? 'Enter new password to change' : 'Min. 8 characters'} required={!isEdit} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {showPwHints && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                    <span className={`text-[11px] font-medium ${checks.length ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{checks.length ? '✓' : '○'} 8+ characters</span>
                    <span className={`text-[11px] font-medium ${checks.uppercase ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{checks.uppercase ? '✓' : '○'} Uppercase letter</span>
                    <span className={`text-[11px] font-medium ${checks.number ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{checks.number ? '✓' : '○'} Number</span>
                  </div>
                )}
              </div>
            </div>
            {modalError && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {modalError}
              </div>
            )}
          </form>
        </ModalShell>
      )}

      {/* Deactivate / Reactivate */}
      {modalType === 'toggle' && selectedUser && (
        <ModalShell
          onClose={closeModal}
          icon={selectedUser.is_active ? <BanIcon /> : <CheckCircleIcon />}
          iconClass={selectedUser.is_active ? 'text-yellow-500 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}
          title={selectedUser.is_active ? 'Deactivate Account' : 'Reactivate Account'}
          subtitle={selectedUser.full_name}
          footer={
            <>
              <CancelBtn onClick={closeModal} />
              <button
                onClick={handleToggle}
                disabled={modalLoading}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  selectedUser.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {modalLoading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Updating...</>
                  : selectedUser.is_active ? 'Deactivate' : 'Reactivate'
                }
              </button>
            </>
          }
        >
          <p>
            {selectedUser.is_active
              ? <>Are you sure you want to deactivate <span className="font-semibold text-gray-800 dark:text-gray-200">"{selectedUser.full_name}"</span>? They will no longer be able to log in.</>
              : <>Are you sure you want to reactivate <span className="font-semibold text-gray-800 dark:text-gray-200">"{selectedUser.full_name}"</span>? They will be able to log in again.</>
            }
          </p>
          {modalError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {modalError}
            </div>
          )}
        </ModalShell>
      )}

      {/* Delete */}
      {modalType === 'delete' && selectedUser && (
        <ModalShell
          onClose={closeModal}
          icon={<TrashIcon />}
          iconClass="text-red-500 dark:text-red-400"
          title="Delete Account"
          subtitle={selectedUser.full_name}
          footer={
            <>
              <CancelBtn onClick={closeModal} />
              <button
                onClick={handleDelete}
                disabled={modalLoading}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {modalLoading
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Deleting...</>
                  : 'Delete Account'
                }
              </button>
            </>
          }
        >
          <p>
            Delete <span className="font-semibold text-gray-800 dark:text-gray-200">"{selectedUser.full_name}"</span>? This action cannot be undone.
          </p>
          {modalError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {modalError}
            </div>
          )}
        </ModalShell>
      )}

      {/* ── SUCCESS TOAST ── */}
      {toast && <SuccessToast message={toast} />}
    </div>
  )
}