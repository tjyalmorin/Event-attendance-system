import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { lookupParticipantApi, scanAgentCodeApi, logDenialApi } from '../../api/scan.api'
import { Event, ScanResponse } from '../../types'

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

export default function ScannerPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [agentCode, setAgentCode] = useState('')
  const [pageState, setPageState] = useState<PageState>('input')
  const [lookup, setLookup] = useState<LookupResult | null>(null)
  const [result, setResult] = useState<ScanResponse | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const inputRef = useRef<HTMLInputElement>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getEventByIdApi(Number(eventId)).then(setEvent).catch(console.error)
  }, [eventId])

  useEffect(() => {
    if (pageState === 'input') inputRef.current?.focus()
  }, [pageState])

  // Auto-dismiss result/error after 3 seconds with countdown
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

  const resetToInput = () => {
    setPageState('input')
    setLookup(null)
    setResult(null)
    setError('')
    setAgentCode('')
    setPhotoError(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Step 1 — Lookup participant, show verification card
  const handleLookup = async (code: string) => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const data = await lookupParticipantApi({ agent_code: code.trim(), event_id: Number(eventId) })

      if (data.next_action === 'blocked') {
        setError('This participant has already checked in and checked out. No further entries allowed.')
        setPageState('error')
        setAgentCode('')
        return
      }

      setLookup(data)
      setPhotoError(false)
      setPageState('verify')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lookup failed')
      setAgentCode('')
      setPageState('error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2a — Admin confirms identity, proceed with scan
  const handleConfirm = async () => {
    if (!lookup) return
    setLoading(true)
    try {
      const data = await scanAgentCodeApi({ agent_code: lookup.participant.agent_code, event_id: Number(eventId) })
      setResult(data)
      setPageState('result')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Scan failed')
      setPageState('error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2b — Admin denies, log it and show denied card
  const handleDeny = async () => {
    if (!lookup) return
    setLoading(true)
    try {
      await logDenialApi({
        agent_code: lookup.participant.agent_code,
        event_id: Number(eventId),
        reason: 'Staff denied — identity mismatch'
      })
    } catch (_) {}
    setError('Access denied. Identity could not be verified.')
    setPageState('error')
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLookup(agentCode)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLookup(agentCode)
  }

  const getPhotoUrl = (photo_url: string | null | undefined) => {
    if (!photo_url) return null
    if (photo_url.startsWith('http')) return photo_url
    return `http://localhost:5000${photo_url}`
  }

  const isCheckIn = result?.action === 'check_in'
  const verifyPhotoUrl = getPhotoUrl(lookup?.participant.photo_url)
  const resultPhotoUrl = getPhotoUrl(result?.participant.photo_url)

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .scan-input {
          width: 100%;
          background: #1e2433;
          border: 2px solid #2d3548;
          border-radius: 12px;
          padding: 16px;
          font-size: 20px;
          font-family: monospace;
          color: #fff;
          text-align: center;
          letter-spacing: 4px;
          outline: none;
          transition: all 0.2s;
        }
        .scan-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); }
        .scan-input::placeholder { color: #4b5563; letter-spacing: 2px; font-size: 14px; }
        .scan-input:disabled { opacity: 0.5; }

        .scan-btn {
          width: 100%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 14px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .scan-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(37,99,235,0.4); }
        .scan-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .confirm-btn {
          flex: 1;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 16px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }
        .confirm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(22,163,74,0.4); }
        .confirm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .deny-btn {
          flex: 1;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          padding: 16px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }
        .deny-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(220,38,38,0.4); }
        .deny-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .slide-up { animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s forwards; opacity: 0; }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .pulse-ring {
          position: absolute; inset: -6px; border-radius: 50%;
          animation: pulse-ring 1.5s ease-out 0.7s infinite;
        }
        .pulse-green { border: 2px solid rgba(34,197,94,0.5); }
        .pulse-blue { border: 2px solid rgba(59,130,246,0.5); }

        @keyframes countdown {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <button onClick={() => navigate(`/admin/events/${eventId}`)} style={styles.backBtn}>← Back</button>
          <div>
            <div style={styles.navTitle}>Check-in Scanner</div>
            {event && <div style={styles.navSub}>{event.title}</div>}
          </div>
        </div>
        <div style={{ ...styles.statusBadge, background: event?.status === 'open' ? '#16a34a' : '#dc2626' }}>
          {event?.status?.toUpperCase() || 'LOADING...'}
        </div>
      </nav>

      <div style={styles.container}>

        {/* ── STATE 1: INPUT ── */}
        {pageState === 'input' && (
          <>
            <div style={styles.inputCard}>
              <div style={styles.scanIcon}>🪪</div>
              <h2 style={styles.inputTitle}>Enter Agent Code</h2>
              <p style={styles.inputSub}>Type the agent code and press Enter to begin verification.</p>
              <form onSubmit={handleSubmit} style={styles.form}>
                <input
                  ref={inputRef}
                  className="scan-input"
                  type="text"
                  value={agentCode}
                  onChange={e => setAgentCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  placeholder="AGENT CODE"
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !agentCode.trim()} className="scan-btn">
                  {loading ? 'Looking up...' : 'Verify Agent →'}
                </button>
              </form>
            </div>

            <div style={styles.instructions}>
              <div style={styles.instructionTitle}>💡 How it works</div>
              <div style={styles.instructionList}>
                <div style={styles.instructionItem}>
                  <span style={{ ...styles.dot, background: '#a78bfa' }} />
                  <span>Enter code → <strong style={{ color: '#a78bfa' }}>Verification card appears</strong></span>
                </div>
                <div style={styles.instructionItem}>
                  <span style={{ ...styles.dot, background: '#22c55e' }} />
                  <span>Confirm identity → <strong style={{ color: '#4ade80' }}>Check In / Out</strong></span>
                </div>
                <div style={styles.instructionItem}>
                  <span style={{ ...styles.dot, background: '#f87171' }} />
                  <span>Mismatch → <strong style={{ color: '#f87171' }}>Deny access</strong></span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── STATE 2: VERIFY ── */}
        {pageState === 'verify' && lookup && (
          <div className="slide-up" style={styles.verifyCard}>
            {/* Header */}
            <div style={styles.verifyHeader}>
              <div style={styles.verifyBadge}>🔍 IDENTITY VERIFICATION</div>
              <div style={styles.verifySubtitle}>
                Compare the photo below with the person in front of you
              </div>
            </div>

            {/* Large Photo */}
            <div style={styles.largePhotoWrapper}>
              {verifyPhotoUrl && !photoError ? (
                <img
                  src={verifyPhotoUrl}
                  alt={lookup.participant.full_name}
                  style={styles.largePhoto}
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <div style={styles.largePhotoPlaceholder}>
                  <span style={styles.largeInitials}>
                    {lookup.participant.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <span style={styles.noPhotoText}>No photo on file</span>
                </div>
              )}
            </div>

            {/* Agent Info */}
            <div style={styles.verifyInfo}>
              <div style={styles.verifyName}>{lookup.participant.full_name}</div>
              <div style={styles.verifyCode}>{lookup.participant.agent_code}</div>
              <div style={styles.verifyTags}>
                <span style={styles.tag}>{lookup.participant.branch_name}</span>
                <span style={styles.tag}>{lookup.participant.team_name}</span>
                <span style={{
                  ...styles.actionTag,
                  background: lookup.next_action === 'check_in' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  border: lookup.next_action === 'check_in' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(59,130,246,0.3)',
                  color: lookup.next_action === 'check_in' ? '#4ade80' : '#60a5fa',
                }}>
                  {lookup.next_action === 'check_in' ? '↓ Check In' : '↑ Check Out'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={styles.divider} />

            {/* Action Buttons */}
            <div style={styles.verifyQuestion}>Is this the same person?</div>
            <div style={styles.btnRow}>
              <button className="deny-btn" onClick={handleDeny} disabled={loading}>
                ✕ Deny
              </button>
              <button className="confirm-btn" onClick={handleConfirm} disabled={loading}>
                ✓ Confirm
              </button>
            </div>
          </div>
        )}

        {/* ── STATE 3: RESULT ── */}
        {pageState === 'result' && result && (
          <div className="slide-up" style={{
            ...styles.resultCard,
            background: isCheckIn ? 'linear-gradient(135deg, #052e16, #14532d)' : 'linear-gradient(135deg, #0c1a3d, #1e3a8a)',
            border: isCheckIn ? '1px solid #166534' : '1px solid #1e40af',
          }}>
            {/* Countdown bar */}
            <div style={styles.countdownBar}>
              <div style={{
                height: '100%',
                background: isCheckIn ? '#22c55e' : '#3b82f6',
                borderRadius: 2,
                animation: 'countdown 3s linear forwards',
              }} />
            </div>

            <div style={styles.resultHeader}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div className={`pulse-ring ${isCheckIn ? 'pulse-green' : 'pulse-blue'}`} />
                <div className="pop-in" style={{
                  ...styles.resultIcon,
                  background: isCheckIn ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                }}>
                  {isCheckIn ? '✓' : '↗'}
                </div>
              </div>
              <div>
                <div style={styles.resultAction}>{isCheckIn ? 'CHECKED IN' : 'CHECKED OUT'}</div>
                <div style={styles.resultTime}>
                  {new Date(
                    isCheckIn ? result.session.check_in_time : result.session.check_out_time || result.session.check_in_time
                  ).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            </div>

            <div style={styles.divider} />

            <div style={styles.agentRow}>
              <div style={styles.photoWrapper}>
                {resultPhotoUrl && !photoError ? (
                  <img src={resultPhotoUrl} alt={result.participant.full_name} style={styles.photo} onError={() => setPhotoError(true)} />
                ) : (
                  <div style={{
                    ...styles.photoPlaceholder,
                    background: isCheckIn ? 'linear-gradient(135deg, #166534, #16a34a)' : 'linear-gradient(135deg, #1e40af, #2563eb)',
                  }}>
                    <span style={styles.photoInitials}>
                      {result.participant.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div style={styles.agentInfo}>
                <div style={styles.agentName}>{result.participant.full_name}</div>
                <div style={styles.agentCode}>{result.participant.agent_code}</div>
                <div style={styles.agentTags}>
                  <span style={styles.tag}>{result.participant.branch_name}</span>
                  <span style={styles.tag}>{result.participant.team_name}</span>
                </div>
              </div>
            </div>

            <div style={styles.dismissNote}>Auto-dismiss in {countdown}s</div>
          </div>
        )}

        {/* ── STATE 4: ERROR ── */}
        {pageState === 'error' && (
          <div className="slide-up" style={styles.errorCard}>
            {/* Countdown bar */}
            <div style={styles.countdownBar}>
              <div style={{ height: '100%', background: '#ef4444', borderRadius: 2, animation: 'countdown 3s linear forwards' }} />
            </div>
            <div style={styles.errorIcon}>✕</div>
            <div style={styles.errorTitle}>DENIED</div>
            <div style={styles.errorMessage}>{error}</div>
            <div style={styles.dismissNote}>Auto-dismiss in {countdown}s</div>
          </div>
        )}

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0d1117', color: '#fff', fontFamily: "'DM Sans', sans-serif" },
  nav: { background: '#161b27', borderBottom: '1px solid #1e2433', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  backBtn: { background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, padding: '6px 10px', borderRadius: 8 },
  navTitle: { fontSize: 16, fontWeight: 600, color: '#fff' },
  navSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', padding: '5px 12px', borderRadius: 20, color: '#fff' },
  container: { maxWidth: 480, margin: '0 auto', padding: '32px 20px 48px', display: 'flex', flexDirection: 'column', gap: 16 },
  inputCard: { background: '#161b27', border: '1px solid #1e2433', borderRadius: 20, padding: '32px 28px', textAlign: 'center' },
  scanIcon: { fontSize: 48, marginBottom: 12 },
  inputTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 },
  inputSub: { fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  verifyCard: { background: '#161b27', border: '2px solid #7c3aed', borderRadius: 20, padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  verifyHeader: { textAlign: 'center', marginBottom: 20, width: '100%' },
  verifyBadge: { display: 'inline-block', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', padding: '5px 12px', borderRadius: 20, marginBottom: 8 },
  verifySubtitle: { fontSize: 13, color: '#9ca3af', lineHeight: 1.5 },
  largePhotoWrapper: { width: 180, height: 180, borderRadius: 20, overflow: 'hidden', border: '4px solid rgba(124,58,237,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', marginBottom: 20 },
  largePhoto: { width: '100%', height: '100%', objectFit: 'cover' },
  largePhotoPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #3b0764, #7c3aed)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 },
  largeInitials: { color: 'white', fontSize: 52, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  noPhotoText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  verifyInfo: { textAlign: 'center', width: '100%', marginBottom: 20 },
  verifyName: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 },
  verifyCode: { fontFamily: 'monospace', fontSize: 14, color: '#a78bfa', fontWeight: 600, marginBottom: 10, letterSpacing: '1px' },
  verifyTags: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  verifyQuestion: { fontSize: 15, fontWeight: 600, color: '#e5e7eb', marginBottom: 14, textAlign: 'center' },
  btnRow: { display: 'flex', gap: 12, width: '100%' },
  actionTag: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 },
  countdownBar: { height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  resultCard: { borderRadius: 20, padding: '24px' },
  resultHeader: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  resultIcon: { width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0, position: 'relative' },
  resultAction: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '1px' },
  resultTime: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontFamily: 'monospace' },
  divider: { height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20, width: '100%' },
  agentRow: { display: 'flex', alignItems: 'center', gap: 16 },
  photoWrapper: { flexShrink: 0, width: 90, height: 90, borderRadius: 14, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  photoInitials: { color: 'white', fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  agentInfo: { flex: 1, minWidth: 0 },
  agentName: { fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  agentCode: { fontFamily: 'monospace', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '1px' },
  agentTags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' },
  dismissNote: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 16 },
  errorCard: { background: 'linear-gradient(135deg, #450a0a, #7f1d1d)', border: '1px solid #991b1b', borderRadius: 20, padding: '28px', textAlign: 'center' },
  errorIcon: { width: 52, height: 52, background: 'linear-gradient(135deg, #dc2626, #ef4444)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 auto 12px' },
  errorTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '1px', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 },
  instructions: { background: '#161b27', border: '1px solid #1e2433', borderRadius: 16, padding: '20px 24px' },
  instructionTitle: { fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 14 },
  instructionList: { display: 'flex', flexDirection: 'column', gap: 10 },
  instructionItem: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9ca3af' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
}