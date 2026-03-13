// ─────────────────────────────────────────────────────────────
//  debug.test.js — Single VU, prints every response status
//  Run: k6 run debug.test.js
// ─────────────────────────────────────────────────────────────
import http from 'k6/http'
import { sleep } from 'k6'
import {
  BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD,
  jsonHeaders, authHeaders,
  login, getFirstEventId, uniqueAgentCode, uniqueName,
} from './helpers.js'

http.setResponseCallback(http.expectedStatuses(
  200, 201, 204, 400, 401, 403, 404, 409, 429
))

export const options = {
  vus: 1,
  iterations: 1,
}

export default function () {
  const log = (label, res) => {
    let body = ''
    try { body = JSON.stringify(JSON.parse(res.body)).substring(0, 120) }
    catch { body = String(res.body).substring(0, 120) }
    console.log(`[${res.status}] ${label} → ${body}`)
  }

  // 1. Login
  console.log('\n── AUTH ─────────────────────────────────')
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    { headers: jsonHeaders }
  )
  log('POST /auth/login', loginRes)

  let token = null
  try { token = JSON.parse(loginRes.body)?.token } catch {}
  if (!token) { console.log('❌ No token — stopping'); return }

  // 2. Get me
  const meRes = http.get(`${BASE_URL}/auth/me`, { headers: authHeaders(token) })
  log('GET  /auth/me', meRes)

  // 3. Events list
  console.log('\n── EVENTS ───────────────────────────────')
  const eventsRes = http.get(`${BASE_URL}/events`, { headers: authHeaders(token) })
  log('GET  /events', eventsRes)

  let eventId = null
  try {
    const evBody = JSON.parse(eventsRes.body)
    eventId = Array.isArray(evBody) ? evBody[0]?.event_id : evBody?.events?.[0]?.event_id
  } catch {}
  console.log(`     eventId resolved: ${eventId}`)

  if (!eventId) { console.log('❌ No eventId — stopping'); return }

  // 4. Register participant
  console.log('\n── PARTICIPANTS ─────────────────────────')
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
    { headers: jsonHeaders }
  )
  log(`POST /participants/register/${eventId}`, regRes)

  sleep(0.5)

  // 5. Attendance lookup
  console.log('\n── ATTENDANCE ───────────────────────────')
  const lookupRes = http.post(
    `${BASE_URL}/attendance/lookup`,
    JSON.stringify({ query: agentCode, event_id: eventId }),
    { headers: authHeaders(token) }
  )
  log('POST /attendance/lookup', lookupRes)

  sleep(0.3)

  // 6. Scan check-in
  const scanRes = http.post(
    `${BASE_URL}/attendance/scan`,
    JSON.stringify({ agent_code: agentCode, event_id: eventId }),
    { headers: authHeaders(token) }
  )
  log('POST /attendance/scan', scanRes)

  // 7. Sessions
  console.log('\n── SESSIONS / LOGS ──────────────────────')
  const sessRes = http.get(`${BASE_URL}/attendance/sessions/${eventId}`, { headers: authHeaders(token) })
  log(`GET  /attendance/sessions/${eventId}`, sessRes)

  const logsRes = http.get(`${BASE_URL}/attendance/logs/${eventId}`, { headers: authHeaders(token) })
  log(`GET  /attendance/logs/${eventId}`, logsRes)

  // 8. Branches / Users
  console.log('\n── MISC ─────────────────────────────────')
  const branchRes = http.get(`${BASE_URL}/branches`, { headers: authHeaders(token) })
  log('GET  /branches', branchRes)

  const usersRes = http.get(`${BASE_URL}/users`, { headers: authHeaders(token) })
  log('GET  /users', usersRes)

  console.log('\n── DONE ─────────────────────────────────')
}