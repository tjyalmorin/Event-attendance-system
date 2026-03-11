import pool from '../../config/database'
import {
  FixCheckinPayload,
  ForceCheckoutPayload,
  EarlyOutPayload
} from '../../types/override.types'

// ── Fix Wrong Check-in Time / Manual Check-in ────────────
export const fixCheckinService = async (payload: FixCheckinPayload, admin_id: string) => {
  const { session_id, participant_id, event_id, adjusted_time, reason } = payload

  if (!adjusted_time) throw new Error('Adjusted time is required')
  if (!reason?.trim()) throw new Error('Reason is required')

  // session_id === 0 means "create a new attendance session" (manual check-in)
  if (!session_id || session_id === 0) {
    // Check participant isn't already checked in for this event
    const existing = await pool.query(
      `SELECT session_id FROM attendance_sessions
       WHERE participant_id = $1 AND event_id = $2 AND check_out_time IS NULL`,
      [participant_id, event_id]
    )
    if (existing.rows.length > 0) throw new Error('Participant already has an active session')

    const newSession = await pool.query(
      `INSERT INTO attendance_sessions
        (participant_id, event_id, check_in_time, check_in_method, created_at, updated_at)
       VALUES ($1, $2, $3, 'manual_override', NOW(), NOW())
       RETURNING *`,
      [participant_id, event_id, adjusted_time]
    )
    const created = newSession.rows[0]

    const log = await pool.query(
      `INSERT INTO override_logs
        (attendance_session_id, participant_id, event_id, admin_id,
         override_type, reason, original_time, adjusted_time, created_at)
       VALUES ($1,$2,$3,$4,'fix_checkin',$5,NULL,$6,NOW())
       RETURNING *`,
      [created.session_id, participant_id, event_id, admin_id, reason.trim(), adjusted_time]
    )

    return {
      message: 'Manual check-in recorded successfully',
      override: log.rows[0]
    }
  }

  // Otherwise update an existing session's check-in time
  const sessionResult = await pool.query(
    'SELECT * FROM attendance_sessions WHERE session_id = $1',
    [session_id]
  )
  const session = sessionResult.rows[0]
  if (!session) throw new Error('Attendance session not found')

  const original_time = session.check_in_time

  await pool.query(
    `UPDATE attendance_sessions
     SET check_in_time = $1, updated_at = NOW()
     WHERE session_id = $2`,
    [adjusted_time, session_id]
  )

  const log = await pool.query(
    `INSERT INTO override_logs
      (attendance_session_id, participant_id, event_id, admin_id,
       override_type, reason, original_time, adjusted_time, created_at)
     VALUES ($1,$2,$3,$4,'fix_checkin',$5,$6,$7,NOW())
     RETURNING *`,
    [session_id, participant_id, event_id, admin_id, reason.trim(), original_time, adjusted_time]
  )

  return {
    message: 'Check-in time updated successfully',
    override: log.rows[0]
  }
}

// ── Force Check-out ──────────────────────────────────────
export const forceCheckoutService = async (payload: ForceCheckoutPayload, admin_id: string) => {
  const { session_id, participant_id, event_id, adjusted_time, reason } = payload

  if (!session_id) throw new Error('Session ID is required')
  if (!adjusted_time) throw new Error('Check-out time is required')
  if (!reason?.trim()) throw new Error('Reason is required')

  const sessionResult = await pool.query(
    'SELECT * FROM attendance_sessions WHERE session_id = $1',
    [session_id]
  )
  const session = sessionResult.rows[0]
  if (!session) throw new Error('Attendance session not found')
  if (session.check_out_time) throw new Error('Participant already has a check-out time')

  await pool.query(
    `UPDATE attendance_sessions
     SET check_out_time = $1, check_out_method = 'admin_override', updated_at = NOW()
     WHERE session_id = $2`,
    [adjusted_time, session_id]
  )

  const log = await pool.query(
    `INSERT INTO override_logs
      (attendance_session_id, participant_id, event_id, admin_id,
       override_type, reason, original_time, adjusted_time, created_at)
     VALUES ($1,$2,$3,$4,'force_checkout',$5,$6,$7,NOW())
     RETURNING *`,
    [session_id, participant_id, event_id, admin_id, reason.trim(), session.check_out_time, adjusted_time]
  )

  return {
    message: 'Force check-out successful',
    override: log.rows[0]
  }
}

// ── Mark Early Out ───────────────────────────────────────
export const earlyOutService = async (payload: EarlyOutPayload, admin_id: string) => {
  const { session_id, participant_id, event_id, early_out_cutoff, adjusted_time, reason } = payload

  if (!session_id) throw new Error('Session ID is required')
  if (!early_out_cutoff) throw new Error('Early out cutoff time is required')
  if (!adjusted_time) throw new Error('Adjusted check-out time is required')
  if (!reason?.trim()) throw new Error('Reason is required')

  const sessionResult = await pool.query(
    'SELECT * FROM attendance_sessions WHERE session_id = $1',
    [session_id]
  )
  const session = sessionResult.rows[0]
  if (!session) throw new Error('Attendance session not found')

  const original_time = session.check_out_time

  await pool.query(
    `UPDATE attendance_sessions
     SET check_out_time = $1,
         check_out_method = 'early_out',
         early_out_reason = $2,
         early_out_recorded_by = $3,
         updated_at = NOW()
     WHERE session_id = $4`,
    [adjusted_time, reason.trim(), admin_id, session_id]
  )

  const log = await pool.query(
    `INSERT INTO override_logs
      (attendance_session_id, participant_id, event_id, admin_id,
       override_type, reason, original_time, adjusted_time, early_out_cutoff, created_at)
     VALUES ($1,$2,$3,$4,'early_out',$5,$6,$7,$8,NOW())
     RETURNING *`,
    [session_id, participant_id, event_id, admin_id, reason.trim(), original_time, adjusted_time, early_out_cutoff]
  )

  return {
    message: 'Early out recorded successfully',
    override: log.rows[0]
  }
}

// ── Get Override Logs by Event ───────────────────────────
export const getOverrideLogsByEventService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT
       o.override_id, o.override_type, o.reason,
       o.original_time, o.adjusted_time, o.early_out_cutoff, o.created_at,
       p.full_name, p.agent_code,
       u.full_name AS admin_name
     FROM override_logs o
     JOIN participants p ON o.participant_id = p.participant_id
     JOIN users u ON o.admin_id = u.user_id
     WHERE o.event_id = $1
     ORDER BY o.created_at DESC`,
    [event_id]
  )
  return result.rows
}