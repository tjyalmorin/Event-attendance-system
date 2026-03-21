import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { lookupParticipantApi, resolveParticipantApi, scanAgentCodeApi, logDenialApi, getSessionsByEventApi } from '../../api/scan.api'
import { Event, ScanResponse } from '../../types'
import { useDarkMode } from '../../contexts/DarkModeContext'
import { useStaffProtection } from '../../hooks/useStaffProtection'

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
    label?: string | null
    label_description?: string | null
    agent_type?: string | null
  }
  next_action: 'check_in' | 'check_out' | 'blocked'
}

// ── Label Colors (mirrors EventDetail) ───────────────────
const LABEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Awardee': { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  'VIP':     { bg: '#f3e8ff', text: '#7c3aed', border: '#d8b4fe' },
  'Sponsor': { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'Speaker': { bg: '#ccfbf1', text: '#0f766e', border: '#5eead4' },
  'Staff':   { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },
}
const getLabelStyle = (label: string, isDarkMode: boolean) => {
  const c = LABEL_COLORS[label] ?? { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
  if (isDarkMode) {
    // darken for dark mode
    const darkMap: Record<string, { bg: string; text: string; border: string }> = {
      'Awardee': { bg: 'rgba(180,83,9,0.2)',   text: '#fcd34d', border: 'rgba(252,211,77,0.35)' },
      'VIP':     { bg: 'rgba(124,58,237,0.2)',  text: '#c4b5fd', border: 'rgba(196,181,253,0.35)' },
      'Sponsor': { bg: 'rgba(29,78,216,0.2)',   text: '#93c5fd', border: 'rgba(147,197,253,0.35)' },
      'Speaker': { bg: 'rgba(15,118,110,0.2)',  text: '#5eead4', border: 'rgba(94,234,212,0.35)' },
      'Staff':   { bg: 'rgba(75,85,99,0.25)',   text: '#d1d5db', border: 'rgba(209,213,219,0.3)' },
    }
    return darkMap[label] ?? { bg: 'rgba(185,28,28,0.2)', text: '#fca5a5', border: 'rgba(252,165,165,0.35)' }
  }
  return c
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
      osc.connect(g); g.connect(ctx.destination)
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
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

// ── Component ────────────────────────────────────────────
export default function ScannerPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useDarkMode()
  useStaffProtection()

  const [event, setEvent]           = useState<Event | null>(null)
  const [query, setQuery]           = useState('')
  const [pageState, setPageState]   = useState<PageState>('input')
  const [pickList, setPickList]     = useState<PickItem[]>([])
  const [lookup, setLookup]         = useState<LookupResult | null>(null)
  const [result, setResult]         = useState<ScanResponse | null>(null)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [countdown, setCountdown]   = useState(1)
  const [checkedInCount, setCheckedInCount] = useState(0)
  const [flashColor, setFlashColor] = useState<'green' | 'blue' | 'red' | null>(null)
  const [isEarlyOut, setIsEarlyOut] = useState(false)
  const [earlyOutReason, setEarlyOutReason] = useState('')
  const [resultTime, setResultTime] = useState('')
  const [labelModalOpen, setLabelModalOpen] = useState(false)

  // ── Suggestions state ──
  const [suggestions, setSuggestions]         = useState<PickItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sugLoading, setSugLoading]           = useState(false)
  const [activeSugIdx, setActiveSugIdx]       = useState(-1)
  const [inputFocused, setInputFocused]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sugBoxRef   = useRef<HTMLDivElement>(null)

  const inputRef     = useRef<HTMLInputElement>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storedUser  = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole    = storedUser?.role || 'staff'
  const userBranch  = storedUser?.branch_name || undefined

  // Countdown duration in seconds
  const COUNTDOWN_SECS = 1

  useEffect(() => {
    if (!eventId) return
    getEventByIdApi(Number(eventId)).then(setEvent).catch(console.error)
    refreshCount()
  }, [eventId])

  const refreshCount = useCallback(async () => {
    if (!eventId) return
    try {
      const sessions = await getSessionsByEventApi(Number(eventId))
      setCheckedInCount(sessions.filter((s: any) => s.check_in_time && !s.check_out_time).length)
    } catch (_) {}
  }, [eventId])

  useEffect(() => {
    if (pageState === 'input') setTimeout(() => inputRef.current?.focus(), 80)
  }, [pageState])

  useEffect(() => {
    if (pageState === 'result' || pageState === 'error') {
      setCountdown(COUNTDOWN_SECS)
      // Tick immediately after a short delay so bar starts draining right away
      const firstTick = setTimeout(() => {
        setCountdown(COUNTDOWN_SECS - 1)
        countdownRef.current = setInterval(() => {
          setCountdown(prev => {
            const next = prev - 1
            if (next <= 0) {
              clearInterval(countdownRef.current!)
              setTimeout(() => resetToInput(), 0)
              return 0
            }
            return next
          })
        }, 1000)
      }, 50)
      return () => {
        clearTimeout(firstTick)
        if (countdownRef.current) clearInterval(countdownRef.current)
      }
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [pageState])

  // ── Debounced suggestions ──
  useEffect(() => {
    if (pageState !== 'input') return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      setSugLoading(false)
      return
    }

    if (skipNextDebounce.current) {
      skipNextDebounce.current = false
      return
    }

    setSugLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await lookupParticipantApi({ query: query.trim(), event_id: Number(eventId), ...(userRole === 'staff' && userBranch ? { branch_name: userBranch } : {}) })
        if (data.multiple) {
          setSuggestions((data.participants || []).slice(0, 5))
        } else if (data.participant) {
          setSuggestions([data.participant])
        } else {
          setSuggestions([])
        }
        setShowSuggestions(true)
        setActiveSugIdx(-1)
      } catch (err: any) {
        const participants = err?.response?.data?.participants
        if (participants?.length) {
          setSuggestions(participants.slice(0, 5))
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } finally {
        setSugLoading(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, pageState, eventId, userRole, userBranch])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sugBoxRef.current && !sugBoxRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const triggerFlash = (color: 'green' | 'blue' | 'red') => {
    setFlashColor(color)
    if (flashRef.current) clearTimeout(flashRef.current)
    flashRef.current = setTimeout(() => setFlashColor(null), 700)
  }

  const resetToInput = () => {
    setPageState('input')
    setPickList([]); setLookup(null); setResult(null)
    setError(''); setQuery(''); setPhotoError(false)
    setIsEarlyOut(false); setEarlyOutReason('')
    setSuggestions([]); setShowSuggestions(false)
  }

  const handleLookup = async (q: string) => {
    if (!q.trim()) return
    setShowSuggestions(false)
    setLoading(true)
    try {
      const data = await lookupParticipantApi({ query: q.trim(), event_id: Number(eventId), ...(userRole === 'staff' && userBranch ? { branch_name: userBranch } : {}) })
      if (data.multiple) { setPickList(data.participants); setPageState('pick'); setLoading(false); return }
      if (data.next_action === 'blocked') {
        playTone('denied'); triggerFlash('red')
        setError('Participant has already completed attendance. No further entries allowed.')
        setPageState('error'); setQuery(''); setLoading(false); return
      }
      setLookup(data); setPhotoError(false); setPageState('verify')
    } catch (err: any) {
      playTone('denied'); triggerFlash('red')
      setError(err.response?.data?.error || 'Lookup failed. Please try again.')
      setQuery(''); setPageState('error')
    } finally { setLoading(false) }
  }

  const skipNextDebounce = useRef(false)

  const handlePickSuggestion = (item: PickItem) => {
    skipNextDebounce.current = true
    setQuery(item.full_name)
    setShowSuggestions(false)
    setSuggestions([])
    setActiveSugIdx(-1)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handlePickParticipant = async (item: PickItem) => {
    setLoading(true)
    try {
      const data = await resolveParticipantApi({ participant_id: item.participant_id, event_id: Number(eventId) })
      if (data.next_action === 'blocked') {
        playTone('denied'); triggerFlash('red')
        setError('Participant has already completed attendance. No further entries allowed.')
        setPageState('error'); setLoading(false); return
      }
      if (userRole === 'staff' && userBranch && data.participant?.branch_name !== userBranch) {
        playTone('denied'); triggerFlash('red')
        setError('This participant is not from your assigned branch.')
        setPageState('error'); setLoading(false); return
      }
      setLookup(data); setPhotoError(false); setPageState('verify')
    } catch (err: any) {
      playTone('denied'); triggerFlash('red')
      setError(err.response?.data?.error || 'Resolve failed. Please try again.')
      setPageState('error')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    if (!lookup) return
    setLoading(true)
    try {
      const data = await scanAgentCodeApi({
        agent_code: lookup.participant.agent_code,
        event_id: Number(eventId),
        is_early_out: lookup.next_action === 'check_out' ? isEarlyOut : false,
        early_out_reason: lookup.next_action === 'check_out' && isEarlyOut ? earlyOutReason || null : null
      })
      setResult(data)
      setResultTime(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      const isIn = data.action === 'check_in'
      playTone(isIn ? 'success' : 'checkout')
      triggerFlash(isIn ? 'green' : 'blue')
      setPageState('result')
      refreshCount()
    } catch (err: any) {
      playTone('denied'); triggerFlash('red')
      setError(err.response?.data?.error || 'Scan failed. Please try again.')
      setPageState('error')
    } finally { setLoading(false) }
  }

  const handleDeny = async () => {
    if (!lookup) return
    setLoading(true)
    try {
      await logDenialApi({ agent_code: lookup.participant.agent_code, event_id: Number(eventId), reason: 'Staff denied — identity mismatch' })
    } catch (_) {}
    playTone('denied'); triggerFlash('red')
    setError('Access denied. Identity could not be verified.')
    setPageState('error'); setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleLookup(query)
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSugIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSugIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSugIdx >= 0 && suggestions[activeSugIdx]) handlePickSuggestion(suggestions[activeSugIdx])
      else handleLookup(query)
    } else if (e.key === 'Escape') { setShowSuggestions(false); setActiveSugIdx(-1) }
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

  const bg            = isDarkMode ? '#0f0f0f' : '#f0f1f3'
  const card          = isDarkMode ? '#1c1c1c' : '#ffffff'
  const border        = isDarkMode ? '#2a2a2a' : '#e5e7eb'
  const textPrimary   = isDarkMode ? '#ffffff' : '#111827'
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280'
  const inputBg       = isDarkMode ? '#141414' : '#f9fafb'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: bg }}>
      {/* Flash overlay */}
      {flashColor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', transition: 'opacity 0.3s',
          background: flashColor === 'green' ? 'rgba(22,163,74,0.15)' : flashColor === 'blue' ? 'rgba(37,99,235,0.15)' : 'rgba(220,20,60,0.18)'
        }} />
      )}

        {/* ── HEADER ── */}
        <header className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-[#2a2a2a] shadow-sm flex-shrink-0">
          <div className="px-12 h-[76px] flex items-center gap-4">
            <div className="flex items-baseline gap-3">
              <h1 className="text-[32px] font-extrabold text-gray-800 dark:text-white tracking-tight leading-none">
                {event?.title ?? ''}
              </h1>
              <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">Check-in Station</span>
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="text-2xl font-extrabold text-[#DC143C] leading-none">{checkedInCount}</div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mt-0.5">Attendees Inside</div>
            </div>
          </div>
        </header>

        {/* ── EVENT INFO BAR ── */}
        {event && (
          <div className="bg-[#fafafa] dark:bg-[#161616] border-b border-gray-200 dark:border-[#2a2a2a] px-12 py-2.5 flex items-center gap-5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.event_date)}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
            </div>
            {event.venue && (
              <>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{event.venue}</span>
                </div>
              </>
            )}
            <span style={{
              marginLeft: 'auto', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
              background: event.status === 'open' ? 'rgba(22,163,74,0.10)' : 'rgba(107,114,128,0.10)',
              color: event.status === 'open' ? '#16a34a' : '#6b7280',
              border: `1px solid ${event.status === 'open' ? 'rgba(22,163,74,0.25)' : '#e5e7eb'}`
            }}>
              {event.status === 'open' ? 'Registration Open' : 'Registration Closed'}
            </span>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px 60px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, width: '100%', maxWidth: (pageState === 'verify' || pageState === 'result' ? 820 : 520) + 60, transition: 'max-width 0.2s' }}>
            {/* ── Back button on the left — only shown in verify/pick/result/error states ── */}
            {pageState !== 'input' && (
              <div style={{ flexShrink: 0, alignSelf: 'stretch', display: 'flex' }}>
                <button
                  onClick={() => pageState === 'verify' || pageState === 'pick' ? resetToInput() : navigate(-1)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 48, alignSelf: 'stretch',
                    borderRadius: 14, border: `1px solid ${border}`, background: card,
                    color: textSecondary, cursor: 'pointer', transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = textPrimary; (e.currentTarget as HTMLElement).style.borderColor = '#DC143C'; (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#1a1010' : '#fff5f5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = textSecondary; (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = card }}
                  title="Back"
                >
                  <ArrowLeftIcon />
                </button>
              </div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── INPUT STATE ── */}
            {pageState === 'input' && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ height: 4, background: 'linear-gradient(90deg, #DC143C, #ff4d6d)' }} />
                <div style={{ padding: '32px 32px 36px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: textSecondary }}>
                      <SearchIcon />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 6, letterSpacing: '-0.3px' }}>Search Agent</h2>
                    <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6 }}>Enter agent code or name</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div ref={sugBoxRef} style={{ position: 'relative' }}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setActiveSugIdx(-1) }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { setInputFocused(true); if (suggestions.length > 0) setShowSuggestions(true) }}
                        onBlur={() => setInputFocused(false)}
                        disabled={loading}
                        placeholder="Search..."
                        style={{
                          width: '100%', padding: `14px 44px 14px ${inputFocused ? '44px' : '18px'}`, fontSize: 16, fontWeight: 600,
                          background: inputBg, border: `2px solid ${border}`,
                          borderRadius: showSuggestions && suggestions.length > 0 ? '12px 12px 0 0' : 12,
                          color: textPrimary, outline: 'none', boxSizing: 'border-box', letterSpacing: '0.5px',
                          transition: 'border-radius 0.1s, padding 0.1s'
                        }}
                        autoComplete="off"
                      />
                      {inputFocused && !sugLoading && (
                        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: textSecondary, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                          <SearchIcon />
                        </div>
                      )}
                      {sugLoading && (
                        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: textSecondary }}>
                          <svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                            <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        </div>
                      )}
                      {showSuggestions && suggestions.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: card, border: `2px solid ${border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
                          {suggestions.map((item, idx) => {
                            const isActive = idx === activeSugIdx
                            return (
                              <button key={item.participant_id} onMouseDown={e => { e.preventDefault(); handlePickSuggestion(item) }} onMouseEnter={() => setActiveSugIdx(idx)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', textAlign: 'left', border: 'none', cursor: 'pointer', background: isActive ? (isDarkMode ? '#251010' : '#fff5f5') : 'transparent', borderBottom: idx < suggestions.length - 1 ? `1px solid ${border}` : 'none', transition: 'background 0.1s' }}>
                                <div style={{ color: textSecondary, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                  </svg>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                  <span style={{ fontWeight: 500, fontSize: 14, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.full_name}</span>
                                  <span style={{ width: 1, height: 14, background: border, flexShrink: 0 }} />
                                  <span style={{ fontSize: 13, color: '#DC143C', fontFamily: 'inherit', fontWeight: 400, letterSpacing: '0.3px', flexShrink: 0 }}>{item.agent_code}</span>
                                </div>
                                <div style={{ fontSize: 11, color: textSecondary, flexShrink: 0, whiteSpace: 'nowrap' }}>{item.branch_name} · {item.team_name}</div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {showSuggestions && !sugLoading && suggestions.length === 0 && query.trim().length >= 2 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: card, border: `2px solid ${border}`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '14px 16px', textAlign: 'center', fontSize: 13, color: textSecondary }}>
                          No participants found for "{query}"
                        </div>
                      )}
                    </div>

                    <button onClick={() => handleLookup(query)} disabled={loading || !query.trim()}
                      style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading || !query.trim() ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C', color: loading || !query.trim() ? textSecondary : '#fff', fontSize: 14, fontWeight: 700, cursor: loading || !query.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {loading ? <><svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Searching...</> : 'Enter'}
                    </button>
                  </div>

                  <div style={{ marginTop: 20, padding: '14px 16px', background: isDarkMode ? '#0f0f0f' : '#f9fafb', borderRadius: 12, border: `1px solid ${border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>How it works</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { dot: '#DC143C', text: 'Type agent code or name — suggestions appear as you type' },
                        { dot: '#f59e0b', text: 'Select from suggestions or press Enter to search' },
                        { dot: '#16a34a', text: 'Verify identity, then Confirm to record attendance' },
                      ].map(({ dot, text }, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: textSecondary, lineHeight: 1.5 }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {/* ── PICK STATE ── */}
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
                        <button key={item.participant_id} onClick={() => handlePickParticipant(item)} disabled={loading}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: isDarkMode ? '#141414' : '#f9fafb', border: `1px solid ${border}`, borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#DC143C'; (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#1a1010' : '#fff5f5' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#141414' : '#f9fafb' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', border: `2px solid ${border}`, flexShrink: 0, background: isDarkMode ? '#2a2a2a' : '#e5e7eb' }}>
                            {pUrl ? <img src={pUrl} alt={item.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
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

            {/* ── VERIFY STATE ── */}
            {pageState === 'verify' && lookup && (() => {
              const hasLabel = !!lookup.participant.label
              const lc = hasLabel ? getLabelStyle(String(lookup.participant.label), isDarkMode) : null
              return (

              <div style={{ background: card, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)', border: `1px solid ${border}` }}>
                <div style={{ height: 5, background: 'linear-gradient(90deg, #DC143C, #ff6b6b)' }} />

                {/* ── ROW 1: photo + agent details side by side ── */}
                <div style={{ padding: '32px 36px 28px', display: 'flex', gap: 36, alignItems: 'flex-start' }}>
                  {/* Photo */}
                  <div style={{ flexShrink: 0, position: 'relative' }}>
                    <div style={{ width: 260, height: 260, borderRadius: 20, background: isDarkMode ? '#2a2a2a' : '#f2f2f2', border: `2px solid ${border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {verifyPhotoUrl && !photoError ? (
                        <img src={verifyPhotoUrl} alt={lookup.participant.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setPhotoError(true)} />
                      ) : (
                        <svg viewBox="0 0 80 80" fill="none" style={{ width: 80, height: 80 }}>
                          <circle cx="40" cy="30" r="18" fill={isDarkMode ? '#444' : '#d0d0d0'} />
                          <path d="M8 72c0-17.673 14.327-32 32-32s32 14.327 32 32" fill={isDarkMode ? '#444' : '#d0d0d0'} />
                        </svg>
                      )}
                    </div>
                    <div style={{ position: 'absolute', inset: -5, borderRadius: 24, border: '2px solid rgba(220,20,60,0.2)', pointerEvents: 'none' }} />
                  </div>

                  {/* Agent details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                      <div style={{ fontSize: 34, fontWeight: 700, color: textPrimary, letterSpacing: '-1px', lineHeight: 1.1 }}>
                        {lookup.participant.full_name}
                      </div>
                      {lookup.participant.agent_type && (
                        <div style={{ padding: '3px 10px', borderRadius: 8, background: isDarkMode ? '#1a1a1a' : '#f3f4f6', border: `1px solid ${border}`, fontSize: 11, fontWeight: 700, color: textSecondary, letterSpacing: '0.5px', textTransform: 'uppercase', alignSelf: 'center' }}>
                          {lookup.participant.agent_type}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#DC143C', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Agent Profile</div>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
                      {[
                        { label: 'Agent Code', value: lookup.participant.agent_code, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color: '#DC143C' }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h10M7 11h4"/></svg> },
                        { label: 'Branch', value: lookup.participant.branch_name, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color: '#DC143C' }}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                        { label: 'Team', value: lookup.participant.team_name, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, color: '#DC143C' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
                      ].map(({ label, value, icon }, i, arr) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'rgba(220,20,60,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: textSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 1 }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: textPrimary }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── DIVIDER ── */}
                <div style={{ height: 1, background: border }} />

                {/* ── ROW 2: Status — full bleed ── */}
                <div style={{ padding: '16px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: lookup.next_action === 'check_in' ? (isDarkMode ? 'rgba(220,20,60,0.06)' : 'rgba(220,20,60,0.04)') : (isDarkMode ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.04)') }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: lookup.next_action === 'check_in' ? '#DC143C' : '#2563eb', animation: 'pulse 1.8s infinite' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: lookup.next_action === 'check_in' ? '#DC143C' : '#2563eb', letterSpacing: '-0.2px' }}>
                    {lookup.next_action === 'check_in' ? 'Not Yet Checked In' : lookup.next_action === 'check_out' ? 'Currently Inside' : 'Blocked'}
                  </span>
                </div>

                {/* ── DIVIDER ── */}
                <div style={{ height: 1, background: border }} />

                {/* ── ROW 3: Label — full bleed (only if has label) ── */}
                {hasLabel && lc && (
                  <>
                    <div style={{ padding: '20px 36px', background: lc.bg, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ width: 5, alignSelf: 'stretch', minHeight: 40, borderRadius: 99, background: lc.text, flexShrink: 0, opacity: 0.7 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 99, background: lc.text, fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                          {lookup.participant.label}
                        </span>
                        {lookup.participant.label_description ? (
                          <div style={{ fontSize: 15, fontWeight: 500, color: lc.text, lineHeight: 1.55 }}>
                            {lookup.participant.label_description}
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: lc.text, opacity: 0.45, fontStyle: 'italic' }}>No note added.</div>
                        )}
                      </div>
                    </div>
                    {/* ── DIVIDER ── */}
                    <div style={{ height: 1, background: border }} />
                  </>
                )}

                {/* ── Early out toggle (check_out only, inside button row area) ── */}
                {lookup.next_action === 'check_out' && (
                  <div style={{ padding: '16px 36px 0', transition: 'all 0.2s' }}>
                    <div style={{ padding: '14px 16px', background: isEarlyOut ? (isDarkMode ? '#2a1f00' : '#fffbeb') : (isDarkMode ? '#141414' : '#f9fafb'), border: `1px solid ${isEarlyOut ? '#f59e0b' : border}`, borderRadius: 12, transition: 'all 0.2s' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                        <div onClick={() => { setIsEarlyOut(v => !v); if (isEarlyOut) setEarlyOutReason('') }} style={{ width: 40, height: 22, borderRadius: 11, background: isEarlyOut ? '#f59e0b' : (isDarkMode ? '#3a3a3a' : '#d1d5db'), position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer' }}>
                          <div style={{ position: 'absolute', top: 3, left: isEarlyOut ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isEarlyOut ? '#d97706' : textPrimary }}>Mark as Early Out</div>
                          <div style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>Participant is leaving before the event ends</div>
                        </div>
                      </label>
                      {isEarlyOut && (
                        <input type="text" value={earlyOutReason} onChange={e => setEarlyOutReason(e.target.value)} placeholder="Reason (optional)..."
                          style={{ marginTop: 10, width: '100%', padding: '9px 12px', fontSize: 13, background: isDarkMode ? '#1c1c1c' : '#fff', border: `1px solid #f59e0b`, borderRadius: 8, color: textPrimary, outline: 'none', boxSizing: 'border-box' }} />
                      )}
                    </div>
                  </div>
                )}

                {/* ── ROW 4: Buttons — full bleed ── */}
                <div style={{ padding: '16px 36px 32px', display: 'flex', gap: 14 }}>
                  <button onClick={handleConfirm} disabled={loading || lookup.next_action === 'blocked'}
                    style={{ flex: 1, height: 56, borderRadius: 14, border: 'none', background: loading || lookup.next_action === 'blocked' ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C', color: loading || lookup.next_action === 'blocked' ? textSecondary : '#fff', fontSize: 16, fontWeight: 600, cursor: loading || lookup.next_action === 'blocked' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: loading || lookup.next_action === 'blocked' ? 'none' : '0 4px 20px rgba(220,20,60,0.3)', transition: 'all 0.18s' }}>
                    {loading ? <><svg style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><polyline points="20 6 9 17 4 12"/></svg>{lookup.next_action === 'check_in' ? 'Check-In' : 'Check-Out'}</>}
                  </button>
                  <button onClick={handleDeny} disabled={loading}
                    style={{ flex: 1, height: 56, borderRadius: 14, background: isDarkMode ? '#1c1c1c' : '#fff', color: isDarkMode ? '#9ca3af' : '#666', border: `1.5px solid ${border}`, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.18s' }}
                    onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#2a2a2a' : '#f2f2f2'; (e.currentTarget as HTMLElement).style.color = textPrimary } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#1c1c1c' : '#fff'; (e.currentTarget as HTMLElement).style.color = isDarkMode ? '#9ca3af' : '#666' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Deny
                  </button>
                </div>

                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } } @keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
              )
            })()}

            {/* ── RESULT STATE ── */}
            {pageState === 'result' && result && (() => {
              const isIn = result.action === 'check_in'
              return (
                <div style={{ background: card, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', border: `1px solid ${border}` }}>
                  <div style={{ height: 5, background: 'linear-gradient(90deg, #DC143C, #ff6b6b)' }} />

                  <div style={{ padding: '36px 40px 32px', display: 'flex', gap: 40, alignItems: 'center' }}>

                    {/* LEFT: success icon */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 16 }}>
                      <div style={{ position: 'relative', width: 96, height: 96 }}>
                        <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '2px solid rgba(220,20,60,0.15)', animation: 'ripple 2s ease-out infinite' }} />
                        <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: '2px solid rgba(220,20,60,0.08)', animation: 'ripple 2s ease-out infinite', animationDelay: '0.5s' }} />
                        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(220,20,60,0.12), rgba(220,20,60,0.06))', border: '2px solid rgba(220,20,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="#DC143C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 44, height: 44 }}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#DC143C', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Success</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                          {isIn ? 'Check-In' : 'Check-Out'}<br />Successful
                        </div>
                        {result.is_early_out && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 20, padding: '3px 10px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>⚠ Early Out</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DIVIDER */}
                    <div style={{ width: 1, alignSelf: 'stretch', background: border, flexShrink: 0 }} />

                    {/* RIGHT: agent info + progress bar */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {/* Name */}
                      <div style={{ fontSize: 28, fontWeight: 800, color: textPrimary, letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 18 }}>
                        {result.participant.full_name}
                      </div>

                      {/* Info rows */}
                      <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                        {[
                          { label: 'Agent Code', value: result.participant.agent_code, highlight: false },
                          { label: isIn ? 'Checked In At' : 'Checked Out At', value: resultTime, highlight: true },
                        ].map(({ label, value, highlight }, i, arr) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none', background: 'transparent' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
                            <span style={{ fontSize: highlight ? 16 : 14, fontWeight: highlight ? 800 : 700, color: highlight ? '#DC143C' : textPrimary, letterSpacing: highlight ? '-0.3px' : '0.5px', fontVariantNumeric: 'tabular-nums', fontFamily: !highlight ? 'monospace' : 'inherit' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, color: textSecondary, fontWeight: 500 }}>
                          Next scan in {countdown}s…
                        </div>
                        <div style={{ width: '100%', height: 5, background: isDarkMode ? '#2a2a2a' : '#f0f1f3', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #DC143C, #ff6b6b)', width: `${(countdown / COUNTDOWN_SECS) * 100}%`, transition: 'width 1s linear' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <style>{`@keyframes ripple { 0% { transform: scale(0.85); opacity: 1; } 100% { transform: scale(1.1); opacity: 0; } }`}</style>
                </div>
              )
            })()}

            {/* ── ERROR STATE ── */}
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
                    <div style={{ height: '100%', background: '#DC143C', borderRadius: 3, width: `${(countdown / COUNTDOWN_SECS) * 100}%`, transition: 'width 1s linear' }} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: textSecondary }}>Next scan in {countdown}s</div>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>

      {/* ── LABEL DETAIL MODAL ── */}
      {labelModalOpen && lookup?.participant.label && (() => {
        const lc = getLabelStyle(String(lookup.participant.label), isDarkMode)
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setLabelModalOpen(false)}
          >
            <div
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 24, width: '100%', maxWidth: 420, margin: '0 16px', padding: 32, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: textPrimary, margin: 0, marginBottom: 4 }}>Label Details</h2>
                  <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
                    {lookup.participant.full_name} · <span style={{ fontFamily: 'monospace', color: '#DC143C' }}>{lookup.participant.agent_code}</span>
                  </p>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontSize: 12, fontWeight: 700,
                  padding: '4px 12px', borderRadius: 999,
                  background: lc.bg, color: lc.text,
                  border: `1.5px solid ${lc.border}`,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {lookup.participant.label}
                </span>
              </div>

              {/* Body */}
              <div style={{ background: isDarkMode ? '#141414' : '#f9fafb', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '1px', margin: 0, marginBottom: 4 }}>Label</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: textPrimary, margin: 0 }}>{lookup.participant.label}</p>
                </div>
                <div style={{ height: 1, background: border, margin: '14px 0' }} />
                {lookup.participant.label_description ? (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '1px', margin: 0, marginBottom: 4 }}>Note</p>
                    <p style={{ fontSize: 14, color: textPrimary, margin: 0, lineHeight: 1.6 }}>{lookup.participant.label_description}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: textSecondary, fontStyle: 'italic', margin: 0 }}>No note added.</p>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setLabelModalOpen(false)}
                style={{ width: '100%', height: 48, borderRadius: 14, border: `1.5px solid ${border}`, background: 'transparent', color: textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#2a2a2a' : '#f3f4f6' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                Close
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}