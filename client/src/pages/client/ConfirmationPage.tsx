import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Participant, Event } from '../../types'

interface LocationState {
  participant: Participant
  event: Event
}

export default function ConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState
  const [photoError, setPhotoError] = useState(false)

  if (!state?.participant) {
    return (
      <div style={s.fullPage}>
        <Styles />
        <div style={s.stateCard}>
          <div style={{ ...s.stateIcon, background: '#C8102E' }}>⚠️</div>
          <h2 style={s.stateTitle}>No Registration Found</h2>
          <p style={s.stateText}>Please register for the event first.</p>
          <button onClick={() => navigate(-1)} style={s.backBtn}>← Go Back</button>
        </div>
      </div>
    )
  }

  const { participant, event } = state

  const photoUrl = participant.photo_url
    ? participant.photo_url.startsWith('http')
      ? participant.photo_url
      : `http://localhost:5000${participant.photo_url}`
    : null

  const initials = participant.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={s.page}>
      <Styles />

      {/* ── Header ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoMark}>P</div>
            <div>
              <div style={s.logoName}>
                PRU<span style={{ color: '#C8102E' }}>LIFE</span> UK
              </div>
              <div style={s.logoSub}>Event Registration</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} style={s.homeBtn}>← Home</button>
        </div>
      </header>

      <div style={s.container}>

        {/* ── Success Banner ── */}
        <div className="fade-in d1" style={s.successBanner}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="pulse-ring" />
            <div className="checkmark" style={s.checkCircle}>✓</div>
          </div>
          <div>
            <div style={s.successTitle}>Registration Successful!</div>
            <div style={s.successSub}>You're all set — see you at the event.</div>
          </div>
        </div>

        {/* ── Agent Card ── */}
        <div className="fade-in d2" style={s.agentCard}>
          {/* Photo */}
          <div style={s.photoWrap}>
            {photoUrl && !photoError ? (
              <img
                src={photoUrl}
                alt={participant.full_name}
                style={s.photo}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div style={s.photoPlaceholder}>
                <span style={s.initials}>{initials}</span>
              </div>
            )}
            <div style={s.confirmedBadge}>
              <span style={s.confirmedDot} />
              Confirmed
            </div>
          </div>

          {/* Info */}
          <div style={s.agentInfo}>
            <div style={s.agentName}>{participant.full_name}</div>
            <div style={s.agentCodeRow}>
              <span style={s.agentCodeLabel}>AGENT CODE</span>
              <span style={s.agentCode}>{participant.agent_code}</span>
            </div>
            <div style={s.tagsRow}>
              <span style={s.tag}>{participant.branch_name}</span>
              <span style={s.tag}>{participant.team_name}</span>
            </div>
            <div style={s.regDate}>
              Registered {new Date(participant.registered_at).toLocaleString('en-PH', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* ── Event Details ── */}
        {event && (
          <div className="fade-in d3" style={s.eventCard}>
            <div style={s.eventCardHeader}>
              <div style={s.eventCardBadge}>EVENT DETAILS</div>
              <div style={s.eventTitle}>{event.title}</div>
            </div>
            <div style={s.eventGrid}>
              {[
                { icon: '📅', label: 'Date', val: new Date(event.event_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                { icon: '🕐', label: 'Time', val: `${event.start_time} — ${event.end_time}` },
                { icon: '📍', label: 'Venue', val: event.venue },
                { icon: '👥', label: 'Capacity', val: `${event.capacity} seats` },
              ].map(({ icon, label, val }) => (
                <div key={label} style={s.eventItem}>
                  <div style={s.eventItemIcon}>{icon}</div>
                  <div>
                    <div style={s.eventItemLabel}>{label}</div>
                    <div style={s.eventItemVal}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Check-in Instructions ── */}
        <div className="fade-in d4" style={s.instructionCard}>
          <div style={s.instructionHeader}>
            <span>⚠️</span> Check-in Instructions
          </div>
          <div style={s.instructionList}>
            {[
              <>Tell the staff your <strong>Agent Code</strong> at the entrance</>,
              <>Your code is: <span style={s.codeHighlight}>{participant.agent_code}</span></>,
              <>Staff will type it into the scanner to check you in</>,
              <>You get <strong>one check-in</strong> and <strong>one check-out</strong> per event</>,
            ].map((item, i) => (
              <div key={i} style={s.instructionItem}>
                <div style={s.instructionBullet}>{i + 1}</div>
                <div style={s.instructionText}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Back button ── */}
        <div className="fade-in d4" style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('/')} style={s.backBtnMain}>
            ← Back to Home
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────
function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
      *, *::before, *::after { box-sizing: border-box; }

      .fade-in { animation: pruFadeUp 0.55s ease forwards; opacity: 0; }
      .d1 { animation-delay: 0.05s; }
      .d2 { animation-delay: 0.18s; }
      .d3 { animation-delay: 0.32s; }
      .d4 { animation-delay: 0.46s; }

      @keyframes pruFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @keyframes popIn {
        0%   { transform: scale(0.4); opacity: 0; }
        70%  { transform: scale(1.1); }
        100% { transform: scale(1);   opacity: 1; }
      }
      .checkmark {
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.15s forwards;
        opacity: 0;
      }

      @keyframes pulseRing {
        0%   { transform: scale(0.85); opacity: 0.7; }
        100% { transform: scale(1.5);  opacity: 0; }
      }
      .pulse-ring {
        position: absolute; inset: -10px; border-radius: 50%;
        border: 2px solid rgba(34, 197, 94, 0.45);
        animation: pulseRing 1.6s ease-out 0.5s infinite;
      }
    `}</style>
  )
}

// ── Style map ─────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f0eae8',
    fontFamily: "'DM Sans', sans-serif",
  },
  fullPage: {
    minHeight: '100vh', background: '#f0eae8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },

  // Header
  header: { background: '#1a0a0a', borderBottom: '2px solid #2d1515' },
  headerInner: {
    maxWidth: 560, margin: '0 auto', padding: '15px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 11 },
  logoMark: {
    width: 36, height: 36,
    background: 'linear-gradient(135deg, #C8102E, #96281b)',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
  },
  logoName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em',
  },
  logoSub: { fontSize: 10, color: '#666', letterSpacing: '0.4px' },
  homeBtn: {
    background: 'none', border: '1px solid #3d2020',
    color: '#aaa', fontSize: 12, fontWeight: 500,
    padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'color 0.2s, border-color 0.2s',
  },

  container: {
    maxWidth: 560, margin: '0 auto',
    padding: '28px 20px 56px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },

  // Success banner
  successBanner: {
    background: 'linear-gradient(135deg, #052e16, #14532d)',
    border: '1px solid rgba(34,197,94,0.25)',
    borderRadius: 16, padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: 20,
    boxShadow: '0 4px 24px rgba(21,128,61,0.2)',
  },
  checkCircle: {
    width: 50, height: 50,
    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontSize: 22, fontWeight: 700,
    position: 'relative',
  },
  successTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: 4,
  },
  successSub: { fontSize: 12.5, color: '#86efac' },

  // Agent card
  agentCard: {
    background: '#fff', borderRadius: 18, padding: '24px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.07)', border: '1px solid #ede8e0',
    display: 'flex', alignItems: 'flex-start', gap: 20,
  },
  photoWrap: {
    flexShrink: 0, position: 'relative',
    width: 86, height: 86,
  },
  photo: {
    width: 86, height: 86, borderRadius: 14, objectFit: 'cover',
    border: '3px solid #f0e8e0', boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
  },
  photoPlaceholder: {
    width: 86, height: 86, borderRadius: 14,
    background: 'linear-gradient(135deg, #C8102E, #96281b)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(200,16,46,0.25)',
  },
  initials: {
    color: 'white', fontSize: 26, fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
  },
  confirmedBadge: {
    position: 'absolute', bottom: -8, left: '50%',
    transform: 'translateX(-50%)',
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    color: '#16a34a', fontSize: 9, fontWeight: 700,
    padding: '3px 8px', borderRadius: 20,
    display: 'flex', alignItems: 'center', gap: 4,
    whiteSpace: 'nowrap',
  },
  confirmedDot: { width: 5, height: 5, borderRadius: '50%', background: '#22c55e' },

  agentInfo: { flex: 1, minWidth: 0 },
  agentName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  agentCodeRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  },
  agentCodeLabel: {
    fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  agentCode: {
    fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
    color: '#C8102E', letterSpacing: '1.5px',
    background: '#fff5f5', padding: '2px 8px', borderRadius: 6,
    border: '1px solid #fdd',
  },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag: {
    background: '#f5f0ea', color: '#6b5b4e', fontSize: 11,
    fontWeight: 500, padding: '3px 9px', borderRadius: 20,
    border: '1px solid #e8ddd4',
  },
  regDate: { fontSize: 11, color: '#bbb' },

  // Event card
  eventCard: {
    background: '#fff', borderRadius: 18,
    boxShadow: '0 2px 20px rgba(0,0,0,0.07)', border: '1px solid #ede8e0',
    overflow: 'hidden',
  },
  eventCardHeader: {
    background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 100%)',
    padding: '20px 24px',
  },
  eventCardBadge: {
    display: 'inline-block',
    background: 'rgba(200,16,46,0.2)', color: '#e87c6e',
    fontSize: 9, fontWeight: 700, letterSpacing: '2px',
    padding: '3px 10px', borderRadius: 20, marginBottom: 8,
    border: '1px solid rgba(200,16,46,0.25)',
  },
  eventTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem', fontWeight: 700, color: '#fff', lineHeight: 1.3,
  },
  eventGrid: {
    padding: '18px 24px',
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
  },
  eventItem: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
  },
  eventItemIcon: {
    width: 30, height: 30, background: '#fdf8f6',
    borderRadius: 8, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 14, flexShrink: 0,
    border: '1px solid #f0e0da',
  },
  eventItemLabel: { fontSize: 10, color: '#bbb', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 },
  eventItemVal: { fontSize: 13, color: '#333', fontWeight: 500, lineHeight: 1.4 },

  // Instructions
  instructionCard: {
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 14, padding: '18px 20px',
  },
  instructionHeader: {
    fontSize: 12, fontWeight: 700, color: '#92400e',
    marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
  },
  instructionList: { display: 'flex', flexDirection: 'column', gap: 10 },
  instructionItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  instructionBullet: {
    width: 20, height: 20, borderRadius: '50%',
    background: '#C8102E', color: 'white',
    fontSize: 10, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  instructionText: { fontSize: 13, color: '#78350f', lineHeight: 1.5 },
  codeHighlight: {
    fontFamily: 'monospace', fontWeight: 700,
    background: '#fef3c7', padding: '1px 7px', borderRadius: 5,
    color: '#92400e', fontSize: 13,
    border: '1px solid #fde68a',
  },

  // Back button
  backBtnMain: {
    background: 'none', border: '1.5px solid #e0d0cc',
    color: '#888', fontSize: 13, fontWeight: 500,
    padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s, color 0.2s',
  },

  // State screens
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
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.2rem', fontWeight: 700, color: '#1a1a1a', marginBottom: 8,
  },
  stateText: { fontSize: 13, color: '#888', marginBottom: 20 },
  backBtn: {
    background: 'none', border: 'none', color: '#C8102E',
    fontSize: 13, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
  },
}