import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { registerParticipantApi } from '../../api/participants.api'
import { Event } from '../../types'
import { useBranches } from '../../hooks/useBranches'
import pruLogo from '../../assets/pru.webp'
import imgFamily     from '../../assets/Family.webp'
import imgInvest     from '../../assets/Invest.webp'
import imgHealth     from '../../assets/Health.webp'
import imgRetirement from '../../assets/Retirement.webp'
import imgTeam       from '../../assets/Team.webp'

// ── SVG Icon Components (black/white, minimal) ────────────────────
const IconTrendingUp = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
)

const IconTarget = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)

const IconBarChart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const IconHeart = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const IconActivity = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)

const IconZap = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const IconSunrise = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 18a5 5 0 0 0-10 0" /><line x1="12" y1="2" x2="12" y2="9" />
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" /><line x1="1" y1="18" x2="3" y2="18" />
    <line x1="21" y1="18" x2="23" y2="18" /><line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
    <line x1="23" y1="22" x2="1" y2="22" /><polyline points="8 6 12 2 16 6" />
  </svg>
)

const IconCalendar = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const IconUsers = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconAward = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
)

const IconBook = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const IconLock = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IconHome = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconClock = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

const IconMapPin = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const IconAlertTriangle = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconInfo = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

const IconX = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IconArrowRight = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
)

const IconDollarSign = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

// PRU LIFE UK Logo

const slides = [
  {
    tag: 'Life Insurance',
    headline: 'Protect What\nMatters Most',
    desc: 'Comprehensive life coverage tailored for Filipino families, backed by Prudential\'s global strength.',
    pills: [
      { icon: <IconHome size={15} color="white" />, name: 'Family Protection' },
      { icon: <IconDollarSign size={15} color="white" />, name: 'Wealth Builder' },
      { icon: <IconLock size={15} color="white" />, name: 'Guaranteed' },
    ],
    image: imgFamily,
  },
  {
    tag: 'Investment',
    headline: 'Grow Your\nFuture Today',
    desc: 'Variable life products combining protection with long-term investment growth.',
    pills: [
      { icon: <IconTrendingUp size={15} color="white" />, name: 'VUL Plans' },
      { icon: <IconTarget size={15} color="white" />, name: 'Goal Planner' },
      { icon: <IconBarChart size={15} color="white" />, name: 'Projections' },
    ],
    image: imgInvest,
  },
  {
    tag: 'Health & Wellness',
    headline: 'Your Health,\nOur Priority',
    desc: 'Critical illness and medical coverage so you can focus on recovery, not the bills.',
    pills: [
      { icon: <IconHeart size={15} color="white" />, name: 'Critical Illness' },
      { icon: <IconActivity size={15} color="white" />, name: 'Medical' },
      { icon: <IconZap size={15} color="white" />, name: 'Wellness' },
    ],
    image: imgHealth,
  },
  {
    tag: 'Retirement',
    headline: 'Retire with\nConfidence',
    desc: 'Pension and annuity solutions designed for the comfort you deserve.',
    pills: [
      { icon: <IconSunrise size={15} color="white" />, name: 'Pension Plan' },
      { icon: <IconCalendar size={15} color="white" />, name: 'Annuity' },
      { icon: <IconTarget size={15} color="white" />, name: 'Planning' },
    ],
    image: imgRetirement,
  },
  {
    tag: 'Join Us',
    headline: 'Build a Career\nYou\'re Proud Of',
    desc: 'Become part of the PruLife UK advisor network and help clients secure their future.',
    pills: [
      { icon: <IconUsers size={15} color="white" />, name: 'Commission' },
      { icon: <IconAward size={15} color="white" />, name: 'Recognition' },
      { icon: <IconBook size={15} color="white" />, name: 'Training' },
    ],
    image: imgTeam,
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

  const { branches: allBranches, getTeamsForBranch } = useBranches()
  const [agentCodeError, setAgentCodeError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'agent_code') {
      // Only allow digits, max 8
      const digits = value.replace(/\D/g, '').slice(0, 8)
      setForm(prev => ({ ...prev, agent_code: digits }))
      if (digits.length > 0 && digits.length !== 8) {
        setAgentCodeError('Agent code must be exactly 8 digits')
      } else {
        setAgentCodeError('')
      }
      return
    }

    if (name === 'branch_name') {
      // Reset team when branch changes
      setForm(prev => ({ ...prev, branch_name: value, team_name: '' }))
      return
    }

    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.agent_code.length !== 8) {
      setAgentCodeError('Agent code must be exactly 8 digits')
      return
    }
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

  // Filter branches: if event has a branch_name, only show that one
  const availableBranches = event
    ? (event as any).branch_name
      ? allBranches.filter(b => b.name === (event as any).branch_name)
      : allBranches
    : allBranches
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
        <div style={{ ...s.stateIcon, background: '#c0392b' }}>
          <IconX size={22} color="white" />
        </div>
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
        <div style={{ ...s.stateIcon, background: '#92400e' }}>
          <IconLock size={22} color="white" />
        </div>
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
            <div style={s.logoMark}>
              <img
                src={pruLogo}
                alt="PRU LIFE UK"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 9 }}
              />
            </div>
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
              <span style={s.metaIcon}><IconCalendar size={13} color="#6b7280" /></span>
              <span style={s.metaVal}>
                {new Date(event.event_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div style={s.metaDivider} />
            <div style={s.metaItem}>
              <span style={s.metaIcon}><IconClock size={13} color="#6b7280" /></span>
              <span style={s.metaVal}>{event.start_time} – {event.end_time}</span>
            </div>
            <div style={s.metaDivider} />
            <div style={s.metaItem}>
              <span style={s.metaIcon}><IconMapPin size={13} color="#6b7280" /></span>
              <span style={s.metaVal}>{event.venue}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={s.errorBanner}>
              <IconAlertTriangle size={15} color="#dc2626" />
              <span>{error}</span>
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
                  placeholder="8-digit code (e.g. 12345678)"
                  inputMode="numeric"
                  maxLength={8}
                />
                {agentCodeError && (
                  <span style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{agentCodeError}</span>
                )}
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
                <select
                  className="pru-input"
                  name="branch_name"
                  value={form.branch_name}
                  onChange={handleChange}
                  required
                >
                  <option value="">— Select branch —</option>
                  {availableBranches.map(b => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>TEAM NAME</label>
                <select
                  className="pru-input"
                  name="team_name"
                  value={form.team_name}
                  onChange={handleChange}
                  required
                  disabled={!form.branch_name}
                >
                  <option value="">
                    {form.branch_name ? '— Select team —' : '— Select branch first —'}
                  </option>
                  {getTeamsForBranch(form.branch_name).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={s.notice}>
              <span style={{ flexShrink: 0, marginTop: 1, display: 'flex' }}><IconInfo size={14} color="#92400e" /></span>
              <span>Your <strong>Agent Code</strong> will be used for check-in at the venue.</span>
            </div>

            <button type="submit" disabled={submitting} className="pru-btn">
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="btn-spinner" /> Registering...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Complete Registration <IconArrowRight size={16} color="white" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: SLIDESHOW PANEL ── */}
        <div style={s.visualPanel} className="pru-visual-panel">
          {/* Top badge with PRU LIFE UK logo */}
          <div style={s.topBadge}>
            <div style={s.badgeIcon}>
              <img
                src={pruLogo}
                alt="PRU LIFE UK"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 7 }}
              />
            </div>
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
                backgroundImage: `url(${sl.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
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
        appearance: auto;
      }
      select.pru-input {
        cursor: pointer;
      }
      select.pru-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
    width: 42, height: 42,
    background: '#fff',
    borderRadius: 9,
    border: '1px solid #e5e7eb',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    padding: 2,
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
  metaIcon: { display: 'flex', alignItems: 'center' },
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
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  pillIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  pillName: { fontSize: 10, fontWeight: 600, opacity: 0.88, lineHeight: 1.3, color: 'white' },

  topBadge: {
    position: 'absolute', top: 22, left: 22, zIndex: 10,
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12,
    padding: '8px 14px',
    display: 'flex', alignItems: 'center', gap: 9, color: 'white',
  },
  badgeIcon: {
    width: 28, height: 28,
    background: 'white',
    borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    padding: 2,
    flexShrink: 0,
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
    margin: '0 auto 16px',
  },
  stateTitle: {
    fontFamily: FONT,
    fontSize: 20, fontWeight: 800, color: '#1f2937', marginBottom: 8,
  },
  stateText: { fontSize: 13, color: '#6b7280' },
}