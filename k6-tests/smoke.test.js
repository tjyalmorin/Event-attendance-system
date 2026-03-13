// ─────────────────────────────────────────────────────────────
//  smoke.test.js — PrimeLog Smoke Test
//
//  Purpose : Verify the server is alive and all endpoints
//            respond correctly with a single user.
//
//  Run     : k6 run smoke.test.js
//  Duration: ~30 seconds
//  VUs     : 1
// ─────────────────────────────────────────────────────────────
import http from 'k6/http'
import { check, sleep } from 'k6'
import {
  BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD,
  jsonHeaders, authHeaders,
  login, getFirstEventId, uniqueAgentCode, uniqueName,
  loginDuration, eventsDuration, participantDuration, scanDuration,
  errorRate, requestCount,
} from './helpers.js'

http.setResponseCallback(http.expectedStatuses(
  200, 201, 204, 400, 401, 403, 404, 409, 429
))


export const options = {
  vus:      1,
  duration: '30s',

  thresholds: {
    http_req_failed:      ['rate<0.01'],     // <1% errors
    http_req_duration:    ['p(95)<3000'],    // 95% of requests under 3s
    error_rate:           ['rate<0.01'],
  },
}

export default function () {

  // ── 1. Health check ─────────────────────────────────────────
  {
    const res = http.get(`${BASE_URL}/health`, {
      tags: { name: 'health_check' }
    })
    requestCount.add(1)
    check(res, {
      'health: status 200':       (r) => r.status === 200,
      'health: db connected':     (r) => {
        try { return JSON.parse(r.body).services.database.status === 'connected' } catch { return false }
      },
    })
    sleep(0.5)
  }

  // ── 2. Login ─────────────────────────────────────────────────
  const token = login()
  if (!token) {
    console.error('❌ Login failed — stopping iteration')
    return
  }
  sleep(0.5)

  // ── 3. Get current user (getMe) ──────────────────────────────
  {
    const res = http.get(`${BASE_URL}/auth/me`, {
      headers: authHeaders(token),
      tags: { name: 'auth_me' }
    })
    requestCount.add(1)
    check(res, {
      'getMe: status 200':     (r) => r.status === 200,
      'getMe: has user_id':    (r) => {
        try { return !!JSON.parse(r.body).user_id } catch { return false }
      },
    })
    sleep(0.5)
  }

  // ── 4. Get events list ───────────────────────────────────────
  {
    const res = http.get(`${BASE_URL}/events`, {
      headers: authHeaders(token),
      tags: { name: 'events_list' }
    })
    requestCount.add(1)
    eventsDuration.add(res.timings.duration)
    check(res, {
      'events list: status 200':  (r) => r.status === 200,
      'events list: is array':    (r) => {
        try { return Array.isArray(JSON.parse(r.body)) } catch { return false }
      },
    })
    sleep(0.5)
  }

  // ── 5. Get single event ──────────────────────────────────────
  const eventId = getFirstEventId(token)
  if (eventId) {
    const res = http.get(`${BASE_URL}/events/${eventId}`, {
      headers: authHeaders(token),
      tags: { name: 'events_single' }
    })
    requestCount.add(1)
    eventsDuration.add(res.timings.duration)
    check(res, {
      'event single: status 200':    (r) => r.status === 200,
      'event single: has event_id':  (r) => {
        try { return !!JSON.parse(r.body).event_id } catch { return false }
      },
    })
    sleep(0.5)
  }

  // ── 6. Get participants for event ────────────────────────────
  if (eventId) {
    const res = http.get(`${BASE_URL}/participants/event/${eventId}`, {
      headers: authHeaders(token),
      tags: { name: 'participants_list' }
    })
    requestCount.add(1)
    participantDuration.add(res.timings.duration)
    check(res, {
      'participants: status 200':  (r) => r.status === 200,
      'participants: is array':    (r) => {
        try { return Array.isArray(JSON.parse(r.body)) } catch { return false }
      },
    })
    sleep(0.5)
  }

  // ── 7. Register a participant (public endpoint) ──────────────
  if (eventId) {
    const payload = {
      agent_code:  uniqueAgentCode(),
      full_name:   uniqueName(),
      branch_name: 'A1 Prime',
      team_name:   'Team Norj',
      agent_type:  'Agent',
    }
    const res = http.post(
      `${BASE_URL}/participants/register/${eventId}`,
      JSON.stringify(payload),
      { headers: jsonHeaders, tags: { name: 'participant_register' } }
    )
    requestCount.add(1)
    participantDuration.add(res.timings.duration)
    check(res, {
      'register: status 201 or 409': (r) => r.status === 201 || r.status === 409,
    })

    // ── 8. Lookup the participant we just registered ──────────
    if (res.status === 201) {
      sleep(0.3)
      const agentCode = payload.agent_code

      const lookupRes = http.post(
        `${BASE_URL}/attendance/lookup`,
        JSON.stringify({ query: agentCode, event_id: eventId }),
        { headers: authHeaders(token), tags: { name: 'scan_lookup' } }
      )
      requestCount.add(1)
      scanDuration.add(lookupRes.timings.duration)
      check(lookupRes, {
        'lookup: status 200':        (r) => r.status === 200,
        'lookup: found participant':  (r) => {
          try {
            const body = JSON.parse(r.body)
            return body.participant || body.participants
          } catch { return false }
        },
      })
    }
    sleep(0.5)
  }

  // ── 9. Get branches (used by registration form) ───────────────
  {
    const res = http.get(`${BASE_URL}/branches`, {
      headers: authHeaders(token),
      tags: { name: 'branches_list' }
    })
    requestCount.add(1)
    check(res, {
      'branches: status 200':  (r) => r.status === 200,
      'branches: is array':    (r) => {
        try { return Array.isArray(JSON.parse(r.body)) } catch { return false }
      },
    })
    sleep(0.5)
  }

  // ── 10. Scan sessions for event ──────────────────────────────
  if (eventId) {
    const res = http.get(`${BASE_URL}/attendance/sessions/${eventId}`, {
      headers: authHeaders(token),
      tags: { name: 'scan_sessions' }
    })
    requestCount.add(1)
    scanDuration.add(res.timings.duration)
    check(res, {
      'sessions: status 200':  (r) => r.status === 200,
      'sessions: is array':    (r) => {
        try { return Array.isArray(JSON.parse(r.body)) } catch { return false }
      },
    })
  }

  sleep(1)
}

export function handleSummary(data) {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   PrimeLog — Smoke Test Summary  ║')
  console.log('╚══════════════════════════════════╝')
  console.log(`Total requests    : ${data.metrics.request_count?.values?.count ?? 'N/A'}`)
  console.log(`Error rate        : ${((data.metrics.error_rate?.values?.rate ?? 0) * 100).toFixed(2)}%`)
  console.log(`Avg response time : ${data.metrics.http_req_duration?.values?.avg?.toFixed(0) ?? 'N/A'}ms`)
  console.log(`p95 response time : ${data.metrics.http_req_duration?.values['p(95)']?.toFixed(0) ?? 'N/A'}ms`)
  return {}
}

