import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { updateProfileApi, changePasswordApi } from '../../api/users.api'
import { getMeApi } from '../../api/auth.api'
import { User } from '../../types'

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

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = storedUser?.role || 'staff'

  useEffect(() => {
    getMeApi().then(u => {
      setUser(u)
      setFullName(u.full_name || '')
      setEmail(u.email || '')
      setBranchName((u as any).branch_name || '')
      setTeamName((u as any).team_name || '')
    }).catch(() => navigate('/admin/login'))
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const updated = await updateProfileApi({ full_name: fullName, email, branch_name: branchName, team_name: teamName })
      setUser(updated)
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updated }))
      setProfileSuccess('Profile updated successfully!')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return }
    if (!/[A-Z]/.test(newPassword)) { setPasswordError('Password must contain at least one uppercase letter'); return }
    if (!/[0-9]/.test(newPassword)) { setPasswordError('Password must contain at least one number'); return }
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await changePasswordApi({ currentPassword, newPassword })
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden">
      <Sidebar userRole={userRole} />
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

          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[#DC143C] flex items-center justify-center text-white text-2xl font-bold">
                  {user?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">{user?.full_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</div>
                  <div className="mt-1">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${userRole === 'admin'
                        ? 'bg-red-50 dark:bg-red-900/20 text-[#DC143C]'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      }`}>
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className={labelClass}>Full Name</label>
                    <input className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" required />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className={labelClass}>Email Address</label>
                    <input className={inputClass} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Branch</label>
                    <input className={inputClass} value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="Branch name" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Team</label>
                    <input className={inputClass} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Team name" />
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
                  {profileLoading ? (
                    <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Saving...</>
                  ) : (
                    <><SaveIcon />Save Changes</>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-white dark:bg-[#1c1c1c] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <LockIcon />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Change Password</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Update your system login password</div>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="flex flex-col gap-5">
                {/* Current Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Current Password</label>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-11`}
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••" required
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>New Password</label>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-11`}
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {showNew ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      <span className={`text-[11px] font-medium ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                        {newPassword.length >= 8 ? '✓' : '○'} 8+ characters
                      </span>
                      <span className={`text-[11px] font-medium ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '○'} Uppercase letter
                      </span>
                      <span className={`text-[11px] font-medium ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                        {/[0-9]/.test(newPassword) ? '✓' : '○'} Number
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      className={`${inputClass} pr-11`}
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className={`text-xs mt-0.5 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
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

                <button type="submit"
                  disabled={passwordLoading || newPassword !== confirmPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)}
                  className="flex h-[46px] w-fit items-center gap-2 px-6 rounded-xl bg-[#DC143C] text-sm font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030] disabled:opacity-60 disabled:cursor-not-allowed">
                  {passwordLoading ? (
                    <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Updating...</>
                  ) : (
                    <><LockIcon />Update Password</>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}