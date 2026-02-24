import { useLocation, useNavigate } from 'react-router-dom'
import { Participant, Event } from '../../types'

interface LocationState {
  participant: Participant
  event: Event
}

export default function ConfirmationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  if (!state?.participant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Registration Found</h2>
          <p className="text-gray-500 text-sm mb-4">Please register first.</p>
          <button onClick={() => navigate(-1)} className="text-blue-600 text-sm hover:underline">
            ← Go Back
          </button>
        </div>
      </div>
    )
  }

  const { participant, event } = state

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 text-center">
        <h1 className="text-lg font-bold text-gray-800">PRU LIFE UK</h1>
        <p className="text-xs text-gray-500">Event Registration</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">

        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <h2 className="text-lg font-bold text-green-700">Registration Successful!</h2>
          <p className="text-sm text-green-600 mt-1">
            You are now registered for this event.
          </p>
        </div>

        {/* Participant Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Your Registration Details</h3>
          <div className="space-y-3">

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Agent Code</span>
              <span className="font-bold text-blue-600 text-lg font-mono">{participant.agent_code}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Full Name</span>
              <span className="font-medium text-gray-800">{participant.full_name}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Branch</span>
              <span className="font-medium text-gray-800">{participant.branch_name}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Team</span>
              <span className="font-medium text-gray-800">{participant.team_name}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Status</span>
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                {participant.registration_status}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Registered At</span>
              <span className="text-sm text-gray-600">
                {new Date(participant.registered_at).toLocaleString('en-PH')}
              </span>
            </div>
          </div>
        </div>

        {/* Event Details */}
        {event && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Event Details</h3>
            <div className="space-y-1 text-sm text-gray-500">
              <p>📌 {event.title}</p>
              <p>📅 {new Date(event.event_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p>🕐 {event.start_time} — {event.end_time}</p>
              <p>📍 {event.venue}</p>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
          <p className="font-semibold mb-2">⚠️ Important — Check-in Instructions</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>Tell the staff your <strong>Agent Code</strong> at the entrance.</li>
            <li>Your agent code is: <strong className="font-mono">{participant.agent_code}</strong></li>
            <li>Staff will type it into the system to check you in.</li>
            <li>You get <strong>one check-in and one check-out</strong> per event.</li>
          </ul>
        </div>

      </div>
    </div>
  )
}