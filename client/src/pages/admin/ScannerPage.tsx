import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
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

// ── Label Colors ─────────────────────────────────────────
const getLabelStyle = (_label: string, isDarkMode: boolean) => {
  if (isDarkMode) {
    return { bg: 'rgba(220,20,60,0.12)', text: '#f87171', border: 'rgba(220,20,60,0.3)' }
  }
  return { bg: '#fee2e2', text: '#DC143C', border: '#fca5a5' }
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

// ── Component ────────────────────────────────────────────
export default function ScannerPage() {
  const { eventId } = useParams()
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

  // ── Suggestions state ──
  const [suggestions, setSuggestions]         = useState<PickItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sugLoading, setSugLoading]           = useState(false)
  const [activeSugIdx, setActiveSugIdx]       = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sugBoxRef   = useRef<HTMLDivElement>(null)

  const inputRef     = useRef<HTMLInputElement>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flashRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storedUser  = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole    = storedUser?.role || 'staff'
  const userBranch  = storedUser?.branch_name || undefined

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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── INPUT STATE — Google-style search ── */}
        {pageState === 'input' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 20px 60px' }}>
            {/* Logo/title area */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: textPrimary, letterSpacing: '-1px', marginBottom: 4 }}>
                Prime<span style={{ color: '#DC143C' }}>Log</span>
              </div>
              <div style={{ fontSize: 13, color: textSecondary }}>Check-in Station</div>
            </div>

            {/* Google-style search bar */}
            <div ref={sugBoxRef} style={{ width: '100%', maxWidth: 580, position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: card,
                border: `1.5px solid ${showSuggestions && suggestions.length > 0 ? border : border}`,
                borderRadius: showSuggestions && suggestions.length > 0 ? '24px 24px 0 0' : 24,
                boxShadow: showSuggestions && suggestions.length > 0
                  ? '0 1px 6px rgba(0,0,0,0.10)'
                  : '0 2px 12px rgba(0,0,0,0.08)',
                transition: 'border-radius 0.1s, box-shadow 0.15s',
                overflow: 'visible',
              }}>
                {/* Search icon inside bar */}
                <div style={{ paddingLeft: 20, color: textSecondary, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {sugLoading ? (
                    <svg style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none">
                      <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <SearchIcon />
                  )}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveSugIdx(-1) }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                  disabled={loading}
                  placeholder="Search by agent code or name..."
                  style={{
                    flex: 1,
                    padding: '16px 16px',
                    fontSize: 16,
                    background: 'transparent',
                    border: 'none',
                    color: textPrimary,
                    outline: 'none',
                    letterSpacing: '0.2px',
                  }}
                  autoComplete="off"
                />

                {/* Clear button */}
                {query && (
                  <button
                    onClick={() => { setQuery(''); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus() }}
                    style={{ paddingRight: 8, color: textSecondary, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}

                {/* Divider + search button */}
                <div style={{ width: 1, height: 24, background: border, flexShrink: 0 }} />
                <button
                  onClick={() => handleLookup(query)}
                  disabled={loading || !query.trim()}
                  style={{
                    padding: '12px 20px',
                    background: 'none',
                    border: 'none',
                    color: !query.trim() ? textSecondary : '#DC143C',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: !query.trim() ? 'default' : 'pointer',
                    borderRadius: '0 22px 22px 0',
                    transition: 'color 0.15s',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  {loading
                    ? <><svg style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Searching...</>
                    : 'Search'
                  }
                </button>
              </div>

              {/* Suggestions dropdown — max height so it never overflows screen */}
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: card,
                  border: `1.5px solid ${border}`, borderTop: 'none',
                  borderRadius: '0 0 24px 24px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  maxHeight: '40vh',
                  overflowY: 'auto',
                }}>
                  <div style={{ height: 1, background: isDarkMode ? '#333' : '#f0f0f0', margin: '0 16px' }} />
                  {suggestions.map((item, idx) => {
                    const isActive = idx === activeSugIdx
                    return (
                      <button
                        key={item.participant_id}
                        onMouseDown={e => { e.preventDefault(); handlePickSuggestion(item) }}
                        onMouseEnter={() => setActiveSugIdx(idx)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px',
                          textAlign: 'left', border: 'none', cursor: 'pointer',
                          background: isActive ? (isDarkMode ? '#3a1a1a' : '#ffe4e4') : 'transparent',
                          transition: 'background 0.1s',
                        }}>
                        <div style={{ color: textSecondary, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <SearchIcon />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 500, fontSize: 14, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.full_name}</span>
                            <span style={{ fontSize: 12, color: '#DC143C', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>{item.agent_code}</span>
                          </div>
                          <div style={{ fontSize: 11, color: textSecondary, marginTop: 1 }}>{item.branch_name} · {item.team_name}</div>
                        </div>
                      </button>
                    )
                  })}
                  <div style={{ height: 8 }} />
                </div>
              )}

              {showSuggestions && !sugLoading && suggestions.length === 0 && query.trim().length >= 2 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: card, border: `1.5px solid ${border}`, borderTop: 'none',
                  borderRadius: '0 0 24px 24px', padding: '16px 20px',
                  textAlign: 'center', fontSize: 13, color: textSecondary,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                }}>
                  No participants found for "{query}"
                </div>
              )}
            </div>

            {/* Hint text */}
            <div style={{ marginTop: 24, fontSize: 12, color: textSecondary, textAlign: 'center' }}>
              Press <kbd style={{ padding: '2px 6px', borderRadius: 4, border: `1px solid ${border}`, background: isDarkMode ? '#2a2a2a' : '#f3f4f6', fontSize: 11 }}>Enter</kbd> to search or select from suggestions
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* ── PICK STATE ── */}
        {pageState === 'pick' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 48px 48px' }}>
            {/* Back button */}
            <button
              onClick={resetToInput}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginBottom: 20,
                background: 'none', border: 'none', cursor: 'pointer',
                color: textSecondary, fontSize: 13, fontWeight: 600,
                padding: '6px 0', alignSelf: 'flex-start',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = textPrimary}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = textSecondary}
            >
              <ArrowLeftIcon />
              Back to search
            </button>

            <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, marginBottom: 16, textAlign: 'center' }}>
              {pickList.length} participants matched — select the correct person
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
              {pickList.map(item => {
                const pUrl = getPhotoUrl(item.photo_url)
                return (
                  <button key={item.participant_id} onClick={() => handlePickParticipant(item)} disabled={loading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: card, border: `1px solid ${border}`, borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#DC143C'; (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#1a1010' : '#fff5f5' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.background = card }}>
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
          </div>
        )}

        {/* ── VERIFY STATE — 70/30 split layout ── */}
        {pageState === 'verify' && lookup && (() => {
          const hasLabel = !!lookup.participant.label
          const lc = hasLabel ? getLabelStyle(String(lookup.participant.label), isDarkMode) : null

          return (
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

              {/* ── LEFT 70%: Back button + Photo + Label ── */}
              <div style={{ flex: '0 0 70%', display: 'flex', flexDirection: 'column', padding: '28px 40px 48px', overflowY: 'auto' }}>
                {/* Back button */}
                <button
                  onClick={resetToInput}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginBottom: 24,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: textSecondary, fontSize: 13, fontWeight: 600,
                    padding: '6px 0', alignSelf: 'flex-start',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = textPrimary}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = textSecondary}
                >
                  <ArrowLeftIcon />
                  Back to search
                </button>

                {/* Photo — centered, fixed square */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 420, height: 420, flexShrink: 0, position: 'relative' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: 20, background: isDarkMode ? '#2a2a2a' : '#f2f2f2', border: `2px solid ${border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

                  {/* Label section — below photo, fills full width with padding */}
                  {hasLabel && lc && (
                    <div style={{
                      marginTop: 28,
                      padding: '20px 24px',
                      background: lc.bg,
                      borderRadius: 14,
                      border: `1px solid ${lc.border}`,
                      display: 'flex', alignItems: 'center', gap: 14,
                      width: '100%', boxSizing: 'border-box' as const,
                    }}>
                      {/* Left colored bar */}
                      <div style={{ width: 4, alignSelf: 'stretch', minHeight: 40, borderRadius: 99, background: lc.text, flexShrink: 0, opacity: 0.7 }} />
                      {/* Pill + note on same line */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                          padding: '5px 16px', borderRadius: 99,
                          background: lc.text, fontSize: 13, fontWeight: 800,
                          color: 'white', letterSpacing: '1.5px', textTransform: 'uppercase' as const,
                        }}>
                          {lookup.participant.label}
                        </span>
                        {lookup.participant.label_description ? (
                          <div style={{ fontSize: 22, fontWeight: 500, color: lc.text, lineHeight: 1.3 }}>
                            {lookup.participant.label_description}
                          </div>
                        ) : (
                          <div style={{ fontSize: 20, color: lc.text, opacity: 0.5, fontStyle: 'italic' }}>No note added.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT 30%: Full height panel flush to edge ── */}
              <div style={{
                flex: '0 0 30%',
                display: 'flex', flexDirection: 'column',
                background: card,
                borderLeft: `1px solid ${border}`,
              }}>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 0', overflowY: 'auto', minHeight: 0 }}>
                  {/* Full name + status pill inline */}
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: textPrimary, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                        {lookup.participant.full_name}
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 11px', borderRadius: 99,
                        background: lookup.next_action === 'check_in'
                          ? (isDarkMode ? 'rgba(220,20,60,0.12)' : 'rgba(220,20,60,0.08)')
                          : lookup.next_action === 'check_out'
                            ? (isDarkMode ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)')
                            : (isDarkMode ? 'rgba(107,114,128,0.15)' : 'rgba(107,114,128,0.08)'),
                        border: `1px solid ${lookup.next_action === 'check_in' ? 'rgba(220,20,60,0.25)' : lookup.next_action === 'check_out' ? 'rgba(37,99,235,0.25)' : 'rgba(107,114,128,0.2)'}`,
                        fontSize: 11, fontWeight: 700,
                        color: lookup.next_action === 'check_in' ? '#DC143C' : lookup.next_action === 'check_out' ? '#2563eb' : textSecondary,
                        flexShrink: 0,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: lookup.next_action === 'check_in' ? '#DC143C' : lookup.next_action === 'check_out' ? '#2563eb' : textSecondary,
                          animation: lookup.next_action !== 'blocked' ? 'pulse 1.8s infinite' : 'none',
                        }} />
                        {lookup.next_action === 'check_in' ? 'Not Yet Checked In' : lookup.next_action === 'check_out' ? 'Currently Inside' : 'Blocked'}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: border, margin: '14px 0' }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: textSecondary, letterSpacing: '0.8px', textTransform: 'uppercase' as const, marginBottom: 8 }}>Agent Profile</div>
                  <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                    {[
                      ...(lookup.participant.agent_type ? [{ label: 'Agent Type', value: lookup.participant.agent_type, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: '#DC143C' }}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }] : []),
                      { label: 'Agent Code', value: lookup.participant.agent_code, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: '#DC143C' }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h10M7 11h4"/></svg> },
                      { label: 'Branch', value: lookup.participant.branch_name, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: '#DC143C' }}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
                      { label: 'Team', value: lookup.participant.team_name, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, color: '#DC143C' }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
                    ].map(({ label, value, icon }, i, arr) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: 'rgba(220,20,60,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: 1 }}>{label}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Early out toggle (check_out only) */}
                  {lookup.next_action === 'check_out' && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        padding: '12px 14px',
                        background: isEarlyOut ? (isDarkMode ? '#2a1f00' : '#fffbeb') : (isDarkMode ? '#141414' : '#f9fafb'),
                        border: `1px solid ${isEarlyOut ? '#f59e0b' : border}`,
                        borderRadius: 10, transition: 'all 0.2s',
                      }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' as const }}>
                          <div
                            onClick={() => { setIsEarlyOut(v => !v); if (isEarlyOut) setEarlyOutReason('') }}
                            style={{ width: 36, height: 20, borderRadius: 10, background: isEarlyOut ? '#f59e0b' : (isDarkMode ? '#3a3a3a' : '#d1d5db'), position: 'relative', transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer' }}>
                            <div style={{ position: 'absolute', top: 2, left: isEarlyOut ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: isEarlyOut ? '#d97706' : textPrimary }}>Mark as Early Out</div>
                            <div style={{ fontSize: 10, color: textSecondary }}>Leaving before event ends</div>
                          </div>
                        </label>
                        {isEarlyOut && (
                          <input
                            type="text" value={earlyOutReason}
                            onChange={e => setEarlyOutReason(e.target.value)}
                            placeholder="Reason (optional)..."
                            style={{ marginTop: 8, width: '100%', padding: '7px 10px', fontSize: 12, background: isDarkMode ? '#1c1c1c' : '#fff', border: `1px solid #f59e0b`, borderRadius: 7, color: textPrimary, outline: 'none', boxSizing: 'border-box' as const }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons — pinned to bottom */}
                <div style={{ padding: '16px 24px 24px', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={handleConfirm}
                    disabled={loading || lookup.next_action === 'blocked'}
                    style={{
                      width: '100%', height: 48, borderRadius: 12, border: 'none',
                      background: loading || lookup.next_action === 'blocked' ? (isDarkMode ? '#2a2a2a' : '#e5e7eb') : '#DC143C',
                      color: loading || lookup.next_action === 'blocked' ? textSecondary : '#fff',
                      fontSize: 14, fontWeight: 700,
                      cursor: loading || lookup.next_action === 'blocked' ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: loading || lookup.next_action === 'blocked' ? 'none' : '0 4px 16px rgba(220,20,60,0.3)',
                      transition: 'all 0.15s',
                    }}>
                    {loading
                      ? <><svg style={{ width: 15, height: 15, animation: 'spin 0.8s linear infinite' }} viewBox="0 0 24 24" fill="none"><circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Processing...</>
                      : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}><polyline points="20 6 9 17 4 12"/></svg>{lookup.next_action === 'check_in' ? 'Check-In' : 'Check-Out'}</>
                    }
                  </button>
                  <button
                    onClick={handleDeny}
                    disabled={loading}
                    style={{
                      width: '100%', height: 44, borderRadius: 12,
                      background: 'transparent',
                      color: textSecondary,
                      border: `1.5px solid ${border}`,
                      fontSize: 13, fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = isDarkMode ? '#2a2a2a' : '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = textPrimary } }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = textSecondary }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    Deny
                  </button>
                </div>

              </div>
            </div>
          )
        })()}


        {/* ── RESULT STATE ── */}
        {pageState === 'result' && result && (() => {
          const isIn = result.action === 'check_in'
          return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0px 48px 80px' }}>
              <div style={{ background: card, borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', border: `1px solid ${border}`, width: '100%', maxWidth: 600 }}>
                <div style={{ height: 5, background: 'linear-gradient(90deg, #DC143C, #ff6b6b)' }} />
                <div style={{ padding: '36px 40px 32px', display: 'flex', gap: 40, alignItems: 'center' }}>
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
                  <div style={{ width: 1, alignSelf: 'stretch', background: border, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: textPrimary, letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 18 }}>
                      {result.participant.full_name}
                    </div>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                      {[
                        { label: 'Agent Code', value: result.participant.agent_code, highlight: false },
                        { label: isIn ? 'Checked In At' : 'Checked Out At', value: resultTime, highlight: true },
                      ].map(({ label, value, highlight }, i, arr) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
                          <span style={{ fontSize: highlight ? 16 : 14, fontWeight: highlight ? 800 : 700, color: highlight ? '#DC143C' : textPrimary, letterSpacing: highlight ? '-0.3px' : '0.5px', fontVariantNumeric: 'tabular-nums', fontFamily: !highlight ? 'monospace' : 'inherit' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 11, color: textSecondary, fontWeight: 500 }}>Next scan in {countdown}s…</div>
                      <div style={{ width: '100%', height: 5, background: isDarkMode ? '#2a2a2a' : '#f0f1f3', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #DC143C, #ff6b6b)', width: `${(countdown / COUNTDOWN_SECS) * 100}%`, transition: 'width 1s linear' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <style>{`@keyframes ripple { 0% { transform: scale(0.85); opacity: 1; } 100% { transform: scale(1.1); opacity: 0; } }`}</style>
              </div>
            </div>
          )
        })()}

        {/* ── ERROR STATE ── */}
        {pageState === 'error' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0px 48px 80px' }}>
            <div style={{ background: card, border: `2px solid #DC143C`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 32px rgba(220,20,60,0.12)', width: '100%', maxWidth: 480 }}>
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
          </div>
        )}

      </div>
    </div>
  )
}