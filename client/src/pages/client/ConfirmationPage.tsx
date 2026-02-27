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
      <div style={styles.fullPage}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>⚠️</div>
          <h2 style={styles.errorTitle}>No Registration Found</h2>
          <p style={styles.errorText}>Please register first.</p>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>← Go Back</button>
        </div>
      </div>
    )
  }

  const { participant, event } = state

  // Smart URL handler — Cloudinary URLs are already full https:// URLs
  const photoUrl = participant.photo_url
    ? participant.photo_url.startsWith('http')
      ? participant.photo_url
      : `http://localhost:5000${participant.photo_url}`
    : null

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .fade-in {
          animation: fadeUp 0.6s ease forwards;
          opacity: 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.25s; }
        .delay-3 { animation-delay: 0.4s; }
        .delay-4 { animation-delay: 0.55s; }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .checkmark {
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s forwards;
          opacity: 0;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px solid rgba(34,197,94,0.4);
          animation: pulse-ring 1.5s ease-out 0.6s infinite;
        }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoMark}>P</div>
            <div>
              <div style={styles.logoName}>PRU LIFE UK</div>
              <div style={styles.logoSub}>Event Registration</div>
            </div>
          </div>
        </div>
      </header>

      <div style={styles.container}>

        {/* Success Badge */}
        <div className="fade-in delay-1" style={styles.successBanner}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div className="pulse-ring" />
            <div className="checkmark" style={styles.checkCircle}>✓</div>
          </div>
          <div>
            <div style={styles.successTitle}>Registration Successful!</div>
            <div style={styles.successSub}>You're all set for the event.</div>
          </div>
        </div>

        {/* Agent Photo Card */}
        <div className="fade-in delay-2" style={styles.photoCard}>
          {/* Photo */}
          <div style={styles.photoWrapper}>
            {photoUrl && !photoError ? (
              <img
                src={photoUrl}
                alt={participant.full_name}
                style={styles.photo}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <div style={styles.photoPlaceholder}>
                <span style={styles.photoInitials}>
                  {participant.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Agent Info */}
          <div style={styles.agentInfo}>
            <div style={styles.agentName}>{participant.full_name}</div>
            <div style={styles.agentCode}>{participant.agent_code}</div>
            <div style={styles.agentMeta}>
              <span style={styles.tag}>{participant.branch_name}</span>
              <span style={styles.tag}>{participant.team_name}</span>
            </div>
            <div style={styles.statusBadge}>
              <span style={styles.statusDot} />
              Confirmed
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="fade-in delay-3" style={styles.detailsCard}>
          <div style={styles.detailsHeader}>Registration Details</div>
          <div style={styles.detailItem}>
            <div style={styles.detailLabel}>Registered At</div>
            <div style={styles.detailValue}>
              {new Date(participant.registered_at).toLocaleString('en-PH')}
            </div>
          </div>

          {event && (
            <>
              <div style={{ ...styles.detailsHeader, marginTop: 20 }}>Event Details</div>
              <div style={styles.eventInfoList}>
                <div style={styles.eventInfoItem}>
                  <span>📌</span>
                  <span>{event.title}</span>
                </div>
                <div style={styles.eventInfoItem}>
                  <span>📅</span>
                  <span>{new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style={styles.eventInfoItem}>
                  <span>🕐</span>
                  <span>{event.start_time} — {event.end_time}</span>
                </div>
                <div style={styles.eventInfoItem}>
                  <span>📍</span>
                  <span>{event.venue}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Check-in Notice */}
        <div className="fade-in delay-4" style={styles.notice}>
          <div style={styles.noticeTitle}>⚠️ Check-in Instructions</div>
          <ul style={styles.noticeList}>
            <li>Tell the staff your <strong>Agent Code</strong> at the entrance</li>
            <li>Your code is: <strong style={styles.codeHighlight}>{participant.agent_code}</strong></li>
            <li>Staff will type it into the scanner to check you in</li>
            <li>You get <strong>one check-in and one check-out</strong> per event</li>
          </ul>
        </div>

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8f5f0',
    fontFamily: "'DM Sans', sans-serif",
  },
  fullPage: {
    minHeight: '100vh',
    background: '#f8f5f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  errorCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    textAlign: 'center',
    maxWidth: 360,
  },
  errorIcon: { fontSize: 40, marginBottom: 16 },
  errorTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorText: { fontSize: 14, color: '#888', marginBottom: 20 },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#c0392b',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
  },
  header: {
    background: '#1a0a0a',
    borderBottom: '1px solid #2d1515',
  },
  headerInner: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '16px 24px',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 36,
    height: 36,
    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
  },
  logoName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '1.5px',
  },
  logoSub: { color: '#888', fontSize: 11, letterSpacing: '0.5px' },
  container: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '28px 20px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  successBanner: {
    background: 'linear-gradient(135deg, #052e16, #14532d)',
    border: '1px solid #166534',
    borderRadius: 16,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  checkCircle: {
    width: 48,
    height: 48,
    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 22,
    fontWeight: 700,
    flexShrink: 0,
    position: 'relative',
  },
  successTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 4,
  },
  successSub: { fontSize: 13, color: '#86efac' },
  photoCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '24px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
    border: '1px solid #ede8e0',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  photoWrapper: {
    flexShrink: 0,
    width: 90,
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    border: '3px solid #f0e8e0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #c0392b, #96281b)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitials: {
    color: 'white',
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "'Playfair Display', serif",
  },
  agentInfo: { flex: 1, minWidth: 0 },
  agentName: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  agentCode: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#c0392b',
    fontWeight: 600,
    marginBottom: 8,
    letterSpacing: '1px',
  },
  agentMeta: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    background: '#f5f0ea',
    color: '#6b5b4e',
    fontSize: 11,
    fontWeight: 500,
    padding: '3px 8px',
    borderRadius: 20,
    border: '1px solid #e8ddd4',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    background: '#22c55e',
    borderRadius: '50%',
  },
  detailsCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '20px 24px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
    border: '1px solid #ede8e0',
  },
  detailsHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: '#999',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailItem: { marginBottom: 8 },
  detailLabel: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  detailValue: { fontSize: 14, color: '#333', fontWeight: 500 },
  eventInfoList: { display: 'flex', flexDirection: 'column', gap: 8 },
  eventInfoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 13,
    color: '#555',
    lineHeight: 1.4,
  },
  notice: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 12,
    padding: '16px 20px',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#92400e',
    marginBottom: 10,
  },
  noticeList: {
    paddingLeft: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 13,
    color: '#78350f',
    lineHeight: 1.5,
  },
  codeHighlight: {
    fontFamily: 'monospace',
    background: '#fef3c7',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 13,
  },
}