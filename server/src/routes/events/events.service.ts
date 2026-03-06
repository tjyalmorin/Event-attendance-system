import pool from '../../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import { CreateEventPayload, UpdateEventPayload } from '../../types/event.types.js'
import {
  cacheGet, cacheSet, cacheDel,
  CK, TTL, invalidateEventCache
} from '../../utils/cache.js'

// ── Create ────────────────────────────────────────────────────────────────────
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

  const event = result.rows[0]

  // Assign staff via event_permissions
  if (payload.staff_ids && payload.staff_ids.length > 0) {
    for (const uid of payload.staff_ids) {
      await pool.query(
        `INSERT INTO event_permissions (event_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (event_id, user_id) DO NOTHING`,
        [event.event_id, uid]
      )
    }
  }

  // Invalidate event list caches
  await invalidateEventCache()

  return event
}

// ── Get All ───────────────────────────────────────────────────────────────────
export const getAllEventsService = async (
  userId?: string,
  userRole?: string,
  _userBranch?: string
) => {
  const countJoin = `
    LEFT JOIN (
      SELECT event_id, COUNT(*)::int AS registered_count
      FROM participants
      WHERE deleted_at IS NULL
        AND registration_status != 'cancelled'
      GROUP BY event_id
    ) pc ON pc.event_id = e.event_id
  `

  // ── Admin: cache the full list ───────────────────────────────────────────
  if (userRole === 'admin') {
    const cacheKey = CK.EVENTS_LIST_ADMIN
    const cached = await cacheGet<any[]>(cacheKey)
    if (cached) return cached

    const result = await pool.query(
      `SELECT e.*,
              TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
              COALESCE(pc.registered_count, 0) AS registered_count
       FROM events e
       ${countJoin}
       WHERE e.deleted_at IS NULL
       ORDER BY e.event_date DESC`
    )
    await cacheSet(cacheKey, result.rows, TTL.SHORT)
    return result.rows
  }

  // ── Staff: cache per-user filtered list ─────────────────────────────────
  if (userRole === 'staff' && userId) {
    const cacheKey = CK.EVENTS_LIST_STAFF(userId)
    const cached = await cacheGet<any[]>(cacheKey)
    if (cached) return cached

    const result = await pool.query(
      `SELECT DISTINCT e.*,
              TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
              COALESCE(pc.registered_count, 0) AS registered_count
       FROM events e
       ${countJoin}
       INNER JOIN event_permissions ep
         ON ep.event_id = e.event_id
         AND ep.user_id = $1
       WHERE e.deleted_at IS NULL
       ORDER BY e.event_date DESC`,
      [userId]
    )
    await cacheSet(cacheKey, result.rows, TTL.SHORT)
    return result.rows
  }

  // Fallback
  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     ${countJoin}
     WHERE e.deleted_at IS NULL
     ORDER BY e.event_date DESC`
  )
  return result.rows
}

// ── Get By ID ─────────────────────────────────────────────────────────────────
export const getEventByIdService = async (event_id: number) => {
  const cacheKey = CK.EVENT_DETAIL(event_id)
  const cached = await cacheGet<any>(cacheKey)
  if (cached) return cached

  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*)::int AS registered_count
       FROM participants
       WHERE deleted_at IS NULL
         AND registration_status != 'cancelled'
         AND event_id = $1
       GROUP BY event_id
     ) pc ON pc.event_id = e.event_id
     WHERE e.event_id = $1
       AND e.deleted_at IS NULL`,
    [event_id]
  )
  if (!result.rows[0]) throw new Error('Event not found')

  await cacheSet(cacheKey, result.rows[0], TTL.MEDIUM)
  return result.rows[0]
}

// ── Update ────────────────────────────────────────────────────────────────────
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

  await invalidateEventCache(event_id)
  return result.rows[0]
}

// ── Soft Delete ───────────────────────────────────────────────────────────────
export const softDeleteEventService = async (event_id: number) => {
  const result = await pool.query(
    'UPDATE events SET deleted_at = NOW() WHERE event_id = $1 AND deleted_at IS NULL RETURNING event_id',
    [event_id]
  )
  if (!result.rows[0]) throw new Error('Event not found')

  await invalidateEventCache(event_id)
}

// ── Assign Permission ─────────────────────────────────────────────────────────
export const assignPermissionService = async (event_id: number, user_id: string) => {
  const result = await pool.query(
    `INSERT INTO event_permissions (user_id, event_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, event_id) DO NOTHING
     RETURNING *`,
    [user_id, event_id]
  )
  await cacheDel(CK.EVENTS_LIST_STAFF(user_id))
  return result.rows[0]
}

// ── Trash Bin ─────────────────────────────────────────────────────────────────
export const getTrashedEventsService = async () => {
  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*)::int AS registered_count
       FROM participants
       WHERE deleted_at IS NULL
         AND registration_status != 'cancelled'
       GROUP BY event_id
     ) pc ON pc.event_id = e.event_id
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

  await invalidateEventCache(event_id)
  return result.rows[0]
}

export const permanentDeleteEventService = async (event_id: number) => {
  const check = await pool.query(
    `SELECT event_id FROM events WHERE event_id = $1 AND deleted_at IS NOT NULL`,
    [event_id]
  )
  if (!check.rows[0]) throw new Error('Event not found in trash')

  await pool.query('DELETE FROM scan_logs WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM attendance_sessions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM participants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM event_permissions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM admin_grants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM events WHERE event_id = $1', [event_id])

  await invalidateEventCache(event_id)
}

// ── Assigned Staff ────────────────────────────────────────────────────────────
export const getEventStaffService = async (event_id: number) => {
  const cacheKey = CK.EVENT_STAFF(event_id)
  const cached = await cacheGet<any[]>(cacheKey)
  if (cached) return cached

  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.agent_code, u.branch_name, u.email,
            ep.created_at as assigned_at
     FROM event_permissions ep
     INNER JOIN users u ON u.user_id = ep.user_id
     WHERE ep.event_id = $1
       AND u.deleted_at IS NULL
     ORDER BY ep.created_at ASC`,
    [event_id]
  )
  await cacheSet(cacheKey, result.rows, TTL.MEDIUM)
  return result.rows
}

export const removeEventStaffService = async (event_id: number, user_id: string) => {
  const result = await pool.query(
    `DELETE FROM event_permissions
     WHERE event_id = $1 AND user_id = $2
     RETURNING permission_id`,
    [event_id, user_id]
  )
  if (!result.rows[0]) throw new Error('Permission not found')

  await Promise.all([
    cacheDel(CK.EVENT_STAFF(event_id)),
    cacheDel(CK.EVENTS_LIST_STAFF(user_id)),
  ])
  return result.rows[0]
}