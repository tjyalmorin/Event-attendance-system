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
      navigate('/confirmation', {
        state: {
          participant: data.participant,
          event
        }
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading event...</p>
    </div>
  )

  if (!event) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-500">Event not found.</p>
    </div>
  )

  if (event.status !== 'open') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl mb-4">🚫</p>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Registration Closed</h2>
        <p className="text-gray-500 text-sm">This event is not accepting registrations right now.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 text-center">
        <h1 className="text-lg font-bold text-gray-800">PRU LIFE UK</h1>
        <p className="text-xs text-gray-500">Event Registration</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">{event.title}</h2>
          <div className="space-y-1 text-sm text-gray-500">
            <p>📅 {new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>🕐 {event.start_time} — {event.end_time}</p>
            <p>📍 {event.venue}</p>
            <p>👥 Capacity: {event.capacity}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Your Information</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Code</label>
              <input
                name="agent_code"
                value={form.agent_code}
                onChange={handleChange}
                required
                placeholder="e.g. AGT-00123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="e.g. Maria Santos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
              <input
                name="branch_name"
                value={form.branch_name}
                onChange={handleChange}
                required
                placeholder="e.g. Makati Branch"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
              <input
                name="team_name"
                value={form.team_name}
                onChange={handleChange}
                required
                placeholder="e.g. Team A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}