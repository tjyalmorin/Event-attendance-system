import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { lookupParticipantApi, resolveParticipantApi, scanAgentCodeApi, logDenialApi, getSessionsByEventApi } from '../../api/scan.api'
import { Event, ScanResponse } from '../../types'
import Sidebar from '../../components/Sidebar'
import { useDarkMode } from '../../contexts/DarkModeContext'

// ── Types ────────────────────────────────────────────────
type PageState = 'input' | 'pick' | 'verify' | 'result' | 'error'

interface PickItem {
  participant_id: number
  full_name: string
  agent_code: string
  branch_name: string
  team_name: string
  photo_url?: string | null
}

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
      g.gain.setValueAtTime(0.4, ctx.currentTime + start)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur + 0.05)
    })
  } catch (_) {}
}

// ── Icons ────────────────────────────────────────────────
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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

  const [event, setEvent]           = useState<Event | null>(null)
  const [query, setQuery]           = useState('')
  const [pageState, setPageState]   = useState<PageState>('input')
  const [pickList, setPickList]     = useState<PickItem[]>([])
  const [lookup, setLookup]         = useState<LookupResult | null>(null)
  const [result, setResult]         = useState<ScanResponse | null>(null)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [countdown, setCountdown]   = useState(3)
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [flashColor, setFlashColor] = useState<'green' | 'blue' | 'red' | null>(null)

  const inputRef     = useRef<HTMLInputElement>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    if (pageState === 'input') setTimeout(() => inputRef.current?.focus(), 80)
  }, [pageState])

  useEffect(() => {
    if (pageState === 'result' || pageState === 'error') {
      setCountdown(3)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownRef.current!); resetToInput(); return 0 }
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
    setPickList([])
    setLookup(null)
    setResult(null)
    setError('')
    setQuery('')
    setPhotoError(false)
  }

  // ── Step 1: Lookup ─────────────────────────────────────
  const handleLookup = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const data = await lookupParticipantApi({ query: q.trim(), event_id: Number(eventId) })

      // Multiple matches → show pick screen
      if (data.multiple) {
        setPickList(data.participants)
        setPageState('pick')
        setLoading(false)
        return
      }

      if (data.next_action === 'blocked') {
        playTone('denied')
        triggerFlash('red')
        setError('Participant has already completed attendance. No further entries allowed.')
        setPageState('error')
        setQuery('')
        setLoading(false)
        return
      }

      setLookup(data)
      setPhotoError(false)
      setPageState('verify')
    } catch (err: any) {
      playTone('denied')
      triggerFlash('red')
      setError(err.response?.data?.error || 'Lookup failed. Please try again.')
      setQuery('')
      setPageState('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1b: Pick from list ────────────────────────────
  const handlePickParticipant = async (item: PickItem) => {
    setLoading(true)
    try {
      const data = await resolveParticipantApi({ participant_id: item.participant_id, event_id: Number(eventId) })

      if (data.next_action === 'blocked') {
        playTone('denied')
        triggerFlash('red')
        setError('Participant has already completed attendance. No further entries allowed.')
        setPageState('error')
        setLoading(false)
        return
      }

      setLookup(data)
      setPhotoError(false)
      setPageState('verify')
    } catch (err: any) {
      playTone('denied')
      triggerFlash('red')
      setError(err.response?.data?.error || 'Resolve failed. Please try again.')
      setPageState('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2a: Confirm ───────────────────────────────────
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

  // ── Step 2b: Deny ──────────────────────────────────────
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
    if (e.key === 'Enter') handleLookup(query)
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

  const verifyPhotoUrl = getPhotoUrl(lookup?.participant.photo_url)
  const resultPhotoUrl = getPhotoUrl(result?.participant.photo_url)

  // ── Color tokens ───────────────────────────────────────
  const bg            = isDarkMode ? '#0f0f0f' : '#f0f1f3'
  const card          = isDarkMode ? '#1c1c1c' : '#ffffff'
  const border        = isDarkMode ? '#2a2a2a' : '#e5e7eb'
  const textPrimary   = isDarkMode ? '#ffffff' : '#111827'
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280'
  const inputBg       = isDarkMode ? '#141414' : '#f9fafb'
  const subCard       = isDarkMode ? '#141414' : '#f9fafb'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: bg, position: 'relative' }}>
      {/* Flash overlay */}
      {flashColor && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
          background: flashColor === 'green' ? 'rgba(22,163,74,0.15)' : flashColor === 'blue' ? 'rgba(37,99,235,0.15)' : 'rgba(220,20,60,0.18)',
          transition: 'opacity 0.3s'
        }} />
      )}

      <Sidebar userRole={userRole} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── HEADER ──────────────────────────────────── */}
        <header style={{ background: card, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ padding: '0 48px', height: 76, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textSecondary, padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                ← Back
              </button>
              <div style={{ color: textSecondary }}>|</div>
              <div style={{ color: '#DC143C' }}><ScanIcon /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: textPrimary, letterSpacing: '-0.3px' }}>Scanner</div>
                {event && <div style={{ fontSize: 12, color: textSecondary }}>{event.title}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#DC143C' }}>{checkedInCount}</div>
                <div style={{ fontSize: 11, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Inside</div>
              </div>
            </div>
          </div>
        </header>

        {/* Event info bar */}
        {event && (
          <div style={{ background: isDarkMode ? '#161616' : '#fafafa', borderBottom: `1px solid ${border}`, padding: '10px 48px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 13, color: textSecondary }}>{formatDate(event.event_date)}</span>
            <span style={{ color: border }}>·</span>
            <span style={{ fontSize: 13, color: textSecondary }}>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
            {event.venue && <><span style={{ color: border }}>·</span><span style={{ fontSize: 13, color: textSecondary }}>{event.venue}</span></>}
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: event.status === 'open' ? 'rgba(22,163,74,0.12)' : 'rgba(107,114,128,0.12)', color: event.status === 'open' ? '#16a34a' : textSecondary, border: `1px solid ${event.status === 'open' ? 'rgba(22,163,74,0.25)' : border}` }}>
              {event.status}
            </span>
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
                      Scan Agent
                    </h2>
                    <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>
                      Enter agent code (e.g. 10001) or surname (e.g. Santos)
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                      placeholder="Agent code or surname..."
                      style={{ width: '100%', padding: '14px 18px', fontSize: 16, fontWeight: 600, background: inputBg, border: `2px solid ${border}`, borderRadius: 12, color: textPrimary, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.5px' }}
                      autoComplete="off"
                    />
                    <button
                      onClick={() => handleLookup(query)}
                      disabled={loading || !query.trim()}
                      style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading || !query.trim() ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C', color: loading || !query.trim() ? textSecondary : '#fff', fontSize: 14, fontWeight: 700, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {loading ? (
                        <><svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Searching...</>
                      ) : '🔍 Look Up'}
                    </button>
                  </div>

                  <div style={{ marginTop: 20, padding: '14px 16px', background: isDarkMode ? '#0f0f0f' : '#f9fafb', borderRadius: 12, border: `1px solid ${border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>How it works</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { dot: '#DC143C', text: 'Enter agent code or surname, press Enter or click Look Up' },
                        { dot: '#f59e0b', text: 'If multiple matches, pick the correct person from the list' },
                        { dot: '#16a34a', text: 'Verify identity, then Confirm to record check-in or check-out' },
                      ].map(({ dot, text }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes fillBar { from { width: 0% } to { width: 100% } }`}</style>
              </div>
            )}

            {/* ── PICK STATE ──────────────────────────── */}
            {pageState === 'pick' && (
              <div style={{ background: card, border: `2px solid #f59e0b`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(245,158,11,0.15)' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                <div style={{ padding: '28px 32px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: isDarkMode ? '#2a2005' : '#fffbeb', border: `2px solid #f59e0b`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                      <UsersIcon />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: textPrimary }}>Multiple Matches Found</div>
                      <div style={{ fontSize: 13, color: textSecondary }}>{pickList.length} participants matched — select the correct person</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pickList.map(item => {
                      const pUrl = getPhotoUrl(item.photo_url)
                      return (
                        <button
                          key={item.participant_id}
                          onClick={() => handlePickParticipant(item)}
                          disabled={loading}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: isDarkMode ? '#141414' : '#f9fafb', border: `1px solid ${border}`, borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#DC143C'; (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#1a1010' : '#fff5f5' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#141414' : '#f9fafb' }}
                        >
                          <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: `2px solid ${border}`, flexShrink: 0, background: isDarkMode ? '#2a2a2a' : '#e5e7eb' }}>
                            {pUrl ? (
                              <img src={pUrl} alt={item.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #DC143C, #9f0e2a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{item.full_name.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.full_name}</div>
                            <div style={{ fontSize: 12, color: '#DC143C', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', marginTop: 2 }}>{item.agent_code}</div>
                            <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>{item.branch_name} · {item.team_name}</div>
                          </div>
                          <div style={{ color: textSecondary, fontSize: 18 }}>›</div>
                        </button>
                      )
                    })}
                  </div>

                  <button onClick={resetToInput} style={{ width: '100%', marginTop: 16, padding: '12px', background: 'none', border: `1px solid ${border}`, borderRadius: 12, color: textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ← Search Again
                  </button>
                </div>
              </div>
            )}

            {/* ── VERIFY STATE ────────────────────────── */}
            {pageState === 'verify' && lookup && (
              <div style={{ background: card, border: `2px solid #f59e0b`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(245,158,11,0.15)' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
                <div style={{ padding: '28px 32px 32px' }}>

                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: isDarkMode ? '#2a2005' : '#fffbeb', border: '1px solid #f59e0b', borderRadius: 20, padding: '6px 16px', marginBottom: 12 }}>
                      <ShieldIcon />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>Verify Identity</span>
                    </div>
                    <div style={{ fontSize: 14, color: textSecondary }}>
                      Does the photo match the person in front of you?
                    </div>
                  </div>

                  {/* Photo + Info */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24, padding: '16px 20px', background: isDarkMode ? '#141414' : '#f9fafb', borderRadius: 16, border: `1px solid ${border}` }}>
                    <div style={{ width: 88, height: 88, borderRadius: 16, overflow: 'hidden', border: `3px solid #f59e0b`, flexShrink: 0, background: isDarkMode ? '#2a2a2a' : '#f3f4f6' }}>
                      {verifyPhotoUrl && !photoError ? (
                        <img src={verifyPhotoUrl} alt={lookup.participant.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhotoError(true)} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #DC143C, #9f0e2a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{lookup.participant.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: textPrimary, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lookup.participant.full_name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#DC143C', fontWeight: 700, letterSpacing: '2px', marginBottom: 8 }}>{lookup.participant.agent_code}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[lookup.participant.branch_name, lookup.participant.team_name].filter(Boolean).map((tag, i) => (
                          <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, background: isDarkMode ? '#2a2a2a' : '#f3f4f6', color: textSecondary }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: lookup.next_action === 'check_in' ? '#16a34a' : '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        → {lookup.next_action === 'check_in' ? 'Check In' : lookup.next_action === 'check_out' ? 'Check Out' : 'Blocked'}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleDeny} disabled={loading} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `2px solid ${isDarkMode ? '#3a1520' : '#fecdd3'}`, background: isDarkMode ? '#1a0a0e' : '#fff5f5', color: '#DC143C', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <XIcon /> Deny
                    </button>
                    <button onClick={handleConfirm} disabled={loading || lookup.next_action === 'blocked'} style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: loading || lookup.next_action === 'blocked' ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C', color: loading || lookup.next_action === 'blocked' ? textSecondary : '#fff', fontSize: 14, fontWeight: 700, cursor: loading || lookup.next_action === 'blocked' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {loading ? (<><svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</>) : '✓ Confirm & Record'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── RESULT STATE ────────────────────────── */}
            {pageState === 'result' && result && (() => {
              const isIn   = result.action === 'check_in'
              const accent = isIn ? '#16a34a' : '#2563eb'
              const pUrl   = getPhotoUrl(result.participant.photo_url)
              return (
                <div style={{ background: card, border: `2px solid ${accent}`, borderRadius: 20, overflow: 'hidden', boxShadow: `0 4px 32px ${isIn ? 'rgba(22,163,74,0.12)' : 'rgba(37,99,235,0.12)'}` }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${isIn ? '#4ade80' : '#60a5fa'})` }} />
                  <div style={{ padding: '28px 32px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                        {isIn ? <CheckIcon /> : <LogOutIcon />}
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: accent }}>{isIn ? 'Checked In ✓' : 'Checked Out ✓'}</div>
                        <div style={{ fontSize: 13, color: textSecondary }}>{result.message}</div>
                      </div>
                    </div>
                    <div style={{ background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', border: `3px solid ${accent}`, flexShrink: 0, background: isDarkMode ? '#2a2a2a' : '#f3f4f6' }}>
                        {pUrl ? (
                          <img src={pUrl} alt={result.participant.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #DC143C, #9f0e2a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{result.participant.full_name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 17, fontWeight: 800, color: textPrimary, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.participant.full_name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#DC143C', fontWeight: 700, letterSpacing: '2px', marginBottom: 8 }}>{result.participant.agent_code}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[result.participant.branch_name, result.participant.team_name].filter(Boolean).map((tag, i) => (
                            <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, background: isDarkMode ? '#2a2a2a' : '#f3f4f6', color: textSecondary }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 6, background: isDarkMode ? '#2a2a2a' : '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: accent, borderRadius: 3, animation: 'fillBar 3s linear forwards' }} />
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: textSecondary }}>
                      Next scan in {countdown}s
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── ERROR STATE ─────────────────────────── */}
            {pageState === 'error' && (
              <div style={{ background: card, border: `2px solid #DC143C`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(220,20,60,0.12)' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #DC143C, #ff4d6d)' }} />
                <div style={{ padding: '28px 32px 32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DC143C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                      <XIcon />
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#DC143C' }}>Access Denied</div>
                      <div style={{ fontSize: 13, color: textSecondary, marginTop: 4 }}>{error}</div>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: isDarkMode ? '#2a2a2a' : '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#DC143C', borderRadius: 3, animation: 'fillBar 3s linear forwards' }} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: textSecondary }}>
                    Next scan in {countdown}s
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