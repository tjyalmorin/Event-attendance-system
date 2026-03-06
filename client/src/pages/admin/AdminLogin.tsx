import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginApi } from '../../api/auth.api'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { useStaffProtection } from '../../hooks/useStaffProtection'
import pruLogo from '../../assets/pru.webp'

// ── SVG Icons ──────────────────────────────────────────────────────────────
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const HashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
)

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const SignInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

// ── Component ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  useStaffProtection()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await loginApi({ email, password })
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (data.user.role === 'admin') {
        navigate('/admin/events')
      } else {
        navigate('/staff/events')
      }
    } catch (err: any) {
      // Always show a generic message — never reveal whether email or password was wrong
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: <HashIcon />, label: 'Agent code entry for fast check-in & checkout' },
    { icon: <UsersIcon />, label: 'Real-time agent attendance tracking' },
    { icon: <CalendarIcon />, label: 'Multi-event management dashboard' },
  ]

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-white dark:bg-[#0f0f0f]">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden md:flex w-1/2 flex-shrink-0 flex-col justify-between overflow-hidden bg-[#DC143C] px-16 py-14">

        {/* Decorative circles */}
        <div className="pointer-events-none absolute bottom-[-280px] right-[-200px] h-[700px] w-[700px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-[-120px] left-[-100px] h-[400px] w-[400px] rounded-full bg-black/[0.07]" />
        <div className="pointer-events-none absolute top-[200px] right-[-60px] h-[200px] w-[200px] rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute bottom-[120px] left-10 h-[130px] w-[130px] rounded-full bg-white/[0.03]" />
        <div className="pointer-events-none absolute right-[80px] top-[-40px] bottom-[-40px] w-[2px] rotate-[10deg] bg-white/[0.06]" />
        <div className="pointer-events-none absolute right-[130px] top-[-40px] bottom-[-40px] w-[2px] rotate-[10deg] bg-white/[0.03]" />

        {/* ── PRU LIFE UK LOGO PILL ── */}
        <div className="relative z-10">
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl bg-white px-5 py-2.5 pl-3 shadow-[0_4px_24px_rgba(0,0,0,0.18)]">
            <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[10px] overflow-hidden bg-white border border-gray-100">
              <img
                src={pruLogo}
                alt="Pru Life UK"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-gray-800">Pru Life UK</div>
              <div className="mt-0.5 text-[11px] font-normal text-gray-500">Event Management</div>
            </div>
          </div>
        </div>

        {/* Tagline + features */}
        <div className="relative z-10 flex flex-col gap-5">
          <div className="text-[64px] font-extrabold leading-[0.92] tracking-[-4px] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.15)]">
            Prime<span className="text-white/50">.</span>Log
          </div>
          <div className="max-w-[420px] text-[15px] font-normal leading-relaxed text-white/65">
            <span className="font-semibold text-white/90">An Event Attendance Management System</span>
            <br />
            Track, manage, and monitor agent attendance across all your events — in real time.
          </div>
          <div className="mt-2 flex flex-col gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/75">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.12]">
                  {f.icon}
                </div>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[11px] text-white/35">
          © 2026 PrimeLog · Pru Life UK · All rights reserved
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="relative flex w-full md:w-1/2 flex-col items-stretch justify-center bg-white dark:bg-[#0f0f0f] px-8 md:px-16 py-14">
        <div className="flex flex-col gap-8 w-full max-w-[420px] mx-auto">

          {/* Mobile logo (shown only on small screens) */}
          <div className="flex md:hidden items-center gap-3 mb-2">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] overflow-hidden border border-gray-200 bg-white shadow-sm">
              <img src={pruLogo} alt="Pru Life UK" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-gray-800 dark:text-white">Pru Life UK</div>
              <div className="text-[11px] text-gray-500">Event Management</div>
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[30px] font-extrabold leading-none tracking-[-1.2px] text-gray-800 dark:text-white">
              Welcome back<span className="text-[#DC143C]">.</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to your PrimeLog account to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-[1px] text-gray-600 dark:text-gray-400">
                Email Address
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@pluk.com"
                  required
                  autoFocus
                  className="h-[50px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] pl-11 pr-4 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-[1px] text-gray-600 dark:text-gray-400">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  required
                  className="h-[50px] w-full rounded-xl border-[1.5px] border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1c1c1c] pl-11 pr-11 text-sm text-gray-800 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all focus:border-[#DC143C] focus:bg-white dark:focus:bg-[#1c1c1c] focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="flex justify-end mt-0.5">
                <Link
                  to="/admin/forgot-password"
                  className="text-[12px] font-semibold text-[#DC143C] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#DC143C] text-[15px] font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030] hover:shadow-[0_6px_24px_rgba(220,20,60,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <SignInIcon />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider + note */}
          <div className="flex flex-col gap-4">
            <div className="h-px w-full bg-gray-100 dark:bg-[#2a2a2a]" />
            <p className="text-center text-xs leading-relaxed text-gray-400 dark:text-gray-600">
              Access is restricted to{' '}
              <span className="font-semibold text-gray-600 dark:text-gray-400">authorized personnel only</span>.<br />
              Contact your system administrator if you need access.
            </p>
          </div>

        </div>

        {/* ── Dark Mode Toggle ── */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="absolute bottom-6 right-6 flex items-center justify-center w-[52px] h-[52px] rounded-xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1c1c1c] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333333] hover:text-gray-700 dark:hover:text-gray-200 transition-all shadow-sm"
        >
          {isDarkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </div>
  )
}