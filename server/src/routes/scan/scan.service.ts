import pool from '../../config/database.js'
import { AppError, NotFoundError, ValidationError } from '../../errors/AppError.js'
import { cacheGet, cacheSet, cacheDel } from '../../utils/cache.js'
import { io } from '../../server.js'

const SESSIONS_CACHE_TTL = 10

const invalidateSessionsCache = async (event_id: number) => {
  await cacheDel(`sessions:event:${event_id}`)
}

export const lookupParticipantService = async (query: string, event_id: number, branch_name?: string | null) => {
  if (!query?.trim()) throw new ValidationError('Agent code or surname is required')
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')
  if (query.trim().length > 50) throw new ValidationError('Query too long')

  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new AppError('Event not found.', 404)

  const isNumeric = /^\d+$/.test(query.trim())

  const participantResult = await pool.query(
    `SELECT p.*, a.photo_url
     FROM participants p
     LEFT JOIN agents a ON a.agent_code = p.agent_code
     WHERE p.event_id = $1
       AND p.deleted_at IS NULL
       AND (
         ($2 AND p.agent_code ILIKE $3)
         OR (NOT $2 AND p.full_name ILIKE $3)
       )
       ${branch_name ? 'AND p.branch_name = $4' : ''}`,
    branch_name
      ? [event_id, isNumeric, `%${query.trim()}%`, branch_name]
      : [event_id, isNumeric, `%${query.trim()}%`]
  )

  let participantRows = participantResult.rows

  if (isNumeric && participantRows.length === 0) {
    const fallback = await pool.query(
      `SELECT p.*, a.photo_url
       FROM participants p
       LEFT JOIN agents a ON a.agent_code = p.agent_code
       WHERE p.event_id = $1 AND p.deleted_at IS NULL AND p.full_name ILIKE $2
         ${branch_name ? 'AND p.branch_name = $3' : ''}`,
      branch_name ? [event_id, `%${query.trim()}%`, branch_name] : [event_id, `%${query.trim()}%`]
    )
    participantRows = fallback.rows
  }

  if (participantRows.length === 0) throw new AppError('No participant found. Please check the agent code or surname.', 404)

  const active = participantRows.filter(p => p.registration_status !== 'cancelled')
  if (active.length === 0) throw new AppError('Participant registration has been cancelled.', 400)

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

export const resolveParticipantService = async (participant_id: number, event_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new ValidationError('Valid participant ID is required')
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')

  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new AppError('Event not found.', 404)

  const pResult = await pool.query(
    `SELECT p.*, a.photo_url
     FROM participants p
     LEFT JOIN agents a ON a.agent_code = p.agent_code
     WHERE p.participant_id = $1 AND p.event_id = $2 AND p.deleted_at IS NULL`,
    [participant_id, event_id]
  )
  const participant = pResult.rows[0]
  if (!participant) throw new NotFoundError('Participant not found.')
  if (participant.registration_status === 'cancelled') throw new AppError('This participant registration has been cancelled.', 400)

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

export const scanAgentCodeService = async (
  agent_code: string,
  event_id: number,
  is_early_out: boolean = false,
  early_out_reason?: string | null
) => {
  if (!agent_code?.trim()) throw new ValidationError('Agent code is required')
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')
  if (agent_code.length > 50) throw new ValidationError('Invalid agent code')

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
    throw new AppError('Agent code not found. Please check if agent is registered for this event.', 404)
  }
  if (participant.registration_status === 'cancelled') {
    await logScan('denied', 'Participant registration is cancelled')
    throw new AppError('This participant registration has been cancelled.', 400)
  }

  const eventResult = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) {
    await logScan('denied', 'Event not found')
    throw new AppError('Event not found.', 404)
  }

  const existingSession = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE participant_id = $1 AND event_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [participant.participant_id, event_id]
  )

  const session = existingSession.rows[0] ?? null
  const isCheckedIn = session?.check_in_time && !session?.check_out_time

  const participantPayload = {
    full_name:   participant.full_name,
    agent_code:  participant.agent_code,
    branch_name: participant.branch_name,
    team_name:   participant.team_name,
    photo_url:   participant.photo_url || null,
    agent_type:  participant.agent_type || null
  }

  // ── Check in ──────────────────────────────────────────────────────────────
  if (!session) {
    const newSession = await pool.query(
      `INSERT INTO attendance_sessions
        (participant_id, event_id, check_in_time, check_in_method, created_at, updated_at)
       VALUES ($1, $2, NOW(), 'manual', NOW(), NOW())
       RETURNING *`,
      [participant.participant_id, event_id]
    )
    await logScan('check_in')
    await invalidateSessionsCache(event_id)

    const result = {
      action: 'check_in' as const,
      message: 'Check-in successful',
      participant: participantPayload,
      session: newSession.rows[0]
    }

    // ── Emit to all clients watching this event ───────────────────────────
    io.to('event:' + event_id).emit('attendance:update', result)

    return result
  }

  // ── Check out ─────────────────────────────────────────────────────────────
  if (isCheckedIn) {
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
    await invalidateSessionsCache(event_id)

    const result = {
      action: 'check_out' as const,
      message: is_early_out ? 'Early out recorded' : 'Check-out successful',
      is_early_out,
      participant: participantPayload,
      session: updatedSession.rows[0]
    }

    // ── Emit to all clients watching this event ───────────────────────────
    io.to('event:' + event_id).emit('attendance:update', result)

    return result
  }

  await logScan('denied', 'Participant already completed check-in and check-out')
  throw new AppError('This participant has already checked in and checked out. No further entries allowed.', 400)
}

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
  const cacheKey = `sessions:event:${event_id}`
  const cached = await cacheGet<any[]>(cacheKey)
  if (cached) return cached

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

  await cacheSet(cacheKey, result.rows, SESSIONS_CACHE_TTL)
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

export const updateSessionTimesService = async (
  session_id: number,
  check_in_time: string,
  check_out_time: string | null
) => {
  const checkIn  = new Date(check_in_time)
  const checkOut = check_out_time ? new Date(check_out_time) : null

  if (isNaN(checkIn.getTime()))              throw new ValidationError('check_in_time is not a valid date')
  if (checkOut && isNaN(checkOut.getTime())) throw new ValidationError('check_out_time is not a valid date')
  if (checkOut && checkOut <= checkIn)       throw new ValidationError('check_out_time must be after check_in_time')

  const existing = await pool.query(
    `SELECT session_id, event_id FROM attendance_sessions WHERE session_id = $1`,
    [session_id]
  )
  if (!existing.rows[0]) throw new NotFoundError('Session not found')

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

  await invalidateSessionsCache(existing.rows[0].event_id)
  return result.rows[0]
}

export const bulkCheckOutService = async (event_id: number, session_ids: number[]) => {
  if (!Array.isArray(session_ids) || session_ids.length === 0) {
    throw new ValidationError('session_ids must be a non-empty array')
  }

  const eventCheck = await pool.query(
    `SELECT event_id FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  if (!eventCheck.rows[0]) throw new NotFoundError('Event not found')

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

  await invalidateSessionsCache(event_id)

  const checkoutResult = {
    checked_out: result.rowCount ?? 0,
    session_ids: result.rows.map((r: { session_id: number }) => r.session_id),
  }

  // ── Notify all clients of bulk checkout ──────────────────────────────────
  io.to('event:' + event_id).emit('attendance:bulk_checkout', checkoutResult)

  return checkoutResult
}