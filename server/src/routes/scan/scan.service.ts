import pool from '../../config/database.js'

// ── Lookup participant without checking in ───────────────
export const lookupParticipantService = async (agent_code: string, event_id: number) => {
  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')

  // 1. Find participant
  const participantResult = await pool.query(
    `SELECT * FROM participants
     WHERE agent_code = $1 AND event_id = $2 AND deleted_at IS NULL`,
    [agent_code, event_id]
  )
  const participant = participantResult.rows[0]
  if (!participant) throw new Error('Agent code not found. Please check if agent is registered for this event.')
  if (participant.registration_status === 'cancelled') throw new Error('This participant registration has been cancelled.')

  // 2. Check event
  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new Error('Event not found.')
  if (event.status !== 'open') throw new Error('Event is not currently active.')

  // 3. Check cutoff
  const now = new Date()
  const currentTime = now.toTimeString().split(' ')[0]
  if (currentTime > event.checkin_cutoff) throw new Error('Check-in time has already passed.')

  // 4. Check existing session to determine next action
  const existingSession = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE participant_id = $1 AND event_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [participant.participant_id, event_id]
  )

  let nextAction: 'check_in' | 'check_out' | 'blocked' = 'check_in'
  if (existingSession.rows.length > 0) {
    const session = existingSession.rows[0]
    if (session.check_in_time && session.check_out_time) {
      nextAction = 'blocked'
    } else if (session.check_in_time && !session.check_out_time) {
      nextAction = 'check_out'
    }
  }

  return {
    participant: {
      participant_id: participant.participant_id,
      full_name: participant.full_name,
      agent_code: participant.agent_code,
      branch_name: participant.branch_name,
      team_name: participant.team_name,
      photo_url: participant.photo_url || null,
    },
    next_action: nextAction
  }
}

// ── Scan (actual check-in / check-out) ──────────────────
export const scanAgentCodeService = async (agent_code: string, event_id: number) => {

  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')
  if (agent_code.length > 50) throw new Error('Invalid agent code')

  // 1. Find participant
  const participantResult = await pool.query(
    `SELECT * FROM participants
     WHERE agent_code = $1 AND event_id = $2 AND deleted_at IS NULL`,
    [agent_code, event_id]
  )
  const participant = participantResult.rows[0]

  // 2. Log helper
  const logScan = async (scan_type: string, denial_reason?: string) => {
    await pool.query(
      `INSERT INTO scan_logs
        (participant_id, event_id, scanned_at, qr_token, scan_type, denial_reason, created_at)
       VALUES ($1, $2, NOW(), $3, $4, $5, NOW())`,
      [participant?.participant_id || null, event_id, agent_code, scan_type, denial_reason || null]
    )
  }

  // 3. Validate
  if (!participant) {
    await logScan('denied', 'Agent code not found for this event')
    throw new Error('Agent code not found. Please check if agent is registered for this event.')
  }
  if (participant.registration_status === 'cancelled') {
    await logScan('denied', 'Participant registration is cancelled')
    throw new Error('This participant registration has been cancelled.')
  }

  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) { await logScan('denied', 'Event not found'); throw new Error('Event not found.') }
  if (event.status !== 'open') { await logScan('denied', 'Event is not active'); throw new Error('Event is not currently active.') }

  const now = new Date()
  const currentTime = now.toTimeString().split(' ')[0]
  if (currentTime > event.checkin_cutoff) {
    await logScan('denied', 'Check-in time has passed')
    throw new Error('Check-in time has already passed.')
  }

  const participantPayload = {
    full_name: participant.full_name,
    agent_code: participant.agent_code,
    branch_name: participant.branch_name,
    team_name: participant.team_name,
    photo_url: participant.photo_url || null
  }

  // 4. Get existing session
  const existingSession = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE participant_id = $1 AND event_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [participant.participant_id, event_id]
  )

  // 5. Check in
  if (existingSession.rows.length === 0) {
    const session = await pool.query(
      `INSERT INTO attendance_sessions
        (participant_id, event_id, check_in_time, check_in_method, created_at, updated_at)
       VALUES ($1, $2, NOW(), 'manual', NOW(), NOW())
       RETURNING *`,
      [participant.participant_id, event_id]
    )
    await logScan('check_in')
    return { action: 'check_in', message: 'Check-in successful', participant: participantPayload, session: session.rows[0] }
  }

  const session = existingSession.rows[0]

  // 6. Check out
  if (session.check_in_time && !session.check_out_time) {
    const updatedSession = await pool.query(
      `UPDATE attendance_sessions
       SET check_out_time = NOW(), check_out_method = 'manual', updated_at = NOW()
       WHERE session_id = $1 RETURNING *`,
      [session.session_id]
    )
    await logScan('check_out')
    return { action: 'check_out', message: 'Check-out successful', participant: participantPayload, session: updatedSession.rows[0] }
  }

  // 7. Blocked
  await logScan('denied', 'Participant already completed check-in and check-out')
  throw new Error('This participant has already checked in and checked out. No further entries allowed.')
}

// ── Log manual denial (staff pressed Deny button) ───────
export const logDenialService = async (agent_code: string, event_id: number, reason: string) => {
  const participantResult = await pool.query(
    `SELECT participant_id FROM participants
     WHERE agent_code = $1 AND event_id = $2 AND deleted_at IS NULL`,
    [agent_code, event_id]
  )
  const participant = participantResult.rows[0]

  await pool.query(
    `INSERT INTO scan_logs
      (participant_id, event_id, scanned_at, qr_token, scan_type, denial_reason, created_at)
     VALUES ($1, $2, NOW(), $3, 'denied', $4, NOW())`,
    [participant?.participant_id || null, event_id, agent_code, reason]
  )
}

export const getSessionsByEventService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT
       a.session_id, a.check_in_time, a.check_out_time,
       a.check_in_method, a.check_out_method,
       p.full_name, p.agent_code, p.branch_name, p.team_name
     FROM attendance_sessions a
     JOIN participants p ON a.participant_id = p.participant_id
     WHERE a.event_id = $1
     ORDER BY a.check_in_time DESC`,
    [event_id]
  )
  return result.rows
}

export const getScanLogsByEventService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT
       s.scan_id, s.scanned_at, s.scan_type, s.denial_reason, s.qr_token,
       p.full_name, p.agent_code
     FROM scan_logs s
     LEFT JOIN participants p ON s.participant_id = p.participant_id
     WHERE s.event_id = $1
     ORDER BY s.scanned_at DESC`,
    [event_id]
  )
  return result.rows
}