import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { verifyOtpApi, sendOtpApi } from '../../api/auth.api'

// ── SVG Icons ──────────────────────────────────────────────
const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
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

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

// ── Component ──────────────────────────────────────────────
export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendMsg, setResendMsg] = useState('')

  // Redirect if no email passed
  if (!email) {
    navigate('/admin/forgot-password')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await verifyOtpApi(email, otp)
      navigate('/admin/reset-password', { state: { email } })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    setError('')
    setOtp('')
    try {
      await sendOtpApi(email)
      setResendMsg('A new OTP has been sent to your email.')
    } catch {
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">

      {/* ── LEFT PANEL ── */}
      <div className="relative hidden md:flex w-1/2 flex-shrink-0 flex-col justify-between overflow-hidden bg-[#DC143C] px-16 py-14">

        {/* Decorative circles */}
        <div className="pointer-events-none absolute bottom-[-280px] right-[-200px] h-[700px] w-[700px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute top-[-120px] left-[-100px] h-[400px] w-[400px] rounded-full bg-black/[0.07]" />
        <div className="pointer-events-none absolute top-[200px] right-[-60px] h-[200px] w-[200px] rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute bottom-[120px] left-10 h-[130px] w-[130px] rounded-full bg-white/[0.03]" />

        {/* Slash accents */}
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
            Check<br />
            <span className="text-white/50">Your Email</span>
          </div>
          <div className="max-w-[380px] text-[15px] font-normal leading-relaxed text-white/65">
            <span className="font-semibold text-white/90">A 6-digit OTP was sent to:</span>
            <br />
            <span className="text-white font-medium break-all">{email}</span>
          </div>

          {/* Info bullets */}
          <div className="mt-2 flex flex-col gap-3">
            {[
              { icon: <ShieldIcon />, label: 'OTP is valid for 10 minutes only' },
              { icon: <ShieldIcon />, label: 'Check your spam folder if not in inbox' },
              { icon: <ShieldIcon />, label: 'Do not share your OTP with anyone' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/75">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.12]">
                  {item.icon}
                </div>
                {item.label}
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
      <div className="flex w-full md:w-1/2 flex-col items-stretch justify-center bg-white px-8 md:px-16 py-14">
        <div className="flex flex-col gap-8 w-full max-w-[420px] mx-auto">

          {/* Back link */}
          <Link
            to="/admin/forgot-password"
            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 transition-colors w-fit"
          >
            <BackIcon />
            Use a different email
          </Link>

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[30px] font-extrabold leading-none tracking-[-1.2px] text-gray-800">
              Enter OTP<span className="text-[#DC143C]">.</span>
            </h1>
            <p className="text-sm text-gray-500">
              Enter the 6-digit code we sent to{' '}
              <span className="font-semibold text-gray-700">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="otp" className="text-[11px] font-bold uppercase tracking-[1px] text-gray-600">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="• • • • • •"
                autoFocus
                className="h-[64px] w-full rounded-xl border-[1.5px] border-gray-200 bg-gray-50 px-4 text-center text-[28px] font-bold tracking-[16px] text-gray-800 outline-none placeholder:text-gray-300 placeholder:tracking-[12px] placeholder:text-[20px] transition-all focus:border-[#DC143C] focus:bg-white focus:shadow-[0_0_0_3px_rgba(220,20,60,0.08)]"
              />
              <p className="text-xs text-gray-400 text-center">
                OTP expires in <span className="font-semibold text-gray-500">10 minutes</span>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Resend success */}
            {resendMsg && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                {resendMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#DC143C] text-[15px] font-bold text-white shadow-[0_4px_18px_rgba(220,20,60,0.22)] transition-all hover:-translate-y-px hover:bg-[#b01030] hover:shadow-[0_6px_24px_rgba(220,20,60,0.28)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          {/* Divider + resend */}
          <div className="flex flex-col gap-4">
            <div className="h-px w-full bg-gray-100" />
            <p className="text-center text-xs leading-relaxed text-gray-400">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-[#DC143C] hover:underline disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}