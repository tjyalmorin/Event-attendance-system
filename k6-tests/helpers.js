// ─────────────────────────────────────────────────────────────
//  helpers.js — shared utilities for all PrimeLog k6 tests
// ─────────────────────────────────────────────────────────────
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'

// ── Base URL ───────────────────────────────────────────────────
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000/api'

// ── Admin credentials (from migration seed) ────────────────────
export const ADMIN_EMAIL    = __ENV.ADMIN_EMAIL    || 'kurtrusselgliponeo@gmail.com'
export const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || 'Admin@1234'

// ── Custom metrics ─────────────────────────────────────────────
export const loginDuration       = new Trend('login_duration',       true)
export const eventsDuration      = new Trend('events_duration',      true)
export const participantDuration = new Trend('participant_duration',  true)
export const scanDuration        = new Trend('scan_duration',        true)
export const errorRate           = new Rate('error_rate')
export const requestCount        = new Counter('request_count')

// ── Default headers ────────────────────────────────────────────
export const jsonHeaders = { 'Content-Type': 'application/json' }

export const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
})

// ── Login and return token ─────────────────────────────────────
export function login(email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: jsonHeaders, tags: { name: 'auth_login' } }
  )

  loginDuration.add(res.timings.duration)
  requestCount.add(1)

  const ok = check(res, {
    'login: status is 200': (r) => r.status === 200,
    'login: has token':     (r) => {
      try { return !!JSON.parse(r.body).token } catch { return false }
    },
  })

  errorRate.add(!ok)

  if (res.status !== 200) return null

  try {
    return JSON.parse(res.body).token
  } catch {
    return null
  }
}

// ── Get first available event ID ───────────────────────────────
export function getFirstEventId(token) {
  const res = http.get(
    `${BASE_URL}/events`,
    { headers: authHeaders(token), tags: { name: 'events_list' } }
  )

  requestCount.add(1)

  try {
    const events = JSON.parse(res.body)
    if (!Array.isArray(events) || events.length === 0) return null

    const now = Date.now()

    // Priority 1: open event with no registration window (always accepts)
    const noWindow = events.find(e =>
      e.status === 'open' && !e.registration_start && !e.registration_end
    )
    if (noWindow) return noWindow.event_id

    // Priority 2: open event whose registration window is currently active
    const active = events.find(e => {
      if (e.status !== 'open') return false
      if (!e.registration_start || !e.registration_end) return false
      const start = new Date(e.registration_start).getTime()
      const end   = new Date(e.registration_end).getTime()
      return now >= start && now <= end
    })
    if (active) return active.event_id

    // Fallback: any open event (scan/lookup still works even if reg is closed)
    const anyOpen = events.find(e => e.status === 'open')
    if (anyOpen) return anyOpen.event_id

    // Last resort: first event
    return events[0].event_id
  } catch { /* fall through */ }

  return null
}

// ── Generate unique agent code per VU + iteration ─────────────
// Uses timestamp + VU + ITER to guarantee uniqueness even across
// long soak runs where ITER exceeds 999 and the old slice caused collisions.
export function uniqueAgentCode() {
  // Last 4 digits of epoch ms + VU (2 digits) + ITER mod 100 (2 digits)
  // = always exactly 8 digits, unique within any test run
  const ts   = String(Date.now()).slice(-4)
  const vu   = String(__VU   % 100).padStart(2, '0')
  const iter = String(__ITER % 100).padStart(2, '0')
  return `${ts}${vu}${iter}`
}

// ── Unique full name ───────────────────────────────────────────
export function uniqueName() {
  return `K6 User ${__VU}-${__ITER}-${Date.now()}`
}

// ── Sleep helpers ──────────────────────────────────────────────
export const think   = () => sleep(1 + Math.random() * 2)   // 1–3s realistic think time
export const quickly = () => sleep(0.1 + Math.random() * 0.4) // 0.1–0.5s fast action

// ── Check helper that also records error rate ──────────────────
export function checkedRequest(res, checks, tag) {
  requestCount.add(1)
  const ok = check(res, checks)
  errorRate.add(!ok)
  return ok
}