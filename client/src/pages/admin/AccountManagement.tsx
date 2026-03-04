import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { getAllUsersApi, createUserApi, deleteUserApi, adminResetPasswordApi } from '../../api/users.api'
import { User } from '../../types'

// ── Icons ──────────────────────────────────────────────────────────────────
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
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
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
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
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

// ── Types ──────────────────────────────────────────────────────────────────
type ModalType = 'create' | 'reset' | 'delete' | null

const ITEMS_PER_PAGE = 10

// ── Component ──────────────────────────────────────────────────────────────
export default function AccountManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'agent_code'>('date')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  const [newUser, setNewUser] = useState({
    agent_code: '', full_name: '', email: '', password: '',
    branch_name: '', team_name: '', role: 'staff' as 'admin' | 'staff'
  })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = storedUser?.role || 'staff'

  useEffect(() => {
    if (userRole !== 'admin') { navigate('/admin/settings/profile'); return }
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getAllUsersApi()
      setUsers(data)
    } catch { navigate('/admin/login') }
    finally { setLoading(false) }
  }

  const openModal = (type: ModalType, user?: User) => {
    setModalType(type)
    setSelectedUser(user || null)
    setModalError('')
    setModalSuccess('')
    setNewPassword('')
    setConfirmPassword('')
    setNewUser({ agent_code: '', full_name: '', email: '', password: '', branch_name: '', team_name: '', role: 'staff' })
  }
  const closeModal = () => { setModalType(null); setSelectedUser(null) }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true); setModalError('')
    try {
      const created = await createUserApi(newUser)
      setUsers(prev => [created, ...prev])
      setModalSuccess('User created successfully!')
      setTimeout(closeModal, 1500)
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to create user')
    } finally { setModalLoading(false) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setModalError('Passwords do not match'); return }
    if (newPassword.length < 6) { setModalError('Password must be at least 6 characters'); return }
    setModalLoading(true); setModalError('')
    try {
      await adminResetPasswordApi(selectedUser!.user_id, newPassword)
      setModalSuccess('Password reset successfully!')
      setTimeout(closeModal, 1500)
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to reset password')
    } finally { setModalLoading(false) }
  }

  const handleDeleteUser = async () => {
    setModalLoading(true); setModalError('')
    try {
      await deleteUserApi(selectedUser!.user_id)
      setUsers(prev => prev.filter(u => u.user_id !== selectedUser!.user_id))
      setModalSuccess('User deleted successfully!')
      setTimeout(closeModal, 1500)
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to delete user')
    } finally { setModalLoading(false) }
  }

  // ── Derived stats ──
  const totalUsers  = users.length
  const adminCount  = users.filter(u => u.role === 'admin').length
  const staffCount  = users.filter(u => u.role === 'staff').length
  const thisMonth   = users.filter(u => {
    const d = new Date((u as any).created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // ── Filter + Sort + Paginate ──
  const filtered = users
    .filter(u => roleFilter === 'all' ? true : u.role === roleFilter)
    .filter(u =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.agent_code || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.full_name.localeCompare(b.full_name)
      if (sortBy === 'agent_code') return (a.agent_code || '').localeCompare(b.agent_code || '')
      return new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleFilterChange = (f: 'all' | 'admin' | 'staff') => { setRoleFilter(f); setCurrentPage(1) }
  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1) }

  // ── Pagination page numbers ──
  const getPageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 3) return [1, 2, 3, '...', totalPages]
    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage, '...', totalPages]
  }

  // ── Shared styles ──
  const inputClass = "h-[44px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] px-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
  const labelClass = "text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-400"

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
                <ShieldIcon />
                Admin Only
              </div>
              <button
                onClick={() => openModal('create')}
                className="flex items-center gap-2 bg-[#DC143C] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#b01030] transition-all hover:shadow-lg hover:-translate-y-px shadow-[0_4px_16px_rgba(220,20,60,0.22)]"
              >
                <PlusIcon />
                Create Account
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 py-6 space-y-5">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                num: totalUsers, label: 'Total Accounts', accent: true,
                fill: 100,
                icon: <UsersIcon />, iconRed: true,
              },
              {
                num: adminCount, label: 'Admins', accent: false,
                fill: totalUsers ? Math.round((adminCount / totalUsers) * 100) : 0,
                icon: <ShieldIcon />, iconRed: false,
              },
              {
                num: staffCount, label: 'Staff Accounts', accent: false,
                fill: totalUsers ? Math.round((staffCount / totalUsers) * 100) : 0,
                icon: <UserIcon />, iconRed: false,
              },
              {
                num: thisMonth, label: 'Added This Month', accent: false,
                fill: totalUsers ? Math.round((thisMonth / totalUsers) * 100) : 0,
                icon: <ClockIcon />, iconRed: false,
              },
            ].map((s, i) => (
              <div key={i} className="relative bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm p-5 pb-6 overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center ${s.iconRed ? 'bg-[#DC143C]/10 text-[#DC143C]' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400'}`}>
                  {s.icon}
                </div>
                <div className={`text-4xl font-extrabold tracking-tight leading-none mb-1 ${s.accent ? 'text-[#DC143C]' : 'text-gray-900 dark:text-white'}`}>
                  {loading ? '—' : s.num}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
                {/* bottom bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-[#2a2a2a]">
                  <div className="h-full bg-[#DC143C] rounded-r-full transition-all duration-700" style={{ width: `${s.fill}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTER + SEARCH ROW ── */}
          <div className="flex items-center gap-3 bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-4 py-3 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-[1px] text-gray-400 whitespace-nowrap">Role</span>
            {(['all', 'admin', 'staff'] as const).map(r => (
              <button key={r} onClick={() => handleFilterChange(r)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  roleFilter === r
                    ? 'bg-[#DC143C] border-[#DC143C] text-white'
                    : 'border-gray-200 dark:border-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                }`}>
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}

            <div className="w-px h-5 bg-gray-200 dark:bg-[#2a2a2a] mx-1" />

            <div className="flex-1" />

            {/* Search */}
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <SearchIcon />
              </div>
              <input
                className="w-full h-9 pl-9 pr-3 rounded-lg border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#0f0f0f] text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 focus:border-[#DC143C] transition-all"
                placeholder="Search name or agent code…"
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>

            {/* Sort */}
            <span className="text-[11px] font-bold uppercase tracking-[1px] text-gray-400 whitespace-nowrap">Sort by</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="h-9 px-3 pr-7 rounded-lg border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-sm text-gray-600 dark:text-gray-300 outline-none cursor-pointer appearance-none focus:border-[#DC143C] transition-all"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23aaa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              <option value="date">Date Created</option>
              <option value="name">Name A–Z</option>
              <option value="agent_code">Agent Code</option>
            </select>
          </div>

          {/* ── TABLE ── */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#161616] border-b border-gray-200 dark:border-[#2a2a2a]">
                    {['Agent Code', 'Full Name', 'Branch Name', 'Team', 'Role', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.9px] text-gray-400 whitespace-nowrap ${i === 0 ? 'pl-7' : ''} ${h === 'Actions' ? 'pr-7 text-center' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 text-sm">Loading...</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 text-sm">No accounts found</td>
                    </tr>
                  ) : (
                    paginated.map((u, i) => (
                      <tr key={u.user_id}
                        className={`border-b border-gray-50 dark:border-[#2a2a2a] last:border-b-0 hover:bg-[#fdf5f7] dark:hover:bg-[#1f1416] transition-colors ${i % 2 === 0 ? '' : ''}`}>
                        {/* Agent Code */}
                        <td className="pl-7 pr-5 py-3.5">
                          <span className="text-[#DC143C] font-bold text-xs tracking-wide">{u.agent_code || '—'}</span>
                        </td>
                        {/* Full Name */}
                        <td className="px-5 py-3.5">
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
                        {/* Branch */}
                        <td className="px-5 py-3.5">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 text-xs font-medium">
                            {(u as any).branch_name || '—'}
                          </span>
                        </td>
                        {/* Team */}
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-sm">
                          {(u as any).team_name || '—'}
                        </td>
                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                            u.role === 'admin'
                              ? 'bg-[#DC143C]/10 text-[#DC143C] dark:bg-[#DC143C]/20'
                              : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="pr-7 px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openModal('reset', u)}
                              title="Reset Password"
                              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            >
                              <KeyIcon />
                            </button>
                            <button
                              onClick={() => openModal('delete', u)}
                              disabled={u.user_id === storedUser?.user_id}
                              title="Delete User"
                              className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] hover:bg-[#DC143C]/5 dark:hover:bg-[#DC143C]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── TABLE FOOTER / PAGINATION ── */}
            <div className="flex items-center justify-between px-7 py-3.5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#161616]">
              <span className="text-xs text-gray-400">
                {filtered.length === 0
                  ? 'No accounts'
                  : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} account${filtered.length !== 1 ? 's' : ''}`
                }
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon />
                  </button>
                  {getPageNums().map((p, i) =>
                    p === '...' ? (
                      <span key={`dot-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-gray-400">…</span>
                    ) : (
                      <button key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-7 h-7 rounded-lg border text-xs font-semibold transition-all ${
                          currentPage === p
                            ? 'bg-[#DC143C] border-[#DC143C] text-white'
                            : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C]'
                        }`}>
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-[#DC143C] hover:text-[#DC143C] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── MODAL OVERLAY ── */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] w-full max-w-md shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2a2a2a]">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalType === 'create' && 'Create Account'}
                {modalType === 'reset'  && `Reset Password — ${selectedUser?.full_name}`}
                {modalType === 'delete' && 'Delete Account'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <XIcon />
              </button>
            </div>

            <div className="p-6">
              {modalSuccess ? (
                <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400 text-center">
                  ✓ {modalSuccess}
                </div>
              ) : (
                <>
                  {/* Create User Form */}
                  {modalType === 'create' && (
                    <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className={labelClass}>Full Name</label>
                          <input className={inputClass} value={newUser.full_name} onChange={e => setNewUser(p => ({...p, full_name: e.target.value}))} placeholder="Full name" required />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className={labelClass}>Email</label>
                          <input className={inputClass} type="email" value={newUser.email} onChange={e => setNewUser(p => ({...p, email: e.target.value}))} placeholder="email@example.com" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>Agent Code</label>
                          <input className={inputClass} value={newUser.agent_code} onChange={e => setNewUser(p => ({...p, agent_code: e.target.value}))} placeholder="AGT-001" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>Role</label>
                          <select className={inputClass} value={newUser.role} onChange={e => setNewUser(p => ({...p, role: e.target.value as any}))}>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>Branch</label>
                          <input className={inputClass} value={newUser.branch_name} onChange={e => setNewUser(p => ({...p, branch_name: e.target.value}))} placeholder="Branch name" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>Team</label>
                          <input className={inputClass} value={newUser.team_name} onChange={e => setNewUser(p => ({...p, team_name: e.target.value}))} placeholder="Team name" required />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className={labelClass}>Password</label>
                          <input className={inputClass} type="password" value={newUser.password} onChange={e => setNewUser(p => ({...p, password: e.target.value}))} placeholder="Min. 6 characters" required />
                        </div>
                      </div>
                      {modalError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{modalError}</div>}
                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={closeModal} className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">Cancel</button>
                        <button type="submit" disabled={modalLoading} className="flex-1 h-[44px] rounded-xl bg-[#DC143C] text-sm font-bold text-white hover:bg-[#b01030] transition-colors disabled:opacity-60">
                          {modalLoading ? 'Creating...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Reset Password Form */}
                  {modalType === 'reset' && (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Set a new password for <strong className="text-gray-700 dark:text-gray-200">{selectedUser?.full_name}</strong></p>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>New Password</label>
                        <input className={inputClass} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" required />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Confirm Password</label>
                        <input className={inputClass} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
                        {confirmPassword.length > 0 && (
                          <p className={`text-xs mt-0.5 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                            {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                          </p>
                        )}
                      </div>
                      {modalError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{modalError}</div>}
                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={closeModal} className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">Cancel</button>
                        <button type="submit" disabled={modalLoading || newPassword !== confirmPassword} className="flex-1 h-[44px] rounded-xl bg-[#DC143C] text-sm font-bold text-white hover:bg-[#b01030] transition-colors disabled:opacity-60">
                          {modalLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Delete Confirm */}
                  {modalType === 'delete' && (
                    <div className="flex flex-col gap-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete <strong className="text-gray-700 dark:text-gray-200">{selectedUser?.full_name}</strong>? This action cannot be undone.
                      </p>
                      {modalError && <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">{modalError}</div>}
                      <div className="flex gap-3">
                        <button onClick={closeModal} className="flex-1 h-[44px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">Cancel</button>
                        <button onClick={handleDeleteUser} disabled={modalLoading} className="flex-1 h-[44px] rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
                          {modalLoading ? 'Deleting...' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}