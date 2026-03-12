import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { updateProfileApi, changePasswordApi } from '../../api/users.api'
import { getMeApi } from '../../api/auth.api'
import { getAllBranchesApi, BranchItem } from '../../api/branches.api'
import { createAuditLogApi } from '../../api/audit-logs.api'
import { User } from '../../types'

// ── Icons ──────────────────────────────────────────────────
const SaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ── Scrollbar styles (same as AccountManagement) ───────────
const SCROLLBAR_STYLES = `
  [data-select-list]::-webkit-scrollbar { width: 6px; }
  [data-select-list]::-webkit-scrollbar-track { background: transparent; }
  [data-select-list]::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
  [data-select-list]::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  .dark [data-select-list]::-webkit-scrollbar-track { background: #1c1c1c; }
  .dark [data-select-list]::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 999px; }
  .dark [data-select-list]::-webkit-scrollbar-thumb:hover { background: #DC143C; }
`

// ── Custom Select (same design as AccountManagement) ───────
interface SelectOption { label: string; value: string }
interface CustomSelectProps {
  value: string
  onChange: (val: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = 'Select...', disabled = false }) => {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (!btnRef.current?.contains(target) && !dropRef.current?.contains(target)) {
        setOpen(false)
      }
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
    if (disabled) return
    if (btnRef.current) {
      requestAnimationFrame(() => {
        if (!btnRef.current) return
        const rect = btnRef.current.getBoundingClientRect()
        setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
        setOpen(p => !p)
      })
    }
  }

  const dropdown = open ? createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 99999 }}
      className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-2xl"
    >
      <style>{SCROLLBAR_STYLES}</style>
      <div
        data-select-list
        className="max-h-52 overflow-y-auto rounded-xl"
        style={{ scrollbarWidth: 'thin' }}
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
        {options.length === 0 && (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">No options</div>
        )}
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
        disabled={disabled}
        className={`h-[46px] w-full rounded-xl border-[1.5px] bg-gray-50 dark:bg-[#1c1c1c] px-4 text-sm outline-none transition-all flex items-center justify-between
          ${disabled
            ? 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
            : open
              ? 'border-[#DC143C] bg-white dark:bg-[#1c1c1c] shadow-[0_0_0_3px_rgba(220,20,60,0.08)]'
              : 'border-gray-200 dark:border-[#2a2a2a] text-gray-800 dark:text-white hover:border-gray-300 dark:hover:border-[#3a3a3a] cursor-pointer'
          }`}
      >
        <span className={selected ? '' : 'text-gray-400'}>{selected?.label ?? placeholder}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}><ChevronDownIcon /></span>
      </button>
      {dropdown}
    </>
  )
}

// ── Password checks ────────────────────────────────────────
const pwChecks = (pw: string) => ({
  length: pw.length >= 8,
  uppercase: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
})

// ── Main Component ─────────────────────────────────────────
export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')

  // Profile form
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [branchName, setBranchName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  // Branches
  const [branches, setBranches] = useState<BranchItem[]>([])

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole: 'admin' | 'staff' = storedUser?.role || 'staff'
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    getMeApi().then(u => {
      setUser(u)
      setFullName(u.full_name || '')
      setEmail(u.email || '')
      setBranchName((u as any).branch_name || '')
      setTeamName((u as any).team_name || '')
    }).catch(() => navigate('/admin/login'))
  }, [])

  useEffect(() => {
    if (isAdmin) {
      getAllBranchesApi().then(setBranches).catch(() => {})
    }
  }, [isAdmin])

  // Derived: teams for selected branch
  const selectedBranchObj = branches.find(b => b.name === branchName)
  const teamOptions = [
    { value: '', label: 'None' },
    ...(selectedBranchObj?.teams?.map(t => ({ value: t.name, label: t.name })) ?? []),
  ]
  const branchOptions = branches.map(b => ({ value: b.name, label: b.name }))

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const prev = user as any
      await updateProfileApi({ full_name: fullName, email, branch_name: branchName, team_name: teamName })

      // Build change details
      const changes: string[] = []
      if (fullName !== prev?.full_name) changes.push(`Name: "${prev?.full_name || '—'}" → "${fullName}"`)
      if (email !== prev?.email) changes.push('Email changed')
      if (branchName !== (prev?.branch_name || '')) changes.push(`Branch: "${prev?.branch_name || '—'}" → "${branchName || '—'}"`)
      if (teamName !== (prev?.team_name || '')) changes.push(`Team: "${prev?.team_name || '—'}" → "${teamName || '—'}"`)

      // Log to audit trail (best-effort — don't block on failure)
      createAuditLogApi({
        action: 'edited',
        target_id: storedUser.user_id,
        target_name: fullName,
        target_role: userRole,
        details: changes.length > 0 ? changes.join(' · ') : 'Profile updated',
      }).catch(err => console.error('[ProfileSettingsPage] audit log failed:', err))

      // Update localStorage user
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...stored, full_name: fullName, email, branch_name: branchName, team_name: teamName }))
      setUser(prev => prev ? { ...prev, full_name: fullName, email } as any : prev)
      setProfileSuccess('Profile updated successfully!')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      setPasswordLoading(false)
      return
    }
    const checks = pwChecks(newPassword)
    if (!checks.length || !checks.uppercase || !checks.number) {
      setPasswordError('Password does not meet requirements')
      setPasswordLoading(false)
      return
    }
    try {
      await changePasswordApi({ currentPassword, newPassword })

      // Log to audit trail (best-effort)
      createAuditLogApi({
        action: 'password_changed',
        target_id: storedUser.user_id,
        target_name: user?.full_name || storedUser.full_name || 'Unknown',
        target_role: userRole,
        details: 'Changed own password via Profile Settings',
      }).catch(err => console.error('[ProfileSettingsPage] audit log failed:', err))

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(''), 3000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const inputClass = "h-[46px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] px-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
  const labelClass = "text-[11px] font-bold uppercase tracking-[1px] text-gray-500 dark:text-gray-400"

  // Avatar: red for admin, blue for staff
  const avatarBg = isAdmin ? 'bg-[#DC143C]' : 'bg-blue-600'
  const roleLabel = isAdmin ? 'Admin' : 'Staff'
  const roleBadgeClass = isAdmin
    ? 'bg-red-50 dark:bg-red-900/20 text-[#DC143C]'
    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'

  const pwCheck = pwChecks(newPassword)

  return (
    <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your personal information and password
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-[#1c1c1c] p-1 rounded-xl mb-8 w-fit">
            {[
              { key: 'profile', label: 'Profile Info' },
              { key: 'password', label: 'Change Password' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key
                    ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Profile Info Tab ── */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-8">
              {/* Avatar & role badge */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl ${avatarBg} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
                  {user?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{user?.full_name || '—'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${roleBadgeClass}`}>
                      {roleLabel}
                    </span>
                    {(user as any)?.branch_name && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{(user as any).branch_name}{(user as any)?.team_name ? ` · ${(user as any).team_name}` : ''}</span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name — editable for all */}
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className={labelClass}>Full Name</label>
                    <input className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required />
                  </div>

                  {/* Email — editable for all */}
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className={labelClass}>Email Address</label>
                    <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                  </div>

                  {/* Branch */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Branch</label>
                    {isAdmin ? (
                      <CustomSelect
                        value={branchName}
                        onChange={val => { setBranchName(val); setTeamName('') }}
                        options={branchOptions}
                        placeholder="— Select branch —"
                      />
                    ) : (
                      <div className={`${inputClass} flex items-center cursor-not-allowed opacity-60`}>
                        {branchName || <span className="text-gray-400">Not assigned</span>}
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Team</label>
                    {isAdmin ? (
                      <CustomSelect
                        value={teamName}
                        onChange={setTeamName}
                        options={teamOptions}
                        placeholder={branchName ? '— Select team —' : '— Select branch first —'}
                      />
                    ) : (
                      <div className={`${inputClass} flex items-center cursor-not-allowed opacity-60`}>
                        {teamName || <span className="text-gray-400">Not assigned</span>}
                      </div>
                    )}
                  </div>
                </div>

                {profileError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                    ✓ {profileSuccess}
                  </div>
                )}

                <button type="submit" disabled={profileLoading}
                  className="flex h-[46px] w-fit items-center gap-2 px-6 rounded-xl bg-[#DC143C] text-sm font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030] disabled:opacity-60 disabled:cursor-not-allowed">
                  {profileLoading
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</span>
                    : <span className="flex items-center gap-2"><SaveIcon /> Save Changes</span>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ── Change Password Tab ── */}
          {activeTab === 'password' && (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <LockIcon />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Keep your account secure with a strong password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSave} className="flex flex-col gap-5">
                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Current Password</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-11`} type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password" required />
                    <button type="button" onClick={() => setShowCurrentPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {showCurrentPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>New Password</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-11`} type={showNewPw ? 'text' : 'password'}
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number" required />
                    <button type="button" onClick={() => setShowNewPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {showNewPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="flex gap-3 mt-1">
                      {[{ ok: pwCheck.length, label: '8+ chars' }, { ok: pwCheck.uppercase, label: 'Uppercase' }, { ok: pwCheck.number, label: 'Number' }].map(c => (
                        <span key={c.label} className={`text-[11px] font-semibold flex items-center gap-1 ${c.ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                          <span>{c.ok ? '✓' : '○'}</span> {c.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Confirm New Password</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-11`}
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password" required />
                    <button type="button" onClick={() => setShowConfirmPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {showConfirmPw ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-500 font-semibold">Passwords do not match</p>
                  )}
                </div>

                {passwordError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">
                    ✓ {passwordSuccess}
                  </div>
                )}

                <button type="submit" disabled={passwordLoading}
                  className="flex h-[46px] w-fit items-center gap-2 px-6 rounded-xl bg-[#DC143C] text-sm font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030] disabled:opacity-60 disabled:cursor-not-allowed">
                  {passwordLoading
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</span>
                    : <span className="flex items-center gap-2"><LockIcon /> Update Password</span>
                  }
                </button>
              </form>
            </div>
          )}

        </div>
    </div>
  )
}