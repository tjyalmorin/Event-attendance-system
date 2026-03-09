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

// ── SVG Icon Components ────────────────────────────────────────
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

const IconFileText = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

// ── Types ─────────────────────────────────────────────────────────
interface EventBranchEntry {
  branch_name: string
  team_names: string[]
}

interface EventWithBranches extends Event {
  event_branches?: EventBranchEntry[]
}

// ── Slideshow data ────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────
const formatTime12h = (time: string) => {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function RegistrationPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<EventWithBranches | null>(null)
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
      .then(data => setEvent(data as EventWithBranches))
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false))
  }, [eventId])

  // Only run slideshow if no poster
  useEffect(() => {
    if (event?.poster_url) return
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 4500)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [event?.poster_url])

  const goToSlide = (i: number) => {
    if (event?.poster_url) return
    setCurrentSlide(i)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, 4500)
  }

  const { branches: allBranches } = useBranches()
  const [agentCodeError, setAgentCodeError] = useState('')

  const availableBranches = (() => {
    const eventBranchConfig = event?.event_branches
    if (!eventBranchConfig || eventBranchConfig.length === 0) return allBranches
    return allBranches
      .filter(b => eventBranchConfig.some(eb => eb.branch_name === b.name))
      .map(b => {
        const eb = eventBranchConfig.find(eb => eb.branch_name === b.name)
        if (!eb) return b
        const allowedTeams = eb.team_names
        return {
          ...b,
          teams: (b.teams ?? []).filter(t => allowedTeams.includes(t.name)),
        }
      })
  })()

  const getTeamsForSelectedBranch = (branchName: string): string[] => {
    const branch = availableBranches.find(b => b.name === branchName)
    return branch?.teams?.map(t => t.name) ?? []
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'agent_code') {
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

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={s.fullPage}>
      <Styles />
      <div style={s.spinnerWrap}>
        <div className="pru-spinner" />
        <p style={s.loadingText}>Loading event...</p>
      </div>
    </div>
  )

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

  // ── Derived event info ────────────────────────────────────────
  const formattedDate = new Date(event.event_date).toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const timeRange = event.start_time && event.end_time
    ? `${formatTime12h(event.start_time)} – ${formatTime12h(event.end_time)}`
    : event.start_time ? formatTime12h(event.start_time) : ''

  const hasPoster = Boolean(event.poster_url)
  const posterSrc = event.poster_url
  ? event.poster_url.startsWith('http')
    ? event.poster_url
    : event.poster_url   // relative — Vite proxies /uploads → port 5000
  : null

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
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 0 }}
              />
            </div>
            <div>
              <div style={s.logoName}>A1<span style={{ color: '#DC143C' }}>PRIME</span> — Register<span style={{ color: '#DC143C' }}>.</span></div>
              <div style={s.logoSub}>Fill in your agent details below to secure your slot.</div>
            </div>
          </div>

          {/* ── Event Info Panel (What / Where / When / Why) ── */}
          <div style={s.eventInfoBox}>
            {/* WHAT */}
            <div style={s.infoRow}>
              <div style={s.infoRowLeft}>
                <span style={{ ...s.infoIconBadge, background: '#fef2f2' }}>
                  <IconFileText size={14} color="#DC143C" />
                </span>
              </div>
              <div style={s.infoRowValue}>{event.title}</div>
            </div>

            <div style={s.infoDivider} />

            {/* WHERE */}
            <div style={s.infoRow}>
              <div style={s.infoRowLeft}>
                <span style={{ ...s.infoIconBadge, background: '#eff6ff' }}>
                  <IconMapPin size={14} color="#3b82f6" />
                </span>
              </div>
              <div style={s.infoRowValue}>
                {event.venue || '—'}
              </div>
            </div>

            <div style={s.infoDivider} />

            {/* WHEN */}
            <div style={s.infoRow}>
              <div style={s.infoRowLeft}>
                <span style={{ ...s.infoIconBadge, background: '#f0fdf4' }}>
                  <IconCalendar size={14} color="#10b981" />
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                <div style={s.infoRowValue}>
                  {formattedDate}
                </div>
                {timeRange && (
                  <div style={s.infoRowSub}>
                    <span style={s.infoCardIconWrap}><IconClock size={12} color="#9ca3af" /></span>
                    {timeRange}
                  </div>
                )}
              </div>
            </div>

            {/* WHY — only if description exists */}
            {event.description && (
              <>
                <div style={s.infoDivider} />
                <div style={s.infoRow}>
                  <div style={s.infoRowLeft}>
                    <span style={{ ...s.infoIconBadge, background: '#fffbeb' }}>
                      <IconInfo size={14} color="#f59e0b" />
                    </span>
                  </div>
                  <div style={{ ...s.infoRowValue, fontWeight: 400, fontSize: 12.5, color: '#4b5563', lineHeight: 1.6, alignItems: 'flex-start' }}>
                    {event.description}
                  </div>
                </div>
              </>
            )}
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
                  {getTeamsForSelectedBranch(form.branch_name).map(t => (
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

        {/* ── RIGHT: POSTER or SLIDESHOW ── */}
        <div style={s.visualPanel} className="pru-visual-panel">

          {hasPoster ? (
            /* ── POSTER MODE ── */
            <div style={s.posterWrap}>
              {/* Top badge */}
              <div style={s.topBadge}>
                <div style={s.badgeIcon}>
                  <img src={pruLogo} alt="PRU LIFE UK" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 0 }} />
                </div>
                <div>
                  <div style={s.badgeName}>A1 Prime</div>
                  <div style={s.badgeSub}>Trusted since 1996</div>
                </div>
              </div>

              <img
                src={posterSrc!}
                alt={event.title}
                style={s.posterImg}
              />

              {/* Bottom overlay with event name */}
              <div style={s.posterOverlay}>
                <div style={s.posterEventLabel}>NOW OPEN FOR REGISTRATION</div>
                <div style={s.posterEventTitle}>{event.title}</div>
                <div style={s.posterEventMeta}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconCalendar size={13} color="rgba(255,255,255,0.8)" />
                    {formattedDate}
                  </span>
                  {timeRange && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconClock size={13} color="rgba(255,255,255,0.8)" />
                      {timeRange}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── SLIDESHOW MODE ── */
            <>
              {/* Top badge */}
              <div style={s.topBadge}>
                <div style={s.badgeIcon}>
                  <img src={pruLogo} alt="PRU LIFE UK" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 0 }} />
                </div>
                <div>
                  <div style={s.badgeName}>A1 Prime</div>
                  <div style={s.badgeSub}>Trusted since 1996</div>
                </div>
              </div>

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
                    <div style={s.slideHeadline}>
                      {sl.headline.split('\n').map((line, j) => <span key={j}>{line}<br /></span>)}
                    </div>
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
            </>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Styles component ──────────────────────────────────────────
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
      select.pru-input { cursor: pointer; }
      select.pru-input:disabled { opacity: 0.5; cursor: not-allowed; }
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

// ── Inline styles ─────────────────────────────────────────────
const FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0f1f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: FONT,
  },
  fullPage: {
    minHeight: '100vh',
    background: '#f0f1f3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT,
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
    maxWidth: 1100,
    minHeight: 700,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 28px 80px rgba(220,20,60,0.08), 0 8px 24px rgba(0,0,0,0.08)',
    background: '#fff',
  },

  // ── Form Panel ─────────────────────────────────────────────
  formPanel: {
    padding: '36px 44px 40px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoMark: {
    width: 40, height: 40,
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
    fontSize: '1.05rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em',
  },
  logoSub: { fontSize: 11, color: '#6b7280', letterSpacing: '0.2px', marginTop: 1 },

  // ── Event Info Unified Box ─────────────────────────────────
  eventInfoBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '4px 0',
    marginBottom: 20,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '10px 16px',
  },
  infoRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
    paddingTop: 1,
    flexShrink: 0,
  },
  infoIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoRowValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1f2937',
    lineHeight: 1.4,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 5,
    flex: 1,
  },
  infoRowSub: {
    fontSize: 12,
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  infoDivider: {
    height: 1,
    background: '#e5e7eb',
    margin: '0 16px',
  },
  infoLabelDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#DC143C',
    flexShrink: 0,
    display: 'inline-block',
  },
  infoCardIconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  heading: {
    fontFamily: FONT,
    fontSize: '1.7rem', fontWeight: 800, color: '#1f2937',
    lineHeight: 1.15, marginBottom: 4, letterSpacing: '-0.03em',
  },
  subheading: { fontSize: 13.5, color: '#6b7280', marginBottom: 16 },

  errorBanner: {
    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: 12, padding: '10px 14px', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 14, flex: 1 },
  formGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: 11, fontWeight: 700, color: '#6b7280',
    letterSpacing: '1px', textTransform: 'uppercase' as const,
  },

  notice: {
    display: 'flex', alignItems: 'flex-start', gap: 8,
    background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
    padding: '10px 13px', fontSize: 12, color: '#92400e',
  },

  // ── Visual Panel ───────────────────────────────────────────
  visualPanel: {
    position: 'relative', overflow: 'hidden', background: '#DC143C',
  },

  // ── Poster mode ────────────────────────────────────────────
  posterWrap: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  posterImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  },
  posterOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.0) 100%)',
    padding: '32px 28px 28px',
    color: 'white',
    zIndex: 2,
  },
  posterEventLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#DC143C',
    background: 'rgba(255,255,255,0.95)',
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    marginBottom: 10,
  },
  posterEventTitle: {
    fontFamily: FONT,
    fontSize: '1.4rem',
    fontWeight: 800,
    lineHeight: 1.25,
    marginBottom: 10,
    letterSpacing: '-0.02em',
  },
  posterEventMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 5,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Slideshow mode ─────────────────────────────────────────
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
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const,
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
    padding: '10px 8px', textAlign: 'center' as const,
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

  // ── State screens ──────────────────────────────────────────
  spinnerWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 13, color: '#6b7280' },
  stateCard: {
    background: '#fff', borderRadius: 18, padding: '44px 36px',
    textAlign: 'center' as const, maxWidth: 360,
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