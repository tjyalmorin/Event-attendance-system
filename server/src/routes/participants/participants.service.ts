import pool from '../../config/database'
import { RegisterPayload } from '../../types/participant.types'

export const registerParticipantService = async (event_id: number, payload: RegisterPayload) => {
  const { agent_code, full_name, branch_name, team_name } = payload

  // Validate inputs
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')
  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!full_name?.trim()) throw new Error('Full name is required')
  if (!branch_name?.trim()) throw new Error('Branch name is required')
  if (!team_name?.trim()) throw new Error('Team name is required')
  if (agent_code.length > 50) throw new Error('Agent code too long')
  if (full_name.length > 100) throw new Error('Full name too long')

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

  // 4. Check duplicate
  const duplicate = await pool.query(
    'SELECT participant_id FROM participants WHERE event_id = $1 AND agent_code = $2 AND deleted_at IS NULL',
    [event_id, agent_code.trim()]
  )
  if (duplicate.rows.length > 0) throw new Error('This agent is already registered for this event')

  // 5. Insert participant
  const result = await pool.query(
    `INSERT INTO participants
      (event_id, agent_code, full_name, branch_name, team_name,
       registration_status, registered_at)
     VALUES ($1,$2,$3,$4,$5,'confirmed', NOW())
     RETURNING *`,
    [event_id, agent_code.trim(), full_name.trim(), branch_name.trim(), team_name.trim()]
  )

  return { participant: result.rows[0] }
}

export const getParticipantsByEventService = async (event_id: number) => {
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')

  const result = await pool.query(
    `SELECT * FROM participants
     WHERE event_id = $1 AND deleted_at IS NULL
     ORDER BY registered_at DESC`,
    [event_id]
  )
  return result.rows
}

export const cancelParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new Error('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET registration_status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
     WHERE participant_id = $1 AND deleted_at IS NULL
     RETURNING participant_id`,
    [participant_id]
  )
  if (!result.rows[0]) throw new Error('Participant not found')
}