import pool from '../../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import { CreateEventPayload, UpdateEventPayload } from '../../types/event.types'

export const createEventService = async (created_by: string, payload: CreateEventPayload) => {
  const registration_link = `${uuidv4().split('-')[0]}-${Date.now()}`

  const result = await pool.query(
    `INSERT INTO events
      (created_by, title, description, event_date, start_time, end_time,
       registration_start, registration_end, venue, capacity, checkin_cutoff,
       registration_link, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft')
     RETURNING *`,
    [
      created_by, payload.title, payload.description, payload.event_date,
      payload.start_time, payload.end_time, payload.registration_start,
      payload.registration_end, payload.venue, payload.capacity,
      payload.checkin_cutoff, registration_link
    ]
  )
  return result.rows[0]
}

export const getAllEventsService = async (userId?: string, userRole?: string, userBranch?: string) => {
  // SuperAdmin (admin) sees all events
  if (userRole === 'admin') {
    const result = await pool.query(
      'SELECT * FROM events WHERE deleted_at IS NULL ORDER BY event_date DESC'
    )
    return result.rows
  }

  // Staff (branch admin) sees:
  // 1. Events created by their branch (same branch_name from users table)
  // 2. Events they have temporary admin grant for
  if (userRole === 'staff' && userId && userBranch) {
    const result = await pool.query(
      `SELECT DISTINCT e.* FROM events e
       LEFT JOIN users u ON e.created_by = u.user_id
       LEFT JOIN admin_grants ag ON e.event_id = ag.event_id AND ag.granted_to_user_id = $1
       WHERE e.deleted_at IS NULL 
       AND (u.branch_name = $2 OR ag.grant_id IS NOT NULL)
       ORDER BY e.event_date DESC`,
      [userId, userBranch]
    )
    return result.rows
  }

  // Default: return all events
  const result = await pool.query(
    'SELECT * FROM events WHERE deleted_at IS NULL ORDER BY event_date DESC'
  )
  return result.rows
}

export const getEventByIdService = async (event_id: number) => {
  const result = await pool.query(
    'SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL',
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
         venue=$6, capacity=$7, status=$8, checkin_cutoff=$9,
         version=version+1, updated_at=NOW()
     WHERE event_id=$10 AND deleted_at IS NULL
     RETURNING *`,
    [
      merged.title, merged.description, merged.event_date, merged.start_time,
      merged.end_time, merged.venue, merged.capacity, merged.status,
      merged.checkin_cutoff, event_id
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