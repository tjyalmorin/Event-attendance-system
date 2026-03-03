import pool from '../../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import { CreateEventPayload, UpdateEventPayload } from '../../types/event.types'

export const createEventService = async (created_by: string, payload: CreateEventPayload) => {
  const registration_link = `${uuidv4().split('-')[0]}-${Date.now()}`

  const result = await pool.query(
    `INSERT INTO events
      (created_by, title, description, event_date, start_time, end_time,
       registration_start, registration_end, venue, checkin_cutoff,
       registration_link, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft')
     RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, 0::int as registered_count`,
    [
      created_by, payload.title, payload.description, payload.event_date,
      payload.start_time, payload.end_time, payload.registration_start,
      payload.registration_end, payload.venue,
      payload.checkin_cutoff, registration_link
    ]
  )
  return result.rows[0]
}

export const getAllEventsService = async (userId?: string, userRole?: string, userBranch?: string) => {
  const countSubquery = `(
    SELECT COUNT(*) FROM participants p
    WHERE p.event_id = e.event_id
    AND p.deleted_at IS NULL
    AND p.registration_status != 'cancelled'
  )::int AS registered_count`

  if (userRole === 'admin') {
    const result = await pool.query(
      `SELECT e.*, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date, ${countSubquery}
       FROM events e WHERE e.deleted_at IS NULL ORDER BY e.event_date DESC`
    )
    return result.rows
  }

  if (userRole === 'staff' && userId && userBranch) {
    const result = await pool.query(
      `SELECT DISTINCT e.*, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date, ${countSubquery}
       FROM events e
       LEFT JOIN users u ON e.created_by = u.user_id
       LEFT JOIN admin_grants ag ON e.event_id = ag.event_id AND ag.granted_to_user_id = $1
       WHERE e.deleted_at IS NULL 
       AND (u.branch_name = $2 OR ag.grant_id IS NOT NULL)
       ORDER BY e.event_date DESC`,
      [userId, userBranch]
    )
    return result.rows
  }

  const result = await pool.query(
    `SELECT e.*, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date, ${countSubquery}
     FROM events e WHERE e.deleted_at IS NULL ORDER BY e.event_date DESC`
  )
  return result.rows
}

export const getEventByIdService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT e.*, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date,
      (SELECT COUNT(*) FROM participants p
       WHERE p.event_id = e.event_id AND p.deleted_at IS NULL
       AND p.registration_status != 'cancelled')::int AS registered_count
     FROM events e WHERE e.event_id = $1 AND e.deleted_at IS NULL`,
    [event_id]
  )
  if (!result.rows[0]) throw new Error('Event not found')
  return result.rows[0]
}

export const updateEventService = async (event_id: number, payload: UpdateEventPayload) => {
  const current = await getEventByIdService(event_id)
  const merged = { ...current, ...payload }

  const result = await pool.query(
    `UPDATE events
     SET title=$1, description=$2, event_date=$3, start_time=$4, end_time=$5,
         venue=$6, status=$7, checkin_cutoff=$8,
         registration_start=$9, registration_end=$10,
         version=version+1, updated_at=NOW()
     WHERE event_id=$11 AND deleted_at IS NULL
     RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date`,
    [
      merged.title, merged.description, merged.event_date, merged.start_time,
      merged.end_time, merged.venue, merged.status,
      merged.checkin_cutoff, merged.registration_start, merged.registration_end,
      event_id
    ]
  )
  return result.rows[0]
}

export const softDeleteEventService = async (event_id: number) => {
  const result = await pool.query(
    'UPDATE events SET deleted_at = NOW() WHERE event_id = $1 AND deleted_at IS NULL RETURNING event_id',
    [event_id]
  )
  if (!result.rows[0]) throw new Error('Event not found')
}

export const assignPermissionService = async (event_id: number, user_id: string) => {
  const result = await pool.query(
    `INSERT INTO event_permissions (user_id, event_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, event_id) DO NOTHING
     RETURNING *`,
    [user_id, event_id]
  )
  return result.rows[0]
}

// ── Feature 3: Trash Bin ──────────────────────────────────────────────────────

export const getTrashedEventsService = async () => {
  const result = await pool.query(
    `SELECT e.*, TO_CHAR(e.event_date, 'YYYY-MM-DD') as event_date,
      (SELECT COUNT(*) FROM participants p
       WHERE p.event_id = e.event_id AND p.deleted_at IS NULL
       AND p.registration_status != 'cancelled')::int AS registered_count
     FROM events e
     WHERE e.deleted_at IS NOT NULL
     ORDER BY e.deleted_at DESC`
  )
  return result.rows
}

export const restoreEventService = async (event_id: number) => {
  const result = await pool.query(
    `UPDATE events SET deleted_at = NULL, updated_at = NOW()
     WHERE event_id = $1 AND deleted_at IS NOT NULL
     RETURNING event_id, title`,
    [event_id]
  )
  if (!result.rows[0]) throw new Error('Event not found in trash')
  return result.rows[0]
}

export const permanentDeleteEventService = async (event_id: number) => {
  // Only allow permanent delete of already-soft-deleted events
  const check = await pool.query(
    `SELECT event_id FROM events WHERE event_id = $1 AND deleted_at IS NOT NULL`,
    [event_id]
  )
  if (!check.rows[0]) throw new Error('Event not found in trash')

  // Cascade delete in order (respect foreign key constraints)
  await pool.query('DELETE FROM scan_logs WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM attendance_sessions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM participants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM event_permissions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM admin_grants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM events WHERE event_id = $1', [event_id])
}