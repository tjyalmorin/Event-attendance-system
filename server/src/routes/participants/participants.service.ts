import pool from '../../config/database'
import { RegisterPayload } from '../../types/participant.types'

export const registerParticipantService = async (event_id: number, payload: RegisterPayload) => {
  // 1. Check event exists and is open
  const eventResult = await pool.query(
    'SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL',
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new Error('Event not found')
  if (event.status !== 'open') throw new Error('Event registration is not open')

  // 2. Check registration window
  const now = new Date()
  if (now < new Date(event.registration_start)) throw new Error('Registration has not started yet')
  if (now > new Date(event.registration_end)) throw new Error('Registration has already closed')

  // 3. Check capacity
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM participants
     WHERE event_id = $1 AND deleted_at IS NULL AND registration_status != 'cancelled'`,
    [event_id]
  )
  const currentCount = parseInt(countResult.rows[0].count)
  if (currentCount >= event.capacity) throw new Error('Event is already full')

  // 4. Check duplicate registration
  const duplicate = await pool.query(
    'SELECT participant_id FROM participants WHERE event_id = $1 AND agent_code = $2 AND deleted_at IS NULL',
    [event_id, payload.agent_code]
  )
  if (duplicate.rows.length > 0) throw new Error('This agent is already registered for this event')

  // 5. Insert participant — no QR token needed anymore
  const result = await pool.query(
    `INSERT INTO participants
      (event_id, agent_code, full_name, branch_name, team_name,
       registration_status, registered_at)
     VALUES ($1,$2,$3,$4,$5,'confirmed', NOW())
     RETURNING *`,
    [event_id, payload.agent_code, payload.full_name, payload.branch_name, payload.team_name]
  )

  return { participant: result.rows[0] }
}

export const getParticipantsByEventService = async (event_id: number, userBranch?: string) => {
  let query = `SELECT * FROM participants WHERE event_id = $1 AND deleted_at IS NULL`
  const params: any[] = [event_id]

  // If user is staff (not SuperAdmin), filter by branch
  if (userBranch) {
    query += ` AND branch_name = $2`
    params.push(userBranch)
  }

  query += ` ORDER BY registered_at DESC`

  const result = await pool.query(query, params)
  return result.rows
}

export const cancelParticipantService = async (participant_id: number) => {
  const result = await pool.query(
    `UPDATE participants
     SET registration_status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
     WHERE participant_id = $1 AND deleted_at IS NULL
     RETURNING participant_id`,
    [participant_id]
  )
  if (!result.rows[0]) throw new Error('Participant not found')
}