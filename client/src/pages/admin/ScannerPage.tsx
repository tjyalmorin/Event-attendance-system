import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEventByIdApi } from '../../api/events.api'
import { scanAgentCodeApi } from '../../api/scan.api'
import { Event, ScanResponse } from '../../types'

export default function ScannerPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [agentCode, setAgentCode] = useState('')
  const [result, setResult] = useState<ScanResponse | null>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getEventByIdApi(Number(eventId))
      .then(setEvent)
      .catch(console.error)
  }, [eventId])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleScan = async (code: string) => {
    if (!code.trim()) return
    setScanning(true)
    setError('')
    setResult(null)

    try {
      const data = await scanAgentCodeApi({
        agent_code: code.trim(),
        event_id: Number(eventId)
      })
      setResult(data)
      setAgentCode('')
      setTimeout(() => setResult(null), 4000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Scan failed')
      setAgentCode('')
      setTimeout(() => setError(''), 4000)
    } finally {
      setScanning(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleScan(agentCode)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(agentCode)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* Navbar */}
      <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/events/${eventId}`)}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-lg font-bold">Check-in Scanner</h1>
            {event && <p className="text-xs text-gray-400">{event.title}</p>}
          </div>
        </div>
        <div className={`text-xs px-3 py-1 rounded-full font-medium ${event?.status === 'open' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {event?.status?.toUpperCase() || 'LOADING...'}
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">

        {/* Input Box */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-6 text-center">
          <div className="text-6xl mb-4">🪪</div>
          <h2 className="text-xl font-semibold mb-2">Enter Agent Code</h2>
          <p className="text-gray-400 text-sm mb-6">
            Type the participant's agent code to check them in or out.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={agentCode}
              onChange={e => setAgentCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="e.g. AGT-00123"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg font-mono"
            />
            <button
              type="submit"
              disabled={scanning || !agentCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
            >
              {scanning ? 'Processing...' : 'Check In / Out'}
            </button>
          </form>
        </div>

        {/* Success Result */}
        {result && (
          <div className={`rounded-2xl p-6 text-center ${result.action === 'check_in' ? 'bg-green-600' : 'bg-blue-600'}`}>
            <div className="text-5xl mb-3">
              {result.action === 'check_in' ? '✅' : '👋'}
            </div>
            <h3 className="text-2xl font-bold mb-1">
              {result.action === 'check_in' ? 'CHECKED IN' : 'CHECKED OUT'}
            </h3>
            <p className="text-xl font-semibold mt-3">{result.participant.full_name}</p>
            <p className="text-sm opacity-80 mt-1">{result.participant.agent_code}</p>
            <p className="text-sm opacity-80">{result.participant.branch_name} — {result.participant.team_name}</p>
            <p className="text-xs opacity-60 mt-3">
              Time: {new Date(result.session.check_in_time).toLocaleTimeString('en-PH')}
            </p>
          </div>
        )}

        {/* Error Result */}
        {error && (
          <div className="bg-red-600 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">❌</div>
            <h3 className="text-2xl font-bold mb-2">DENIED</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        )}

        {/* Instructions */}
        {!result && !error && (
          <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-400 space-y-2">
            <p>💡 <strong className="text-gray-300">How it works:</strong></p>
            <p>• First entry = <span className="text-green-400">Check In</span></p>
            <p>• Second entry = <span className="text-blue-400">Check Out</span></p>
            <p>• After check-out = <span className="text-red-400">Blocked (1 session only)</span></p>
          </div>
        )}
      </div>
    </div>
  )
}