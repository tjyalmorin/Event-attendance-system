import pool from '../../config/database.js'

// ── Lookup by agent code OR surname ──────────────────────────────────────────
export const lookupParticipantService = async (query: string, event_id: number, branch_name?: string | null) => {
  if (!query?.trim()) throw new Error('Agent code or surname is required')
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')

  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new Error('Event not found.')

  const now = new Date()
  const currentTime = now.toTimeString().split(' ')[0]
  if (currentTime > event.checkin_cutoff) throw new Error('Check-in time has already passed.')

  const isNumeric = /^\d+$/.test(query.trim())
  let participantRows: any[] = []

  if (isNumeric) {
    const partial = await pool.query(
      `SELECT p.*, a.photo_url
       FROM participants p
       LEFT JOIN agents a ON a.agent_code = p.agent_code
       WHERE p.agent_code ILIKE $1 AND p.event_id = $2 AND p.deleted_at IS NULL
         ${branch_name ? 'AND p.branch_name = $3' : ''}`,
      branch_name ? [`%${query.trim()}%`, event_id, branch_name] : [`%${query.trim()}%`, event_id]
    )
    participantRows = partial.rows
  }

  if (participantRows.length === 0) {
    const byName = await pool.query(
      `SELECT p.*, a.photo_url
       FROM participants p
       LEFT JOIN agents a ON a.agent_code = p.agent_code
       WHERE p.event_id = $1 AND p.deleted_at IS NULL AND p.full_name ILIKE $2
         ${branch_name ? 'AND p.branch_name = $3' : ''}`,
      branch_name ? [event_id, `%${query.trim()}%`, branch_name] : [event_id, `%${query.trim()}%`]
    )
    participantRows = byName.rows
  }

  if (participantRows.length === 0) {
    throw new Error('No participant found. Please check the agent code or surname.')
  }

  const active = participantRows.filter(p => p.registration_status !== 'cancelled')
  if (active.length === 0) {
    throw new Error('Participant registration has been cancelled.')
  }

  if (active.length > 1) {
    return {
      multiple: true,
      participants: active.map(p => ({
        participant_id: p.participant_id,
        full_name: p.full_name,
        agent_code: p.agent_code,
        branch_name: p.branch_name,
        team_name: p.team_name,
        photo_url: p.photo_url || null,
      }))
    }
  }

  const participant = active[0]
  const existingSession = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE participant_id = $1 AND event_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [participant.participant_id, event_id]
  )

  let nextAction: 'check_in' | 'check_out' | 'blocked' = 'check_in'
  if (existingSession.rows.length > 0) {
    const session = existingSession.rows[0]
    if (session.check_in_time && session.check_out_time) nextAction = 'blocked'
    else if (session.check_in_time && !session.check_out_time) nextAction = 'check_out'
  }

  return {
    multiple: false,
    participant: {
      participant_id: participant.participant_id,
      full_name: participant.full_name,
      agent_code: participant.agent_code,
      branch_name: participant.branch_name,
      team_name: participant.team_name,
      photo_url: participant.photo_url || null,
      label: participant.label || null,
      label_description: participant.label_description || null,
      agent_type: participant.agent_type || null,
    },
    next_action: nextAction
  }
}

// ── Resolve after user picks from multiple matches ────────────────────────────
export const resolveParticipantService = async (participant_id: number, event_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new Error('Valid participant ID is required')
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')

  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new Error('Event not found.')

  const now = new Date()
  const currentTime = now.toTimeString().split(' ')[0]
  if (currentTime > event.checkin_cutoff) throw new Error('Check-in time has already passed.')

  const pResult = await pool.query(
    `SELECT p.*, a.photo_url
     FROM participants p
     LEFT JOIN agents a ON a.agent_code = p.agent_code
     WHERE p.participant_id = $1 AND p.event_id = $2 AND p.deleted_at IS NULL`,
    [participant_id, event_id]
  )
  const participant = pResult.rows[0]
  if (!participant) throw new Error('Participant not found.')
  if (participant.registration_status === 'cancelled') throw new Error('This participant registration has been cancelled.')

  const existingSession = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE participant_id = $1 AND event_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [participant_id, event_id]
  )

  let nextAction: 'check_in' | 'check_out' | 'blocked' = 'check_in'
  if (existingSession.rows.length > 0) {
    const session = existingSession.rows[0]
    if (session.check_in_time && session.check_out_time) nextAction = 'blocked'
    else if (session.check_in_time && !session.check_out_time) nextAction = 'check_out'
  }

  return {
    multiple: false,
    participant: {
      participant_id: participant.participant_id,
      full_name: participant.full_name,
      agent_code: participant.agent_code,
      branch_name: participant.branch_name,
      team_name: participant.team_name,
      photo_url: participant.photo_url || null,
      label: participant.label || null,
      label_description: participant.label_description || null,
      agent_type: participant.agent_type || null,
    },
    next_action: nextAction
  }
}

// ── Scan (actual check-in / check-out) ───────────────────────────────────────
export const scanAgentCodeService = async (
  agent_code: string,
  event_id: number,
  is_early_out: boolean = false,
  early_out_reason?: string | null
) => {
  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')
  if (agent_code.length > 50) throw new Error('Invalid agent code')

  const participantResult = await pool.query(
    `SELECT p.*, a.photo_url
     FROM participants p
     LEFT JOIN agents a ON a.agent_code = p.agent_code
     WHERE p.agent_code = $1 AND p.event_id = $2 AND p.deleted_at IS NULL`,
    [agent_code, event_id]
  )
  const participant = participantResult.rows[0]

  const logScan = async (scan_type: string, denial_reason?: string) => {
    await pool.query(
      `INSERT INTO scan_logs
        (participant_id, event_id, scanned_at, qr_token, scan_type, denial_reason, created_at)
       VALUES ($1, $2, NOW(), $3, $4, $5, NOW())`,
      [participant?.participant_id || null, event_id, agent_code, scan_type, denial_reason || null]
    )
  }

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
    photo_url: participant.photo_url || null,
    agent_type: participant.agent_type || null
  }

  const existingSession = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE participant_id = $1 AND event_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [participant.participant_id, event_id]
  )

  // ── CHECK IN ─────────────────────────────────────────────
  if (existingSession.rows.length === 0) {
    const session = await pool.query(
      `INSERT INTO attendance_sessions
        (participant_id, event_id, check_in_time, check_in_method, created_at, updated_at)
       VALUES ($1, $2, NOW(), 'manual', NOW(), NOW())
       RETURNING *`,
      [participant.participant_id, event_id]
    )
    await logScan('check_in')
    return {
      action: 'check_in',
      message: 'Check-in successful',
      participant: participantPayload,
      session: session.rows[0]
    }
  }

  const session = existingSession.rows[0]

  // ── CHECK OUT (with optional early out) ──────────────────
  if (session.check_in_time && !session.check_out_time) {
    const checkOutMethod = is_early_out ? 'early_out' : 'manual'
    const reason = is_early_out ? (early_out_reason?.trim() || 'Early departure') : null

    const updatedSession = await pool.query(
      `UPDATE attendance_sessions
       SET check_out_time = NOW(),
           check_out_method = $1,
           early_out_reason = $2,
           updated_at = NOW()
       WHERE session_id = $3
       RETURNING *`,
      [checkOutMethod, reason, session.session_id]
    )
    await logScan('check_out')
    return {
      action: 'check_out',
      message: is_early_out ? 'Early out recorded' : 'Check-out successful',
      is_early_out,
      participant: participantPayload,
      session: updatedSession.rows[0]
    }
  }

  await logScan('denied', 'Participant already completed check-in and check-out')
  throw new Error('This participant has already checked in and checked out. No further entries allowed.')
}

// ── Log denial ────────────────────────────────────────────────────────────────
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

// ── Sessions & Logs ───────────────────────────────────────────────────────────
export const getSessionsByEventService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT
       a.session_id, a.participant_id, a.check_in_time, a.check_out_time,
       a.check_in_method, a.check_out_method, a.early_out_reason,
       p.full_name, p.agent_code, p.branch_name, p.team_name
     FROM attendance_sessions a
     JOIN participants p
       ON a.participant_id = p.participant_id
       AND p.event_id = a.event_id
     WHERE a.event_id = $1
     ORDER BY a.check_in_time DESC NULLS LAST`,
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

// ── Update session check-in / check-out times (admin only) ───────────────────
export const updateSessionTimesService = async (
  session_id: number,
  check_in_time: string,
  check_out_time: string | null
) => {
  const checkIn  = new Date(check_in_time)
  const checkOut = check_out_time ? new Date(check_out_time) : null

  if (isNaN(checkIn.getTime()))              throw new Error('check_in_time is not a valid date')
  if (checkOut && isNaN(checkOut.getTime())) throw new Error('check_out_time is not a valid date')
  if (checkOut && checkOut <= checkIn)       throw new Error('check_out_time must be after check_in_time')

  const existing = await pool.query(
    `SELECT session_id FROM attendance_sessions WHERE session_id = $1`,
    [session_id]
  )
  if (!existing.rows[0]) throw new Error('Session not found')

  const result = await pool.query(
    `UPDATE attendance_sessions
     SET check_in_time  = $1,
         check_out_time = $2,
         updated_at     = NOW()
     WHERE session_id   = $3
     RETURNING
       session_id, participant_id, event_id,
       check_in_time, check_out_time,
       check_in_method, check_out_method, early_out_reason`,
    [checkIn.toISOString(), checkOut ? checkOut.toISOString() : null, session_id]
  )
  return result.rows[0]
}

// ── Bulk check-out ────────────────────────────────────────────────────────────
export const bulkCheckOutService = async (event_id: number, session_ids: number[]) => {
  if (!Array.isArray(session_ids) || session_ids.length === 0) {
    throw new Error('session_ids must be a non-empty array')
  }

  const result = await pool.query(
    `UPDATE attendance_sessions
     SET check_out_time   = NOW(),
         check_out_method = 'bulk_admin',
         updated_at       = NOW()
     WHERE session_id     = ANY($1::int[])
       AND event_id       = $2
       AND check_in_time  IS NOT NULL
       AND check_out_time IS NULL
     RETURNING session_id`,
    [session_ids, event_id]
  )

  return {
    checked_out: result.rowCount ?? 0,
    session_ids: result.rows.map((r: { session_id: number }) => r.session_id),
  }
}