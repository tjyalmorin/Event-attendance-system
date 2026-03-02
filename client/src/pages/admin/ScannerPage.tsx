import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { lookupParticipantApi, scanAgentCodeApi, logDenialApi, getSessionsByEventApi } from '../../api/scan.api'
import { Event, ScanResponse } from '../../types'
import Sidebar from '../../components/Sidebar'
import { useDarkMode } from '../../contexts/DarkModeContext'

// ── Types ────────────────────────────────────────────────
type PageState = 'input' | 'verify' | 'result' | 'error'

interface LookupResult {
  participant: {
    participant_id: number
    full_name: string
    agent_code: string
    branch_name: string
    team_name: string
    photo_url?: string | null
  }
  next_action: 'check_in' | 'check_out' | 'blocked'
}

// ── Audio Helpers ────────────────────────────────────────
const playTone = (type: 'success' | 'checkout' | 'denied') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const gainNode = ctx.createGain()
    gainNode.connect(ctx.destination)

    const notes: number[][] =
      type === 'success'  ? [[880, 0, 0.12], [1100, 0.13, 0.12], [1320, 0.26, 0.18]] :
      type === 'checkout' ? [[660, 0, 0.12], [880, 0.13, 0.18]] :
                            [[300, 0, 0.10], [220, 0.12, 0.18]]

    notes.forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator()
      const g   = ctx.createGain()
      osc.connect(g)
      g.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = type === 'denied' ? 'sawtooth' : 'sine'
      g.gain.setValueAtTime(0, ctx.currentTime + start)
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.01)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur + 0.05)
    })
  } catch (_) {}
}

// ── Icons ────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

// ── Component ────────────────────────────────────────────
export default function ScannerPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useDarkMode()

  const [event, setEvent]         = useState<Event | null>(null)
  const [agentCode, setAgentCode] = useState('')
  const [pageState, setPageState] = useState<PageState>('input')
  const [lookup, setLookup]       = useState<LookupResult | null>(null)
  const [result, setResult]       = useState<ScanResponse | null>(null)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [flashColor, setFlashColor] = useState<'green' | 'blue' | 'red' | null>(null)

  const inputRef      = useRef<HTMLInputElement>(null)
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashRef      = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole   = storedUser?.role || 'staff'

  // Load event & initial count
  useEffect(() => {
    if (!eventId) return
    getEventByIdApi(Number(eventId)).then(setEvent).catch(console.error)
    refreshCount()
  }, [eventId])

  const refreshCount = useCallback(async () => {
    if (!eventId) return
    try {
      const sessions = await getSessionsByEventApi(Number(eventId))
      const checkedIn = sessions.filter((s: any) => s.check_in_time && !s.check_out_time).length
      setCheckedInCount(checkedIn)
    } catch (_) {}
  }, [eventId])

  // Focus input when on input state
  useEffect(() => {
    if (pageState === 'input') {
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [pageState])

  // Auto-dismiss result/error with countdown
  useEffect(() => {
    if (pageState === 'result' || pageState === 'error') {
      setCountdown(3)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current!)
            resetToInput()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [pageState])

  const triggerFlash = (color: 'green' | 'blue' | 'red') => {
    setFlashColor(color)
    flashRef.current = setTimeout(() => setFlashColor(null), 700)
  }

  const resetToInput = () => {
    setPageState('input')
    setLookup(null)
    setResult(null)
    setError('')
    setAgentCode('')
    setPhotoError(false)
  }

  // ── Step 1: Lookup ────────────────────────────────────
  const handleLookup = async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const data = await lookupParticipantApi({ agent_code: code.trim(), event_id: Number(eventId) })
      if (data.next_action === 'blocked') {
        playTone('denied')
        triggerFlash('red')
        setError('Participant has already completed attendance. No further entries allowed.')
        setPageState('error')
        setAgentCode('')
        return
      }
      setLookup(data)
      setPhotoError(false)
      setPageState('verify')
    } catch (err: any) {
      playTone('denied')
      triggerFlash('red')
      setError(err.response?.data?.error || 'Lookup failed. Please try again.')
      setAgentCode('')
      setPageState('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2a: Confirm ──────────────────────────────────
  const handleConfirm = async () => {
    if (!lookup) return
    setLoading(true)
    try {
      const data = await scanAgentCodeApi({ agent_code: lookup.participant.agent_code, event_id: Number(eventId) })
      setResult(data)
      const isIn = data.action === 'check_in'
      playTone(isIn ? 'success' : 'checkout')
      triggerFlash(isIn ? 'green' : 'blue')
      setPageState('result')
      refreshCount()
    } catch (err: any) {
      playTone('denied')
      triggerFlash('red')
      setError(err.response?.data?.error || 'Scan failed. Please try again.')
      setPageState('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2b: Deny ─────────────────────────────────────
  const handleDeny = async () => {
    if (!lookup) return
    setLoading(true)
    try {
      await logDenialApi({ agent_code: lookup.participant.agent_code, event_id: Number(eventId), reason: 'Staff denied — identity mismatch' })
    } catch (_) {}
    playTone('denied')
    triggerFlash('red')
    setError('Access denied. Identity could not be verified.')
    setPageState('error')
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLookup(agentCode)
  }

  const getPhotoUrl = (photo_url: string | null | undefined): string | null => {
    if (!photo_url) return null
    if (photo_url.startsWith('http')) return photo_url
    return `http://localhost:5000${photo_url}`
  }

  const formatTime = (t: string) => {
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const isCheckIn       = result?.action === 'check_in'
  const verifyPhotoUrl  = getPhotoUrl(lookup?.participant.photo_url)
  const resultPhotoUrl  = getPhotoUrl(result?.participant.photo_url)

  // ── Color tokens tied to dark mode ───────────────────
  const bg      = isDarkMode ? '#0f0f0f' : '#f0f1f3'
  const card    = isDarkMode ? '#1c1c1c' : '#ffffff'
  const border  = isDarkMode ? '#2a2a2a' : '#e5e7eb'
  const textPrimary   = isDarkMode ? '#ffffff' : '#111827'
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280'
  const inputBg = isDarkMode ? '#141414' : '#f9fafb'
  const subCard = isDarkMode ? '#141414' : '#f9fafb'

  // ── Flash overlay colors ──────────────────────────────
  const flashBg =
    flashColor === 'green' ? 'rgba(22,163,74,0.06)' :
    flashColor === 'blue'  ? 'rgba(37,99,235,0.06)' :
    flashColor === 'red'   ? 'rgba(220,20,60,0.06)'  : 'transparent'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, transition: 'background 0.2s' }}>
      <Sidebar userRole={userRole === 'admin' ? 'admin' : 'staff'} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'background 0.2s', background: flashBg }}>

        {/* ── HEADER ──────────────────────────────────── */}
        <header style={{ background: card, borderBottom: `1px solid ${border}`, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ height: 76, paddingLeft: 48, paddingRight: 48, display: 'flex', alignItems: 'center', gap: 16 }}>

            <button
              onClick={() => navigate(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, fontSize: 13, fontWeight: 500, padding: '6px 10px', borderRadius: 8, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = textPrimary)}
              onMouseLeave={e => (e.currentTarget.style.color = textSecondary)}
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>

            <div style={{ width: 1, height: 24, background: border }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DC143C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                <ScanIcon />
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: textPrimary, lineHeight: 1, letterSpacing: '-0.5px' }}>
                  Scanner<span style={{ color: '#DC143C' }}>.</span>
                  {event && <span style={{ fontSize: 20, fontWeight: 600, color: textSecondary, marginLeft: 6 }}>{event.title}</span>}
                </h1>
              </div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Live attendance counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDarkMode ? '#141414' : '#f3f4f6', border: `1px solid ${border}`, borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#DC143C' }}>
                  <UsersIcon />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#DC143C', lineHeight: 1 }}>{checkedInCount}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: textSecondary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Inside</div>
                </div>
              </div>

              {/* Live dot */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDarkMode ? '#141414' : '#f3f4f6', border: `1px solid ${border}`, borderRadius: 10, padding: '8px 14px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)', display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>LIVE</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── EVENT INFO BAR ───────────────────────────── */}
        {event && (
          <div style={{ background: isDarkMode ? '#161616' : '#fff', borderBottom: `1px solid ${border}`, padding: '10px 48px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 12, fontWeight: 500 }}>
              <CalendarIcon />
              <span>{formatDate(event.event_date as unknown as string)}</span>
            </div>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 12, fontWeight: 500 }}>
              <ClockIcon />
              <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
            </div>
            {event.venue && (
              <>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: border }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 12, fontWeight: 500 }}>
                  <LocationIcon />
                  <span>{event.venue}</span>
                </div>
              </>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 20,
                background: event.status === 'open' ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)',
                color: event.status === 'open' ? '#16a34a' : textSecondary,
                border: `1px solid ${event.status === 'open' ? 'rgba(22,163,74,0.25)' : border}`
              }}>
                {event.status}
              </span>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px 60px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── INPUT STATE ─────────────────────────── */}
            {pageState === 'input' && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                {/* Card top accent */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, #DC143C, #ff4d6d)' }} />
                <div style={{ padding: '32px 32px 36px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: isDarkMode ? '#2a1518' : '#fff0f2', border: `2px solid ${isDarkMode ? '#4a1520' : '#fecdd3'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#DC143C' }}>
                      <ScanIcon />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 6, letterSpacing: '-0.3px' }}>
                      Scan Agent Code
                    </h2>
                    <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
                      Type or scan the agent's code to look up their registration
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={agentCode}
                        onChange={e => setAgentCode(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        placeholder="e.g. A1-00001"
                        autoComplete="off"
                        spellCheck={false}
                        style={{
                          width: '100%', background: inputBg,
                          border: `2px solid ${border}`,
                          borderRadius: 12, padding: '15px 16px',
                          fontSize: 20, fontFamily: 'monospace',
                          color: textPrimary, textAlign: 'center',
                          letterSpacing: 4, outline: 'none',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          boxSizing: 'border-box',
                          opacity: loading ? 0.5 : 1
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = '#DC143C'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(220,20,60,0.1)'
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = border
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleLookup(agentCode)}
                      disabled={loading || !agentCode.trim()}
                      style={{
                        width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                        background: loading || !agentCode.trim() ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C',
                        color: loading || !agentCode.trim() ? textSecondary : '#fff',
                        fontSize: 15, fontWeight: 700, cursor: loading || !agentCode.trim() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', letterSpacing: '0.3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {loading ? (
                        <>
                          <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Looking up...
                        </>
                      ) : (
                        <>
                          <ScanIcon />
                          Look Up Participant
                        </>
                      )}
                    </button>
                  </div>

                  {/* Instructions */}
                  <div style={{ marginTop: 24, padding: '16px 20px', background: isDarkMode ? '#0f0f0f' : '#f9fafb', borderRadius: 12, border: `1px solid ${border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>How it works</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { dot: '#DC143C', text: 'Enter agent code and press Enter or click Look Up' },
                        { dot: '#f59e0b', text: 'Verify the participant\'s identity against their photo' },
                        { dot: '#16a34a', text: 'Confirm to record check-in or check-out' },
                      ].map(({ dot, text }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <style>{`
                  @keyframes spin    { to { transform: rotate(360deg) } }
                  @keyframes fillBar { from { width: 0% } to { width: 100% } }
                `}</style>
              </div>
            )}

            {/* ── VERIFY STATE ────────────────────────── */}
            {pageState === 'verify' && lookup && (
              <div style={{ background: card, border: `2px solid #f59e0b`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(245,158,11,0.15)' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                <div style={{ padding: '28px 32px 32px' }}>

                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 10 }}>
                      <ShieldIcon />
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#f59e0b', textTransform: 'uppercase' }}>Identity Verification</span>
                    </div>
                    <p style={{ fontSize: 13, color: textSecondary }}>Confirm the person matches the photo before proceeding</p>
                  </div>

                  {/* Photo — large and prominent */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{
                      width: 160, height: 160, borderRadius: 20, overflow: 'hidden',
                      border: `4px solid rgba(245,158,11,0.4)`,
                      boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                      background: isDarkMode ? '#2a2a2a' : '#f3f4f6',
                      flexShrink: 0
                    }}>
                      {verifyPhotoUrl && !photoError ? (
                        <img
                          src={verifyPhotoUrl}
                          alt={lookup.participant.full_name}
                          onError={() => setPhotoError(true)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #DC143C, #9f0e2a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 52, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
                            {lookup.participant.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action badge under photo */}
                    <div style={{
                      marginTop: 12,
                      padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                      background: lookup.next_action === 'check_in' ? 'rgba(22,163,74,0.1)' : 'rgba(37,99,235,0.1)',
                      color: lookup.next_action === 'check_in' ? '#16a34a' : '#2563eb',
                      border: `1px solid ${lookup.next_action === 'check_in' ? 'rgba(22,163,74,0.25)' : 'rgba(37,99,235,0.25)'}`
                    }}>
                      {lookup.next_action === 'check_in' ? '→ Check In' : '→ Check Out'}
                    </div>
                  </div>

                  {/* Participant info */}
                  <div style={{ background: subCard, border: `1px solid ${border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary, marginBottom: 4, letterSpacing: '-0.2px' }}>{lookup.participant.full_name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#DC143C', fontWeight: 700, letterSpacing: '2px', marginBottom: 10 }}>{lookup.participant.agent_code}</div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[lookup.participant.branch_name, lookup.participant.team_name].filter(Boolean).map((tag, i) => (
                        <span key={i} style={{ background: isDarkMode ? '#2a2a2a' : '#f3f4f6', color: textSecondary, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: `1px solid ${border}` }}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Confirm / Deny */}
                  <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: textPrimary, marginBottom: 14 }}>
                    Does this person match the photo above?
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={handleDeny}
                      disabled={loading}
                      style={{ flex: 1, padding: '14px', borderRadius: 12, border: `2px solid ${isDarkMode ? '#4b1c1c' : '#fecaca'}`, background: isDarkMode ? '#2a1010' : '#fff5f5', color: '#dc2626', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: loading ? 0.5 : 1 }}
                    >
                      ✕ Deny
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: loading ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C', color: loading ? textSecondary : '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.15s', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {loading ? (
                        <>
                          <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Processing...
                        </>
                      ) : '✓ Confirm & Record'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── RESULT STATE ────────────────────────── */}
            {pageState === 'result' && result && (() => {
              const isIn   = result.action === 'check_in'
              const accent = isIn ? '#16a34a' : '#2563eb'
              const softBg = isIn ? (isDarkMode ? 'rgba(22,163,74,0.08)' : 'rgba(22,163,74,0.04)') : (isDarkMode ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)')
              const pUrl   = getPhotoUrl(result.participant.photo_url)

              return (
                <div style={{ background: card, border: `2px solid ${accent}`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 4px 32px ${isIn ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.12)'}` }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${isIn ? '#4ade80' : '#60a5fa'})` }} />
                  <div style={{ padding: '28px 32px 32px' }}>

                    {/* Result header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 4px 16px ${isIn ? 'rgba(22,163,74,0.4)' : 'rgba(37,99,235,0.4)'}` }}>
                        {isIn ? <CheckIcon /> : <LogOutIcon />}
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: '-0.3px' }}>
                          {isIn ? 'Checked In' : 'Checked Out'}
                        </div>
                        <div style={{ fontSize: 12, color: textSecondary, fontFamily: 'monospace', marginTop: 2 }}>
                          {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Countdown bar */}
                    <div style={{ height: 4, background: isDarkMode ? '#2a2a2a' : '#e5e7eb', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: accent, borderRadius: 2, animation: 'fillBar 3s linear forwards' }} />
                    </div>

                    {/* Participant panel */}
                    <div style={{ background: softBg, border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', border: `3px solid ${accent}`, flexShrink: 0, background: isDarkMode ? '#2a2a2a' : '#f3f4f6', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                        {pUrl ? (
                          <img src={pUrl} alt={result.participant.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #DC143C, #9f0e2a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>
                              {result.participant.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.participant.full_name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#DC143C', fontWeight: 700, letterSpacing: '2px', marginBottom: 8 }}>{result.participant.agent_code}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[result.participant.branch_name, result.participant.team_name].filter(Boolean).map((tag, i) => (
                            <span key={i} style={{ background: isDarkMode ? '#2a2a2a' : '#f3f4f6', color: textSecondary, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, border: `1px solid ${border}` }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontSize: 12, color: textSecondary }}>
                      Returning to scanner in <strong style={{ color: textPrimary }}>{countdown}s</strong> ·{' '}
                      <button onClick={resetToInput} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC143C', fontWeight: 600, fontSize: 12 }}>
                        Scan now
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── ERROR STATE ──────────────────────────── */}
            {pageState === 'error' && (
              <div style={{ background: card, border: `2px solid #dc2626`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(220,38,38,0.12)' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
                <div style={{ padding: '28px 32px 32px', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(220,38,38,0.35)' }}>
                    <XIcon />
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>Access Denied</div>
                  <p style={{ fontSize: 14, color: textSecondary, lineHeight: 1.6, marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>{error}</p>

                  {/* Countdown bar */}
                  <div style={{ height: 4, background: isDarkMode ? '#2a2a2a' : '#e5e7eb', borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#dc2626', borderRadius: 2, animation: 'fillBar 3s linear forwards' }} />
                  </div>

                  <div style={{ fontSize: 12, color: textSecondary }}>
                    Returning in <strong style={{ color: textPrimary }}>{countdown}s</strong> ·{' '}
                    <button onClick={resetToInput} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC143C', fontWeight: 600, fontSize: 12 }}>
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}