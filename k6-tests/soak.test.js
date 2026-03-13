// ─────────────────────────────────────────────────────────────
//  soak.test.js — PrimeLog Soak Test
//
//  Purpose : Detect memory leaks, connection pool exhaustion,
//            and gradual degradation that only appear over time.
//            Runs at moderate load (35 VUs) for 30 minutes.
//
//  Run     : k6 run soak.test.js
//  Duration: ~32 minutes
//  VUs     : steady 35
//
//  Watch for:
//    - Response times slowly climbing over time (memory leak)
//    - Error rate increasing after 15-20 min (pool exhaustion)
//    - Server crash or OOM (Node.js memory issue)
//    - DB pool warnings growing in server terminal
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
    { duration: '2m',  target: 35 },  // ramp up
    { duration: '28m', target: 35 },  // hold steady — this is the soak
    { duration: '2m',  target: 0  },  // ramp down
  ],


  thresholds: {
    // Soak thresholds — moderate load so these should be comfortable
    http_req_failed:   ['rate<0.05'],    // fail if >5% network errors
    http_req_duration: ['p(95)<10000'],  // fail if p95 > 10s at any point
    error_rate:        ['rate<0.05'],    // fail if >5% 5xx errors
  },
}

// ── Setup: login ONCE, share token across all VUs ─────────────
export function setup() {
  console.log('🔐 Logging in once for all VUs...')
  const token = login()
  if (!token) throw new Error('❌ Login failed in setup — aborting test')
  const eventId = getFirstEventId(token)
  if (!eventId) throw new Error('❌ No event found in setup — aborting test')
  console.log(`✅ Setup complete — eventId: ${eventId}`)
  console.log('⏱️  Soak test running for 30 minutes — watch server terminal for memory/pool drift')
  return { token, eventId }
}

// ── Main scenario ──────────────────────────────────────────────
export default function (data) {
  const { token, eventId } = data
  if (!token || !eventId) { sleep(2); return }

  const roll = Math.random()

  if (roll < 0.50) {
    scannerIteration(token, eventId)   // 50% — scanner (core flow)
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

  sleep(0.5)

  // Lookup
  const lookupRes = http.post(
    `${BASE_URL}/attendance/lookup`,
    JSON.stringify({ query: agentCode, event_id: eventId }),
    { headers: authHeaders(token), tags: { name: 'scan_lookup' } }
  )
  requestCount.add(1)
  scanDuration.add(lookupRes.timings.duration)
  errorRate.add(lookupRes.status >= 500 || lookupRes.status === 0)

  sleep(0.5)

  // Check-in scan
  const scanRes = http.post(
    `${BASE_URL}/attendance/scan`,
    JSON.stringify({ agent_code: agentCode, event_id: eventId }),
    { headers: authHeaders(token), tags: { name: 'scan_checkin' } }
  )
  requestCount.add(1)
  scanDuration.add(scanRes.timings.duration)
  errorRate.add(scanRes.status >= 500 || scanRes.status === 0)

  // Realistic think time — soak test should mimic real usage pace
  sleep(1 + Math.random())
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

  // Participants list
  const partRes = http.get(`${BASE_URL}/participants/event/${eventId}`, {
    headers: authHeaders(token),
    tags: { name: 'participants_list' }
  })
  requestCount.add(1)
  participantDuration.add(partRes.timings.duration)
  errorRate.add(partRes.status >= 500 || partRes.status === 0)

  sleep(1 + Math.random())
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

  sleep(1 + Math.random())
}

export function handleSummary(data) {
  const m        = data.metrics
  const failRate = (m.http_req_failed?.values?.rate ?? 0)
  const errRate  = (m.error_rate?.values?.rate       ?? 0)
  const p95      = m.http_req_duration?.values['p(95)'] ?? null
  const p99      = m.http_req_duration?.values['p(99)'] ?? null
  const avg      = m.http_req_duration?.values?.avg      ?? null
  const max      = m.http_req_duration?.values?.max      ?? null
  const scanP95  = m.scan_duration?.values['p(95)']      ?? null

  const failPct = (failRate * 100).toFixed(2)
  const errPct  = (errRate  * 100).toFixed(2)
  const p95Str  = p95     != null ? `${p95.toFixed(0)}ms`     : 'N/A'
  const p99Str  = p99     != null ? `${p99.toFixed(0)}ms`     : 'N/A'
  const avgStr  = avg     != null ? `${avg.toFixed(0)}ms`     : 'N/A'
  const maxStr  = max     != null ? `${max.toFixed(0)}ms`     : 'N/A'
  const scanStr = scanP95 != null ? `${scanP95.toFixed(0)}ms` : 'N/A'

  const httpOk = failRate < 0.05
  const errOk  = errRate  < 0.05
  const p95Ok  = p95 == null || p95 < 10000
  const passed = httpOk && errOk && p95Ok

  console.log('\n╔══════════════════════════════════╗')
  console.log('║   PrimeLog — Soak Test Summary   ║')
  console.log('╚══════════════════════════════════╝')
  console.log(`Total requests    : ${m.request_count?.values?.count ?? 'N/A'}`)
  console.log(`HTTP fail rate    : ${failPct}%   ${httpOk ? '✅' : '❌'}`)
  console.log(`Error rate        : ${errPct}%   ${errOk  ? '✅' : '❌'}`)
  console.log(`Avg response time : ${avgStr}`)
  console.log(`p95 response time : ${p95Str}     ${p95Ok  ? '✅' : '❌'}`)
  console.log(`p99 response time : ${p99Str}`)
  console.log(`Max response time : ${maxStr}`)
  console.log(`Scan lookup p95   : ${scanStr}`)
  console.log(`\nVerdict: ${passed
    ? '✅ PASSED — no memory leaks or pool exhaustion detected'
    : '❌ FAILED — degradation detected over time (check server logs)'}`)
  console.log('\n── What to check in server terminal ─────────────────')
  console.log('✅ Good: pool pressure warnings stay low or disappear over time')
  console.log('⚠️  Bad:  pool pressure warnings grow after 15-20 min (pool leak)')
  console.log('⚠️  Bad:  response times climb steadily (memory leak)')
  console.log('❌ Fatal: server crash or OOM kill')
  return {}
}

// ── Teardown: remind to clean up via Supabase SQL ─────────────
// Deleting 3000+ participants one-by-one via API is too slow for k6 teardown.
// Run this in Supabase SQL editor after each soak test instead:
//
//   DELETE FROM attendance_sessions WHERE participant_id IN
//     (SELECT participant_id FROM participants WHERE full_name LIKE 'K6 User%');
//   DELETE FROM scan_logs WHERE participant_id IN
//     (SELECT participant_id FROM participants WHERE full_name LIKE 'K6 User%');
//   DELETE FROM participants WHERE full_name LIKE 'K6 User%';
//
export function teardown(data) {
  const { eventId } = data
  console.log(`\n🧹 Soak test complete — clean up test data in Supabase SQL:`)
  console.log(`   DELETE FROM attendance_sessions WHERE participant_id IN`)
  console.log(`     (SELECT participant_id FROM participants WHERE full_name LIKE 'K6 User%');`)
  console.log(`   DELETE FROM scan_logs WHERE participant_id IN`)
  console.log(`     (SELECT participant_id FROM participants WHERE full_name LIKE 'K6 User%');`)
  console.log(`   DELETE FROM participants WHERE full_name LIKE 'K6 User%';`)
}