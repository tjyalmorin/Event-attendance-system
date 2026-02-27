import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { registerParticipantApi } from '../../api/participants.api'
import { Event } from '../../types'

export default function RegistrationPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    agent_code: '',
    full_name: '',
    branch_name: '',
    team_name: ''
  })

  useEffect(() => {
    getEventByIdApi(Number(eventId))
      .then(setEvent)
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false))
  }, [eventId])

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
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={styles.fullPage}>
      <div style={styles.loadingSpinner} />
    </div>
  )

  if (!event) return (
    <div style={styles.fullPage}>
      <div style={styles.errorCard}>
        <div style={styles.errorIcon}>✕</div>
        <h2 style={styles.errorTitle}>Event Not Found</h2>
        <p style={styles.errorText}>This event link may be invalid or expired.</p>
      </div>
    </div>
  )

  if (event.status !== 'open') return (
    <div style={styles.fullPage}>
      <div style={styles.errorCard}>
        <div style={{ ...styles.errorIcon, background: '#92400e' }}>🔒</div>
        <h2 style={styles.errorTitle}>Registration Closed</h2>
        <p style={styles.errorText}>This event is not accepting registrations right now.</p>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8f5f0; }

        .reg-input {
          width: 100%;
          border: 1.5px solid #e2d9ce;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          background: #fdfbf8;
          color: #1a1a1a;
          transition: all 0.2s;
          outline: none;
        }
        .reg-input:focus {
          border-color: #c0392b;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(192,57,43,0.08);
        }
        .reg-input::placeholder { color: #bbb; }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #c0392b 0%, #96281b 100%);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 14px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(192,57,43,0.35);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .fade-in {
          animation: fadeUp 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
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

        {/* Event Card */}
        <div className="fade-in delay-1" style={styles.eventCard}>
          <div style={styles.eventBadge}>UPCOMING EVENT</div>
          <h2 style={styles.eventTitle}>{event.title}</h2>
          <div style={styles.eventMeta}>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>📅</span>
              <span>{new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>🕐</span>
              <span>{event.start_time} — {event.end_time}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>📍</span>
              <span>{event.venue}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaIcon}>👥</span>
              <span>Capacity: {event.capacity} seats</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="fade-in delay-2" style={styles.formCard}>
          <h3 style={styles.formTitle}>Your Information</h3>
          <p style={styles.formSubtitle}>Please fill in your details to complete registration.</p>

          {error && (
            <div style={styles.errorBanner}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {[
              { name: 'agent_code', label: 'Agent Code', placeholder: 'e.g. 12345678' },
              { name: 'full_name', label: 'Full Name', placeholder: 'e.g. Maria Santos' },
              { name: 'branch_name', label: 'Branch Name', placeholder: 'e.g. Makati Branch' },
              { name: 'team_name', label: 'Team Name', placeholder: 'e.g. Team Alpha' },
            ].map((field) => (
              <div key={field.name} style={styles.fieldGroup}>
                <label style={styles.label}>{field.label}</label>
                <input
                  className="reg-input"
                  name={field.name}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  required
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <button type="submit" disabled={submitting} className="submit-btn" style={{ marginTop: '8px' }}>
              {submitting ? 'Registering...' : 'Register Now →'}
            </button>
          </form>
        </div>

        {/* Notice */}
        <div className="fade-in delay-3" style={styles.notice}>
          <span style={styles.noticeIcon}>ℹ️</span>
          <p style={styles.noticeText}>
            Your <strong>Agent Code</strong> will be used for check-in at the event. Please remember it.
          </p>
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
  loadingSpinner: {
    width: 40,
    height: 40,
    border: '3px solid #e2d9ce',
    borderTop: '3px solid #c0392b',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    textAlign: 'center',
    maxWidth: 360,
  },
  errorIcon: {
    width: 56,
    height: 56,
    background: '#c0392b',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    margin: '0 auto 16px',
    color: 'white',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 8,
    fontFamily: "'Playfair Display', serif",
  },
  errorText: {
    fontSize: 14,
    color: '#888',
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
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
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
    fontFamily: "'DM Sans', sans-serif",
  },
  logoSub: {
    color: '#888',
    fontSize: 11,
    letterSpacing: '0.5px',
  },
  container: {
    maxWidth: 520,
    margin: '0 auto',
    padding: '32px 20px 48px',
  },
  eventCard: {
    background: 'linear-gradient(135deg, #1a0a0a 0%, #2d1515 100%)',
    borderRadius: 16,
    padding: '28px 28px 24px',
    marginBottom: 20,
    border: '1px solid #3d1f1f',
  },
  eventBadge: {
    display: 'inline-block',
    background: 'rgba(192,57,43,0.25)',
    color: '#e87c6e',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '2px',
    padding: '4px 10px',
    borderRadius: 20,
    marginBottom: 12,
    border: '1px solid rgba(192,57,43,0.3)',
  },
  eventTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 16,
    lineHeight: 1.3,
  },
  eventMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#c4a99a',
    fontSize: 13,
  },
  metaIcon: {
    fontSize: 14,
    width: 20,
    flexShrink: 0,
  },
  formCard: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px',
    marginBottom: 16,
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
    border: '1px solid #ede8e0',
  },
  formTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
  },
  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#444',
    letterSpacing: '0.2px',
  },
  notice: {
    background: '#fef9f0',
    border: '1px solid #f0dfc0',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  noticeIcon: {
    fontSize: 16,
    flexShrink: 0,
    marginTop: 1,
  },
  noticeText: {
    fontSize: 13,
    color: '#7a5c2e',
    lineHeight: 1.5,
  },
}