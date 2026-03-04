import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { getAllUsersApi, createUserApi, deleteUserApi, adminResetPasswordApi } from '../../api/users.api'
import { User } from '../../types'

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
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

type ModalType = 'create' | 'reset' | 'delete' | null

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [modalSuccess, setModalSuccess] = useState('')

  // Create user form
  const [newUser, setNewUser] = useState({
    agent_code: '', full_name: '', email: '', password: '',
    branch_name: '', team_name: '', role: 'staff' as 'admin' | 'staff'
  })

  // Reset password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = storedUser?.role || 'staff'

  // Redirect non-admins
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
    setModalLoading(true)
    setModalError('')
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
    setModalLoading(true)
    setModalError('')
    try {
      await adminResetPasswordApi(selectedUser!.user_id, newPassword)
      setModalSuccess('Password reset successfully!')
      setTimeout(closeModal, 1500)
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to reset password')
    } finally { setModalLoading(false) }
  }

  const handleDeleteUser = async () => {
    setModalLoading(true)
    setModalError('')
    try {
      await deleteUserApi(selectedUser!.user_id)
      setUsers(prev => prev.filter(u => u.user_id !== selectedUser!.user_id))
      setModalSuccess('User deleted successfully!')
      setTimeout(closeModal, 1500)
    } catch (err: any) {
      setModalError(err.response?.data?.error || 'Failed to delete user')
    } finally { setModalLoading(false) }
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.agent_code || '').toLowerCase().includes(search.toLowerCase())
  )

  const inputClass = "h-[44px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] px-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
  const labelClass = "text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-400"

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden">
      <Sidebar userRole={userRole} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Account Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage admin and staff accounts
              </p>
            </div>
            <button onClick={() => openModal('create')}
              className="flex items-center gap-2 h-[42px] px-5 rounded-xl bg-[#DC143C] text-sm font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030]">
              <PlusIcon />
              Add User
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              className={inputClass}
              placeholder="Search by name, email or agent code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-400">No users found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2a2a2a]">
                    <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-[1px] text-gray-400">User</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-[1px] text-gray-400">Branch / Team</th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-[1px] text-gray-400">Role</th>
                    <th className="text-right px-6 py-4 text-[11px] font-bold uppercase tracking-[1px] text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.user_id} className={`${i !== filtered.length - 1 ? 'border-b border-gray-50 dark:border-[#2a2a2a]' : ''} hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#DC143C]/10 dark:bg-[#DC143C]/20 flex items-center justify-center text-[#DC143C] text-sm font-bold flex-shrink-0">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.full_name}</div>
                            <div className="text-xs text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300">{(u as any).branch_name || '—'}</div>
                        <div className="text-xs text-gray-400">{(u as any).team_name || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                          u.role === 'admin'
                            ? 'bg-red-50 dark:bg-red-900/20 text-[#DC143C]'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal('reset', u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333] transition-colors">
                            <KeyIcon />Reset Password
                          </button>
                          <button onClick={() => openModal('delete', u)}
                            disabled={u.user_id === storedUser?.user_id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                            <TrashIcon />Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
                {modalType === 'create' && 'Add New User'}
                {modalType === 'reset' && `Reset Password — ${selectedUser?.full_name}`}
                {modalType === 'delete' && `Delete User`}
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
                          {modalLoading ? 'Creating...' : 'Create User'}
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
                          {modalLoading ? 'Deleting...' : 'Delete User'}
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