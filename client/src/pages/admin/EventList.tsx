import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllEventsApi, createEventApi, updateEventApi, deleteEventApi } from '../../api/events.api'
import { Event, CreateEventPayload } from '../../types'

export default function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateEventPayload>({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    registration_start: '',
    registration_end: '',
    venue: '',
    capacity: 0,
    checkin_cutoff: ''
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await getAllEventsApi()
      setEvents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const newEvent = await createEventApi({ ...form, capacity: Number(form.capacity) })
      setEvents([newEvent, ...events])
      setShowForm(false)
      setForm({
        title: '', description: '', event_date: '', start_time: '',
        end_time: '', registration_start: '', registration_end: '',
        venue: '', capacity: 0, checkin_cutoff: ''
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (event_id: number, status: string, event: Event) => {
    try {
      const updated = await updateEventApi(event_id, {
        title: event.title,
        description: event.description,
        event_date: event.event_date,
        start_time: event.start_time,
        end_time: event.end_time,
        venue: event.venue,
        capacity: event.capacity,
        checkin_cutoff: event.checkin_cutoff,
        status
      })
      setEvents(events.map(e => e.event_id === event_id ? updated : e))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleDelete = async (event_id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await deleteEventApi(event_id)
      setEvents(events.filter(e => e.event_id !== event_id))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete event')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'closed': return 'bg-red-100 text-red-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-800">Manage Events</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
        >
          + Create Event
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Create Event Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Create New Event</h3>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input name="title" value={form.title} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                <input type="date" name="event_date" value={form.event_date} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                <input name="venue" value={form.venue} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="time" name="end_time" value={form.end_time} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Start</label>
                <input type="datetime-local" name="registration_start" value={form.registration_start} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration End</label>
                <input type="datetime-local" name="registration_end" value={form.registration_end} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} required min={1}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Cutoff Time</label>
                <input type="time" name="checkin_cutoff" value={form.checkin_cutoff} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No events yet. Create one above!</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Event</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Venue</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Capacity</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map(event => (
                  <tr key={event.event_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{event.description?.slice(0, 50)}...</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(event.event_date).toLocaleDateString('en-PH')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{event.venue}</td>
                    <td className="px-4 py-3 text-gray-600">{event.capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                        {event.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/admin/events/${event.event_id}`)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </button>
                        {event.status === 'draft' && (
                          <button
                            onClick={() => handleStatusChange(event.event_id, 'open', event)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Open
                          </button>
                        )}
                        {event.status === 'open' && (
                          <button
                            onClick={() => handleStatusChange(event.event_id, 'closed', event)}
                            className="text-xs text-yellow-600 hover:underline"
                          >
                            Close
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(event.event_id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}