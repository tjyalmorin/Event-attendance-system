// ─────────────────────────────────────────────────────────────
//  load.test.js — PrimeLog Load Test
//
//  Purpose : Simulate a normal event day — multiple staff
//            scanning participants concurrently while admin
//            monitors the dashboard.
//
//  Run     : k6 run load.test.js
//  Duration: ~5 minutes
//  VUs     : ramps up to 20
//
//  Scenario breakdown (mirrors real event day):
//    - 60% Scanner VUs  → lookup + scan check-in/out
//    - 30% Viewer VUs   → events list + participants list
//    - 10% Admin VUs    → sessions + scan logs
// ─────────────────────────────────────────────────────────────
import http from 'k6/http'
import { check, sleep } from 'k6'
import {
  BASE_URL,
  jsonHeaders, authHeaders,
  login, getFirstEventId, uniqueAgentCode, uniqueName,
  loginDuration, eventsDuration, participantDuration, scanDuration,
  errorRate, requestCount,
} from './helpers.js'

http.setResponseCallback(http.expectedStatuses(
  200, 201, 204, 400, 401, 403, 404, 409, 429
))

export const options = {
  scenarios: {

    // ── Scanners: staff doing check-ins (heaviest load) ────────
    scanners: {
      executor:          'ramping-vus',
      startVUs:          0,
      stages: [
        { duration: '30s', target: 12 },  // ramp up
        { duration: '3m',  target: 12 },  // sustained load
        { duration: '30s', target: 0  },  // ramp down
      ],
      gracefulRampDown:  '10s',
      exec:              'scannerFlow',
    },

    // ── Viewers: admin watching dashboard ─────────────────────
    viewers: {
      executor:          'ramping-vus',
      startVUs:          0,
      stages: [
        { duration: '30s', target: 6 },
        { duration: '3m',  target: 6 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown:  '10s',
      exec:              'viewerFlow',
    },

    // ── Admin: monitoring sessions and logs ───────────────────
    admin: {
      executor:          'ramping-vus',
      startVUs:          0,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '3m',  target: 2 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown:  '10s',
      exec:              'adminFlow',
    },
  },

  thresholds: {
    http_req_failed:                   ['rate<0.02'],    // <2% request failures
    http_req_duration:                 ['p(95)<2000'],   // 95% under 2s
    'http_req_duration{name:scan_lookup}':  ['p(95)<1500'],
    'http_req_duration{name:auth_login}':   ['p(95)<2000'],
    'http_req_duration{name:events_list}':  ['p(95)<2000'],
    error_rate:                        ['rate<0.02'],
  },
}

// ── setup(): runs ONCE before all VUs — login once, share token ──
export function setup() {
  const token   = login()
  const eventId = token ? getFirstEventId(token) : null
  return { token, eventId }
}

// ── Scenario A: Scanner flow ───────────────────────────────────
// Mimics a staff member at the event entrance
export function scannerFlow(data) {
  const { token, eventId } = data
  if (!token || !eventId) { sleep(2); return }

  // Step 1: Register a new participant (public endpoint)
  const agentCode = uniqueAgentCode()
  const regRes = http.post(
    `${BASE_URL}/participants/register/${eventId}`,
    JSON.stringify({
      agent_code:  agentCode,
      full_name:   uniqueName(),
      branch_name: 'A1 Prime',
      team_name:   'Team Norj',
      agent_type:  'Agent',
    }),
    { headers: jsonHeaders, tags: { name: 'participant_register' } }
  )
  requestCount.add(1)
  participantDuration.add(regRes.timings.duration)
  const registered = check(regRes, {
    'register: 201 or 409': (r) => r.status === 201 || r.status === 409,
  })
  errorRate.add(!registered)

  sleep(0.5)

  // Step 2: Lookup the agent at the scanner
  const lookupRes = http.post(
    `${BASE_URL}/attendance/lookup`,
    JSON.stringify({ query: agentCode, event_id: eventId }),
    { headers: authHeaders(token), tags: { name: 'scan_lookup' } }
  )
  requestCount.add(1)
  scanDuration.add(lookupRes.timings.duration)
  const found = check(lookupRes, {
    'lookup: status 200': (r) => r.status === 200,
  })
  errorRate.add(!found)

  sleep(0.3)

  // Step 3: Perform check-in scan
  if (found) {
    const scanRes = http.post(
      `${BASE_URL}/attendance/scan`,
      JSON.stringify({ agent_code: agentCode, event_id: eventId }),
      { headers: authHeaders(token), tags: { name: 'scan_checkin' } }
    )
    requestCount.add(1)
    scanDuration.add(scanRes.timings.duration)
    const scanned = check(scanRes, {
      'check-in: 200 or 400': (r) => r.status === 200 || r.status === 400,
    })
    errorRate.add(!scanned)
  }

  // Realistic think time between participants
  sleep(1 + Math.random() * 2)
}

// ── Scenario B: Viewer flow ────────────────────────────────────
// Mimics admin refreshing the event dashboard every 30 seconds
export function viewerFlow(data) {
  const { token, eventId } = data
  if (!token) { sleep(5); return }

  // View events list
  const eventsRes = http.get(`${BASE_URL}/events`, {
    headers: authHeaders(token),
    tags: { name: 'events_list' }
  })
  requestCount.add(1)
  eventsDuration.add(eventsRes.timings.duration)
  check(eventsRes, { 'events list: 200': (r) => r.status === 200 })

  sleep(1)

  // View participants for current event
  if (eventId) {
    const partRes = http.get(`${BASE_URL}/participants/event/${eventId}`, {
      headers: authHeaders(token),
      tags: { name: 'participants_list' }
    })
    requestCount.add(1)
    participantDuration.add(partRes.timings.duration)
    check(partRes, { 'participants: 200': (r) => r.status === 200 })
  }

  sleep(1)

  // View branches (dropdown refresh)
  const branchRes = http.get(`${BASE_URL}/branches`, {
    headers: authHeaders(token),
    tags: { name: 'branches_list' }
  })
  requestCount.add(1)
  check(branchRes, { 'branches: 200': (r) => r.status === 200 })

  // Simulate dashboard auto-refresh cadence (30s interval, scaled down)
  sleep(5 + Math.random() * 5)
}

// ── Scenario C: Admin flow ─────────────────────────────────────
// Mimics admin checking sessions and scan logs
export function adminFlow(data) {
  const { token, eventId } = data
  if (!token || !eventId) { sleep(5); return }

  // View attendance sessions
  const sessRes = http.get(`${BASE_URL}/attendance/sessions/${eventId}`, {
    headers: authHeaders(token),
    tags: { name: 'scan_sessions' }
  })
  requestCount.add(1)
  scanDuration.add(sessRes.timings.duration)
  check(sessRes, { 'sessions: 200': (r) => r.status === 200 })

  sleep(1)

  // View scan logs
  const logsRes = http.get(`${BASE_URL}/attendance/logs/${eventId}`, {
    headers: authHeaders(token),
    tags: { name: 'scan_logs' }
  })
  requestCount.add(1)
  check(logsRes, { 'scan logs: 200': (r) => r.status === 200 })

  sleep(1)

  // View users list
  const usersRes = http.get(`${BASE_URL}/users`, {
    headers: authHeaders(token),
    tags: { name: 'users_list' }
  })
  requestCount.add(1)
  check(usersRes, { 'users: 200': (r) => r.status === 200 })

  sleep(8 + Math.random() * 7)
}

export function handleSummary(data) {
  const m = data.metrics
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   PrimeLog — Load Test Summary   ║')
  console.log('╚══════════════════════════════════╝')
  console.log(`Total requests    : ${m.request_count?.values?.count ?? 'N/A'}`)
  console.log(`Error rate        : ${((m.error_rate?.values?.rate ?? 0) * 100).toFixed(2)}%`)
  console.log(`Avg response time : ${m.http_req_duration?.values?.avg?.toFixed(0) ?? 'N/A'}ms`)
  console.log(`p90 response time : ${m.http_req_duration?.values['p(90)']?.toFixed(0) ?? 'N/A'}ms`)
  console.log(`p95 response time : ${m.http_req_duration?.values['p(95)']?.toFixed(0) ?? 'N/A'}ms`)
  console.log(`p99 response time : ${m.http_req_duration?.values['p(99)']?.toFixed(0) ?? 'N/A'}ms`)
  console.log(`Scan lookup p95   : ${m['http_req_duration{name:scan_lookup}']?.values['p(95)']?.toFixed(0) ?? 'N/A'}ms`)
  return {}
}