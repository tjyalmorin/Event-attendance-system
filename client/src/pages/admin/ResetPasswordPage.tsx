import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { resetPasswordApi } from '../../api/auth.api'

// ── SVG Icons ──────────────────────────────────────────────
const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ── Component ──────────────────────────────────────────────
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!email) {
    navigate('/admin/forgot-password')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirm) { setError('Passwords do not match.'); return }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    setError('')
    try {
      await resetPasswordApi(email, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/admin/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. Please start the process again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-white dark:bg-[#0f0f0f]">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden md:flex w-1/2 flex-shrink-0 flex-col justify-between overflow-hidden bg-[#DC143C] px-16 py-14">
        <div className="pointer-events-none absolute bottom-[-280px] right-[-200px] h-[700px] w-[700px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-[-120px] left-[-100px] h-[400px] w-[400px] rounded-full bg-black/[0.07]" />
        <div className="pointer-events-none absolute top-[200px] right-[-60px] h-[200px] w-[200px] rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute bottom-[120px] left-10 h-[130px] w-[130px] rounded-full bg-white/[0.03]" />
        <div className="pointer-events-none absolute right-[80px] top-[-40px] bottom-[-40px] w-[2px] rotate-[10deg] bg-white/[0.06]" />
        <div className="pointer-events-none absolute right-[130px] top-[-40px] bottom-[-40px] w-[2px] rotate-[10deg] bg-white/[0.03]" />

        {/* Logo pill */}
        <div className="relative z-10">
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-2.5 pl-3 shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
            <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[10px] border border-gray-200 bg-gray-100 text-gray-400">
              <LayersIcon />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-gray-800">Pru Life UK</div>
              <div className="mt-0.5 text-[11px] font-normal text-gray-500">Event Management</div>
            </div>
          </div>
        </div>

        {/* Center text */}
        <div className="relative z-10 flex flex-col gap-5">
          <div className="text-[64px] font-extrabold leading-[0.92] tracking-[-4px] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.15)]">
            New<br />
            <span className="text-white/50">Password</span>
          </div>
          <div className="max-w-[380px] text-[15px] font-normal leading-relaxed text-white/65">
            <span className="font-semibold text-white/90">Almost there!</span>
            <br />
            Set a strong new password for your admin account.
          </div>
          <div className="mt-2 flex flex-col gap-3">
            {[
              'At least 6 characters long',
              'Mix letters and numbers for strength',
              'Avoid using your name or email',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/75">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.12]">
                  <CheckIcon />
                </div>
                {tip}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-white/35">
          © 2026 PrimeLog · Pru Life UK · All rights reserved
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex w-full md:w-1/2 flex-col items-stretch justify-center bg-white dark:bg-[#0f0f0f] px-8 md:px-16 py-14">
        <div className="flex flex-col gap-8 w-full max-w-[420px] mx-auto">

          {!success && (
            <Link to="/admin/verify-otp"
              className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors w-fit">
              <BackIcon />
              Back to OTP
            </Link>
          )}

          {success ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-center flex flex-col gap-2">
                <h1 className="text-[26px] font-extrabold tracking-[-1px] text-gray-800 dark:text-white">Password Reset!</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your password has been updated successfully.<br />
                  Redirecting you to login in{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">3 seconds</span>...
                </p>
              </div>
              <Link to="/admin/login"
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#DC143C] text-[15px] font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030]">
                Go to Login Now
                <ArrowRightIcon />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[30px] font-extrabold leading-none tracking-[-1.2px] text-gray-800 dark:text-white">
                  Set new password<span className="text-[#DC143C]">.</span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose a strong password for{' '}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="newPassword" className="text-[11px] font-bold uppercase tracking-[1px] text-gray-600 dark:text-gray-400">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <LockIcon />
                    </span>
                    <input type="password" id="newPassword" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" required autoFocus
                      className="h-[50px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] pl-11 pr-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirm" className="text-[11px] font-bold uppercase tracking-[1px] text-gray-600 dark:text-gray-400">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <LockIcon />
                    </span>
                    <input type="password" id="confirm" value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••" required
                      className="h-[50px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] pl-11 pr-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                    />
                  </div>
                  {confirm.length > 0 && (
                    <p className={`text-xs mt-0.5 ${newPassword === confirm ? 'text-green-600' : 'text-red-500'}`}>
                      {newPassword === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button type="submit"
                  disabled={loading || newPassword !== confirm || newPassword.length < 6}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#DC143C] text-[15px] font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030] hover:shadow-[0_6px_24px_rgba(220,20,60,0.28)] disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? (
                    <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Resetting...</>
                  ) : (<>Reset Password<ArrowRightIcon /></>)}
                </button>
              </form>

              <div className="flex flex-col gap-4">
                <div className="h-px w-full bg-gray-100 dark:bg-[#2a2a2a]" />
                <p className="text-center text-xs leading-relaxed text-gray-400 dark:text-gray-600">
                  Remember your password?{' '}
                  <Link to="/admin/login" className="font-semibold text-[#DC143C] hover:underline">
                    Back to login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}