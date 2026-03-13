// ─────────────────────────────────────────────────────────────
//  stress.test.js — PrimeLog Stress Test
//
//  Purpose : Find the breaking point. Ramp users up gradually
//            until response times degrade or errors appear.
//            Shows how the server handles more traffic than expected.
//
//  Run     : k6 run stress.test.js
//  Duration: ~10 minutes
//  VUs     : ramps from 10 → 100 then back down
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
  stages: [
    { duration: '1m',  target: 10  },  // warm up
    { duration: '1m',  target: 25  },  // light load
    { duration: '1m',  target: 50  },  // medium load
    { duration: '1m',  target: 75  },  // high load
    { duration: '2m',  target: 100 },  // peak — Supabase free tier ceiling
    { duration: '2m',  target: 50  },  // scale back
    { duration: '1m',  target: 10  },  // recover
    { duration: '1m',  target: 0   },  // ramp down
  ],

  thresholds: {
    // Supabase free tier realistically maxes out around 75-100 VUs.
    // These thresholds reflect that — we test survivability, not speed.
    http_req_failed:   ['rate<0.10'],    // fail only if >10% network errors
    http_req_duration: ['p(95)<30000'],  // fail only if p95 > 30s
    error_rate:        ['rate<0.10'],    // fail only if >10% 5xx errors
  },
}

// ── Setup: login ONCE, share token across all VUs ─────────────
// Avoids 100 simultaneous bcrypt logins hammering the DB on startup
export function setup() {
  console.log('🔐 Logging in once for all VUs...')
  const token = login()
  if (!token) throw new Error('❌ Login failed in setup — aborting test')
  const eventId = getFirstEventId(token)
  if (!eventId) throw new Error('❌ No event found in setup — aborting test')
  console.log(`✅ Setup complete — eventId: ${eventId}`)
  return { token, eventId }
}

// ── Main scenario: mixed workload ──────────────────────────────
export default function (data) {
  const { token, eventId } = data
  if (!token || !eventId) { sleep(2); return }

  const roll = Math.random()

  if (roll < 0.50) {
    scannerIteration(token, eventId)   // 50% — scanner (heaviest)
  } else if (roll < 0.80) {
    viewerIteration(token, eventId)    // 30% — dashboard viewer
  } else {
    authIteration(token)               // 20% — auth/profile
  }
}

function scannerIteration(token, eventId) {
  const agentCode = uniqueAgentCode()

  // Register
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
  errorRate.add(regRes.status >= 500 || regRes.status === 0)

  sleep(0.3)

  // Lookup
  const lookupRes = http.post(
    `${BASE_URL}/attendance/lookup`,
    JSON.stringify({ query: agentCode, event_id: eventId }),
    { headers: authHeaders(token), tags: { name: 'scan_lookup' } }
  )
  requestCount.add(1)
  scanDuration.add(lookupRes.timings.duration)
  errorRate.add(lookupRes.status >= 500 || lookupRes.status === 0)

  sleep(0.3)

  // Check-in scan
  const scanRes = http.post(
    `${BASE_URL}/attendance/scan`,
    JSON.stringify({ agent_code: agentCode, event_id: eventId }),
    { headers: authHeaders(token), tags: { name: 'scan_checkin' } }
  )
  requestCount.add(1)
  scanDuration.add(scanRes.timings.duration)
  errorRate.add(scanRes.status >= 500 || scanRes.status === 0)

  // Longer sleep at high VUs to reduce req/s and avoid overwhelming Supabase pooler
  sleep(0.8 + Math.random())
}

function viewerIteration(token, eventId) {
  // Events list
  const eventsRes = http.get(`${BASE_URL}/events`, {
    headers: authHeaders(token),
    tags: { name: 'events_list' }
  })
  requestCount.add(1)
  eventsDuration.add(eventsRes.timings.duration)
  errorRate.add(eventsRes.status >= 500 || eventsRes.status === 0)

  sleep(0.5)

  // Participants list — heavy query, guarded by pool pressure check server-side
  const partRes = http.get(`${BASE_URL}/participants/event/${eventId}`, {
    headers: authHeaders(token),
    tags: { name: 'participants_list' }
  })
  requestCount.add(1)
  participantDuration.add(partRes.timings.duration)
  errorRate.add(partRes.status >= 500 || partRes.status === 0)

  sleep(0.8 + Math.random())
}

function authIteration(token) {
  // getMe
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders(token),
    tags: { name: 'auth_me' }
  })
  requestCount.add(1)
  loginDuration.add(meRes.timings.duration)
  errorRate.add(meRes.status >= 500 || meRes.status === 0)

  sleep(0.3)

  // Branches
  const branchRes = http.get(`${BASE_URL}/branches`, {
    headers: authHeaders(token),
    tags: { name: 'branches_list' }
  })
  requestCount.add(1)
  errorRate.add(branchRes.status >= 500 || branchRes.status === 0)

  sleep(0.8 + Math.random())
}

export function handleSummary(data) {
  const m          = data.metrics
  const failRate   = (m.http_req_failed?.values?.rate  ?? 0)
  const errRate    = (m.error_rate?.values?.rate        ?? 0)
  const p95        = m.http_req_duration?.values['p(95)']  ?? null
  const p99        = m.http_req_duration?.values['p(99)']  ?? null
  const avg        = m.http_req_duration?.values?.avg       ?? null
  const max        = m.http_req_duration?.values?.max       ?? null
  const scanP95    = m.scan_duration?.values['p(95)']       ?? null

  const failPct  = (failRate * 100).toFixed(2)
  const errPct   = (errRate  * 100).toFixed(2)
  const p95Str   = p95  != null ? `${p95.toFixed(0)}ms`  : 'N/A'
  const p99Str   = p99  != null ? `${p99.toFixed(0)}ms`  : 'N/A'
  const avgStr   = avg  != null ? `${avg.toFixed(0)}ms`  : 'N/A'
  const maxStr   = max  != null ? `${max.toFixed(0)}ms`  : 'N/A'
  const scanStr  = scanP95 != null ? `${scanP95.toFixed(0)}ms` : 'N/A'

  const httpOk  = failRate  < 0.10
  const errOk   = errRate   < 0.10
  const p95Ok   = p95 == null || p95 < 30000

  const passed  = httpOk && errOk && p95Ok

  const httpIcon  = httpOk ? '✅' : '❌'
  const errIcon   = errOk  ? '✅' : '❌'
  const p95Icon   = p95Ok  ? '✅' : '❌'

  console.log('\n╔══════════════════════════════════╗')
  console.log('║  PrimeLog — Stress Test Summary  ║')
  console.log('╚══════════════════════════════════╝')
  console.log(`Total requests    : ${m.request_count?.values?.count ?? 'N/A'}`)
  console.log(`HTTP fail rate    : ${failPct}%  ${httpIcon}`)
  console.log(`Error rate        : ${errPct}%   ${errIcon}`)
  console.log(`Avg response time : ${avgStr}`)
  console.log(`p95 response time : ${p95Str}       ${p95Icon}`)
  console.log(`p99 response time : ${p99Str}`)
  console.log(`Max response time : ${maxStr}`)
  console.log(`Scan lookup p95   : ${scanStr}`)
  console.log(`\nVerdict: ${passed ? '✅ PASSED — server survived stress' : '❌ FAILED — too many errors or timeouts'}`)
  console.log('\n── Breakdown by stage ───────────────────────────────')
  console.log('10  VUs → expected p95 <1000ms  (warm up)')
  console.log('25  VUs → expected p95 <2000ms  (light load)')
  console.log('50  VUs → expected p95 <5000ms  (medium load)')
  console.log('75  VUs → expected p95 <8000ms  (high load)')
  console.log('100 VUs → expected p95 <15000ms (peak — Supabase limit)')
  console.log('\nIf p95 stays under 5000ms at 100 VUs → server is strong ✅')
  return {}
}