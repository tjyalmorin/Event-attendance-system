import { useLocation, useNavigate } from 'react-router-dom'
import { Participant, Event } from '../../types'
import pruLogo from '../../assets/pru.png'

interface LocationState {
  participant: Participant
  event: Event
}

// ── SVG Icons ──────────────────────────────────────────────────────
const IconCheck = () => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconCalendar = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconClock = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)
const IconMapPin = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconAlertTriangle = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#DC143C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconInfo = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#DC143C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)
const IconArrowLeft = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)

// ──────────────────────────────────────────────────────────────────

export default function ConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  if (!state?.participant) {
    return (
      <div style={s.fullPage}>
        <Styles />
        <div style={s.stateCard}>
          <div style={s.stateIconWrap}><IconAlertTriangle /></div>
          <h2 style={s.stateTitle}>No Registration Found</h2>
          <p style={s.stateText}>Please register for the event first.</p>
          <button onClick={() => navigate(-1 as any)} className="pru-ghost-btn">
            <IconArrowLeft /> Go Back
          </button>
        </div>
      </div>
    )
  }

  const { participant, event } = state

  return (
    <div style={s.page}>
      <Styles />

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>
              <img src={pruLogo} alt="PRU LIFE UK" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={s.logoName}>PRU<span style={{ color: '#DC143C' }}>LIFE</span> UK</div>
              <div style={s.logoSub}>Event Registration</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── SINGLE CARD ── */}
      <div style={s.outer}>
        <div style={s.card} className="fade-in">

          {/* ── SUCCESS HERO ── */}
          <div style={s.successSection}>
            {/* Animated check */}
            <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 24 }}>
              <div className="pulse-ring" />
              <div className="pulse-ring-2" />
              <div className="checkmark-anim" style={s.checkCircle}>
                <IconCheck />
              </div>
            </div>

            <div style={s.successLabel}>Registration Confirmed</div>
            <h1 style={s.successHeading}>You're all set!</h1>
            <p style={s.successDesc}>
              Your spot has been reserved. See you at <strong>{event?.title ?? 'the event'}</strong>.
            </p>

            {/* Open badge */}
            <div style={s.openPill}>
              <span style={s.openDot} />
              <span>REGISTRATION OPEN</span>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={s.divider} />

          {/* ── AGENT INFO ── */}
          <div style={s.infoSection}>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Full Name</span>
              <span style={s.infoVal}>{participant.full_name}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Agent Code</span>
              <span style={s.agentCode}>{participant.agent_code}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Branch</span>
              <span style={s.infoVal}>{participant.branch_name}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Team</span>
              <span style={s.infoVal}>{participant.team_name}</span>
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div style={s.divider} />

          {/* ── EVENT DETAILS ── */}
          {event && (
            <div style={s.eventSection}>
              <div style={s.sectionTitle}>Event Details</div>
              <div style={s.metaList}>
                <div style={s.metaItem}>
                  <span style={s.metaIcon}><IconCalendar /></span>
                  <span style={s.metaText}>
                    {new Date(event.event_date).toLocaleDateString('en-PH', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
                <div style={s.metaItem}>
                  <span style={s.metaIcon}><IconClock /></span>
                  <span style={s.metaText}>{event.start_time} — {event.end_time}</span>
                </div>
                <div style={s.metaItem}>
                  <span style={s.metaIcon}><IconMapPin /></span>
                  <span style={s.metaText}>{event.venue}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── DIVIDER ── */}
          <div style={s.divider} />

          {/* ── CHECK-IN INSTRUCTIONS ── */}
          <div style={s.instructionSection}>
            <div style={s.sectionTitleRow}>
              <IconInfo />
              <span style={s.sectionTitle}>Check-in Instructions</span>
            </div>
            <div style={s.instructionList}>
              {[
                <>Tell the staff your <strong>Agent Code</strong> at the entrance</>,
                <>Your code is: <span style={s.codeHighlight}>{participant.agent_code}</span></>,
                <>Staff will type it into the scanner to check you in</>,
                <>You get <strong>one check-in</strong> and <strong>one check-out</strong> per event</>,
              ].map((item, i) => (
                <div key={i} style={s.instructionItem}>
                  <div style={s.bullet}>{i + 1}</div>
                  <div style={s.instructionText}>{item}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; }

      .fade-in {
        animation: fadeUp 0.5s ease both;
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes popIn {
        0%   { transform: scale(0.4); opacity: 0; }
        70%  { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
      .checkmark-anim {
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
      }

      @keyframes pulse {
        0%   { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.9); opacity: 0; }
      }
      .pulse-ring {
        position: absolute; inset: -10px; border-radius: 50%;
        border: 2px solid rgba(220, 20, 60, 0.25);
        animation: pulse 2s ease-out 0.5s infinite;
        pointer-events: none;
      }
      .pulse-ring-2 {
        position: absolute; inset: -20px; border-radius: 50%;
        border: 2px solid rgba(220, 20, 60, 0.12);
        animation: pulse 2s ease-out 0.85s infinite;
        pointer-events: none;
      }

      /* Buttons */


      .pru-ghost-btn {
        display: inline-flex; align-items: center; gap: 6px;
        background: none; border: none; color: #DC143C;
        font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      }

    `}</style>
  )
}

// ── Style Map ──────────────────────────────────────────────────────
const FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const s: Record<string, React.CSSProperties> = {

  page:     { minHeight: '100vh', background: '#f9fafb', fontFamily: FONT },
  fullPage: { minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT },

  // Header
  header:      { background: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 50 },
  headerInner: { maxWidth: 600, margin: '0 auto', padding: '13px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:        { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark:    { width: 38, height: 38, background: '#fff', borderRadius: 9, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, padding: 2 },
  logoName:    { fontSize: '1rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em' },
  logoSub:     { fontSize: 10, color: '#9ca3af', letterSpacing: '0.4px', marginTop: 1 },

  // Outer wrapper + single card
  outer: { maxWidth: 560, margin: '0 auto', padding: '36px 20px 64px' },
  card:  {
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },

  // ── Success hero section ──
  successSection: {
    padding: '52px 40px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    background: '#fff',
  },
  checkCircle: {
    width: 80, height: 80,
    background: '#DC143C',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 28px rgba(220,20,60,0.38)',
    position: 'relative',
    flexShrink: 0,
  },
  successLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: '#DC143C',
    marginBottom: 10,
  },
  successHeading: {
    fontSize: '2rem', fontWeight: 800, color: '#1f2937',
    letterSpacing: '-0.04em', lineHeight: 1.1,
    marginBottom: 12,
  },
  successDesc: {
    fontSize: 14, color: '#6b7280', lineHeight: 1.65,
    maxWidth: 340, marginBottom: 22,
  },
  openPill: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    color: '#16a34a', fontSize: 10, fontWeight: 700,
    letterSpacing: '0.08em', padding: '6px 14px', borderRadius: 20,
  },
  openDot: { width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 },

  // Divider
  divider: { height: 1, background: '#f3f4f6', margin: '0' },

  // ── Agent info section ──
  infoSection: { padding: '28px 40px' },
  infoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14, marginBottom: 14,
    borderBottom: '1px solid #f9fafb',
  },
  infoLabel: { fontSize: 12, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.02em' },
  infoVal:   { fontSize: 14, fontWeight: 600, color: '#1f2937', textAlign: 'right' as const, maxWidth: '60%' },
  agentCode: {
    fontFamily: 'monospace', fontSize: 15, fontWeight: 800,
    color: '#DC143C', letterSpacing: '2.5px',
    background: '#fff5f5', padding: '4px 12px',
    borderRadius: 8, border: '1px solid #fecdd3',
  },

  // ── Event section ──
  eventSection: { padding: '28px 40px' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#1f2937', letterSpacing: '0.01em', marginBottom: 16 },
  sectionTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  metaList: { display: 'flex', flexDirection: 'column', gap: 12 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 10 },
  metaIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  metaText: { fontSize: 13, color: '#4b5563', fontWeight: 500, lineHeight: 1.45 },

  // ── Instruction section ──
  instructionSection: { padding: '28px 40px' },
  instructionList: { display: 'flex', flexDirection: 'column', gap: 12 },
  instructionItem: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  bullet: {
    width: 22, height: 22, borderRadius: '50%',
    background: '#1f2937', color: 'white',
    fontSize: 10, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  instructionText: { fontSize: 13, color: '#6b7280', lineHeight: 1.65 },
  codeHighlight: {
    fontFamily: 'monospace', fontWeight: 700,
    background: '#fff5f5', padding: '1px 7px',
    borderRadius: 5, color: '#DC143C', fontSize: 13,
    border: '1px solid #fecdd3',
  },

  // State screen
  stateCard:     { background: '#fff', borderRadius: 20, padding: '48px 36px', textAlign: 'center', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' },
  stateIconWrap: { width: 60, height: 60, borderRadius: '50%', background: '#fff5f5', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' },
  stateTitle:    { fontSize: '1.1rem', fontWeight: 800, color: '#1f2937', letterSpacing: '-0.02em', marginBottom: 8 },
  stateText:     { fontSize: 13, color: '#6b7280', marginBottom: 22, lineHeight: 1.6 },
}