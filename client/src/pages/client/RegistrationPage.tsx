import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { registerParticipantApi } from '../../api/participants.api'
import { Event } from '../../types'

const slides = [
  {
    tag: 'Life Insurance',
    headline: 'Protect What\nMatters Most',
    desc: 'Comprehensive life coverage tailored for Filipino families, backed by Prudential\'s global strength.',
    pills: [{ icon: '🏠', name: 'Family Protection' }, { icon: '💰', name: 'Wealth Builder' }, { icon: '🔒', name: 'Guaranteed' }],
    gradient: 'linear-gradient(160deg, #6b0a1a 0%, #C8102E 50%, #1a0a0a 100%)',
  },
  {
    tag: 'Investment',
    headline: 'Grow Your\nFuture Today',
    desc: 'Variable life products combining protection with long-term investment growth.',
    pills: [{ icon: '📈', name: 'VUL Plans' }, { icon: '🎯', name: 'Goal Planner' }, { icon: '📊', name: 'Projections' }],
    gradient: 'linear-gradient(160deg, #1a0a0a 0%, #C8102E 55%, #7a0a1e 100%)',
  },
  {
    tag: 'Health & Wellness',
    headline: 'Your Health,\nOur Priority',
    desc: 'Critical illness and medical coverage so you can focus on recovery, not the bills.',
    pills: [{ icon: '❤️', name: 'Critical Illness' }, { icon: '💊', name: 'Medical' }, { icon: '🧬', name: 'Wellness' }],
    gradient: 'linear-gradient(160deg, #C8102E 0%, #96281b 45%, #1a0a0a 100%)',
  },
  {
    tag: 'Retirement',
    headline: 'Retire with\nConfidence',
    desc: 'Pension and annuity solutions designed for the comfort you deserve.',
    pills: [{ icon: '🌅', name: 'Pension Plan' }, { icon: '🏖️', name: 'Annuity' }, { icon: '📅', name: 'Planning' }],
    gradient: 'linear-gradient(160deg, #2a0a0a 0%, #C8102E 60%, #e8193e 100%)',
  },
  {
    tag: 'Join Us',
    headline: 'Build a Career\nYou\'re Proud Of',
    desc: 'Become part of the PruLife UK advisor network and help clients secure their future.',
    pills: [{ icon: '🤝', name: 'Commission' }, { icon: '🏆', name: 'Recognition' }, { icon: '📚', name: 'Training' }],
    gradient: 'linear-gradient(160deg, #3d0015 0%, #8B0000 40%, #C8102E 100%)',
  },
]

export default function RegistrationPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [form, setForm] = useState({
    agent_code: '',
    full_name: '',
    branch_name: '',
    team_name: '',
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    getEventByIdApi(Number(eventId))
      .then(setEvent)
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false))
  }, [eventId])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 4500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const goToSlide = (i: number) => {
    setCurrentSlide(i)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 4500)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const data = await registerParticipantApi(Number(eventId), form)
      navigate('/confirmation', { state: { participant: data.participant, event } })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
  if (loading) return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.spinnerWrap}>
        <div className="pru-spinner" />
        <p style={s.loadingText}>Loading event...</p>
      </div>
    </div>
  )

  // ── Event not found ──
  if (!event) return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.stateCard}>
        <div style={{ ...s.stateIcon, background: '#c0392b' }}>✕</div>
        <h2 style={s.stateTitle}>Event Not Found</h2>
        <p style={s.stateText}>This event link may be invalid or expired.</p>
      </div>
    </div>
  )

  // ── Closed ──
  if (event.status !== 'open') return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.stateCard}>
        <div style={{ ...s.stateIcon, background: '#92400e', fontSize: 22 }}>🔒</div>
        <h2 style={s.stateTitle}>Registration Closed</h2>
        <p style={s.stateText}>This event is not accepting registrations right now.</p>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Styles />
      <div style={s.card} className="pru-card">

        {/* ── LEFT: FORM PANEL ── */}
        <div style={s.formPanel}>
          {/* Logo */}
          <div style={s.logo}>
            <div style={s.logoMark}>P</div>
            <div>
              <div style={s.logoName}>PRU<span style={{ color: '#DC143C' }}>LIFE</span> UK</div>
              <div style={s.logoSub}>Event Registration</div>
            </div>
          </div>

          {/* Event info pill */}
          <div style={s.eventPill}>
            <span style={s.eventPillDot} />
            <span style={s.eventPillText}>OPEN — {event.title}</span>
          </div>

          <h1 style={s.heading}>Register for<br />this Event</h1>
          <p style={s.subheading}>Fill in your agent details below to secure your slot.</p>

          {/* Event meta strip */}
          <div style={s.metaStrip}>
            <div style={s.metaItem}>
              <span style={s.metaIcon}>📅</span>
              <span style={s.metaVal}>
                {new Date(event.event_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div style={s.metaDivider} />
            <div style={s.metaItem}>
              <span style={s.metaIcon}>🕐</span>
              <span style={s.metaVal}>{event.start_time} – {event.end_time}</span>
            </div>
            <div style={s.metaDivider} />
            <div style={s.metaItem}>
              <span style={s.metaIcon}>📍</span>
              <span style={s.metaVal}>{event.venue}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBanner}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>AGENT CODE</label>
                <input
                  className="pru-input"
                  name="agent_code"
                  value={form.agent_code}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 12345678"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>FULL NAME</label>
                <input
                  className="pru-input"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Maria Santos"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>BRANCH NAME</label>
                <input
                  className="pru-input"
                  name="branch_name"
                  value={form.branch_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Makati Branch"
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>TEAM NAME</label>
                <input
                  className="pru-input"
                  name="team_name"
                  value={form.team_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Team Alpha"
                />
              </div>
            </div>

            <div style={s.notice}>
              <span>ℹ️</span>
              <span>Your <strong>Agent Code</strong> will be used for check-in at the venue.</span>
            </div>

            <button type="submit" disabled={submitting} className="pru-btn">
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="btn-spinner" /> Registering...
                </span>
              ) : 'Complete Registration →'}
            </button>
          </form>
        </div>

        {/* ── RIGHT: SLIDESHOW PANEL ── */}
        <div style={s.visualPanel} className="pru-visual-panel">
          {/* Top badge */}
          <div style={s.topBadge}>
            <div style={s.badgeIcon}>🛡️</div>
            <div>
              <div style={s.badgeName}>PruLife UK</div>
              <div style={s.badgeSub}>Trusted since 1907</div>
            </div>
          </div>

          {/* Slides */}
          {slides.map((sl, i) => (
            <div
              key={i}
              style={{
                ...s.slide,
                background: sl.gradient,
                opacity: i === currentSlide ? 1 : 0,
                zIndex: i === currentSlide ? 1 : 0,
              }}
            >
              <div style={s.slidePattern} />
              <div style={s.slideOverlay} />
              <div style={s.slideContent}>
                <div style={s.slideTag}>{sl.tag}</div>
                <div style={s.slideHeadline}>{sl.headline.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}</div>
                <div style={s.slideDesc}>{sl.desc}</div>
                <div style={s.pillsGrid}>
                  {sl.pills.map((p, j) => (
                    <div key={j} style={s.pill}>
                      <div style={s.pillIcon}>{p.icon}</div>
                      <div style={s.pillName}>{p.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Dots */}
          <div style={s.dots}>
            {slides.map((_, i) => (
              <div
                key={i}
                onClick={() => goToSlide(i)}
                style={{
                  ...s.dot,
                  width: i === currentSlide ? 20 : 6,
                  background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Styles component ──────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }

      .pru-input {
        width: 100%;
        padding: 13px 14px;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f9fafb;
        color: #1f2937;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      }
      .pru-input:focus {
        border-color: #DC143C;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(220,20,60,0.08);
      }
      .pru-input::placeholder { color: #9ca3af; }

      .pru-btn {
        width: 100%;
        padding: 14px;
        background: #DC143C;
        color: white;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 700;
        font-size: 15px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
        box-shadow: 0 4px 18px rgba(220,20,60,0.22);
      }
      .pru-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        background: #b01030;
        box-shadow: 0 6px 24px rgba(220,20,60,0.28);
      }
      .pru-btn:active:not(:disabled) { transform: translateY(0); }
      .pru-btn:disabled { opacity: 0.6; cursor: not-allowed; }

      .pru-spinner {
        width: 44px; height: 44px;
        border: 3px solid #e5e7eb;
        border-top-color: #DC143C;
        border-radius: 50%;
        animation: pru-spin 0.75s linear infinite;
      }
      .btn-spinner {
        display: inline-block;
        width: 14px; height: 14px;
        border: 2px solid rgba(255,255,255,0.4);
        border-top-color: white;
        border-radius: 50%;
        animation: pru-spin 0.6s linear infinite;
      }
      @keyframes pru-spin { to { transform: rotate(360deg); } }

      @media (max-width: 768px) {
        .pru-visual-panel { display: none !important; }
        .pru-card { grid-template-columns: 1fr !important; border-radius: 0 !important; min-height: 100vh !important; }
      }
    `}</style>
  )
}

// ── Inline styles ─────────────────────────────────────────────────
const FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: FONT,
  },
  fullPage: {
    minHeight: '100vh',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT,
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
    maxWidth: 1080,
    minHeight: 700,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 28px 80px rgba(220,20,60,0.1), 0 8px 24px rgba(0,0,0,0.08)',
    background: '#fff',
  },

  // Form panel
  formPanel: {
    padding: '44px 48px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  logoMark: {
    width: 38, height: 38,
    background: '#DC143C',
    borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white',
    fontFamily: FONT,
    fontSize: 18, fontWeight: 700,
  },
  logoName: {
    fontFamily: FONT,
    fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em',
  },
  logoSub: { fontSize: 10, color: '#9ca3af', letterSpacing: '0.5px' },

  eventPill: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
    padding: '5px 12px', marginBottom: 18, alignSelf: 'flex-start',
  },
  eventPillDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#DC143C',
    boxShadow: '0 0 0 2px rgba(220,20,60,0.2)',
    flexShrink: 0,
  },
  eventPillText: { fontSize: 11, fontWeight: 600, color: '#DC143C', letterSpacing: '0.05em' },

  heading: {
    fontFamily: FONT,
    fontSize: '1.85rem', fontWeight: 800, color: '#1f2937',
    lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.03em',
  },
  subheading: { fontSize: 14, color: '#6b7280', marginBottom: 20 },

  metaStrip: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
    padding: '10px 14px', marginBottom: 20,
  },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5 },
  metaIcon: { fontSize: 12 },
  metaVal: { fontSize: 12, color: '#4b5563', fontWeight: 500 },
  metaDivider: { width: 1, height: 12, background: '#d1d5db', margin: '0 4px' },

  errorBanner: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: 12, padding: '10px 14px', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
  formGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 11, fontWeight: 700, color: '#6b7280',
    letterSpacing: '1px', textTransform: 'uppercase',
  },

  notice: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
    padding: '10px 13px', fontSize: 12, color: '#92400e',
  },

  // Visual panel
  visualPanel: {
    position: 'relative', overflow: 'hidden', background: '#DC143C',
  },
  slide: {
    position: 'absolute', inset: 0, transition: 'opacity 0.9s ease',
  },
  slidePattern: {
    position: 'absolute', inset: 0, opacity: 0.05,
    backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 22px)',
  },
  slideOverlay: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.05) 55%)',
  },
  slideContent: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '36px 32px 52px', color: 'white',
    zIndex: 2,
  },
  slideTag: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.22)',
    padding: '4px 12px', borderRadius: 20,
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
    marginBottom: 12,
  },
  slideHeadline: {
    fontFamily: FONT,
    fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.25,
    marginBottom: 10, letterSpacing: '-0.02em',
  },
  slideDesc: {
    fontSize: 12.5, opacity: 0.75, lineHeight: 1.65, maxWidth: 280, marginBottom: 20,
  },
  pillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  pill: {
    background: 'rgba(255,255,255,0.11)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10,
    padding: '10px 8px', textAlign: 'center',
  },
  pillIcon: { fontSize: 16, marginBottom: 4 },
  pillName: { fontSize: 10, fontWeight: 600, opacity: 0.88, lineHeight: 1.3 },

  topBadge: {
    position: 'absolute', top: 22, left: 22, zIndex: 10,
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12,
    padding: '8px 14px',
    display: 'flex', alignItems: 'center', gap: 9, color: 'white',
  },
  badgeIcon: {
    width: 28, height: 28, background: '#DC143C', borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
  },
  badgeName: { fontSize: 12, fontWeight: 700 },
  badgeSub: { fontSize: 10, opacity: 0.6 },

  dots: {
    position: 'absolute', bottom: 18, right: 28, zIndex: 10,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  dot: {
    height: 6, borderRadius: 3, cursor: 'pointer',
    transition: 'width 0.3s ease, background 0.3s ease',
  },

  // State screens
  spinnerWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  stateCard: {
    background: '#fff', borderRadius: 18, padding: '44px 36px',
    textAlign: 'center', maxWidth: 360,
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  },
  stateIcon: {
    width: 56, height: 56, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, margin: '0 auto 16px', color: 'white',
  },
  stateTitle: {
    fontFamily: FONT,
    fontSize: 20, fontWeight: 800, color: '#1f2937', marginBottom: 8,
  },
  stateText: { fontSize: 13, color: '#6b7280' },
}