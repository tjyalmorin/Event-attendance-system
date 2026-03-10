import pool from '../../config/database.js'
import { RegisterPayload } from '../../types/participant.types.js'
import {
  cacheGet, cacheSet,
  CK, TTL, invalidateParticipantCache
} from '../../utils/cache.js'

export const registerParticipantService = async (event_id: number, payload: RegisterPayload) => {
  const { agent_code, full_name, branch_name, team_name } = payload

  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')
  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!full_name?.trim()) throw new Error('Full name is required')
  if (!branch_name?.trim()) throw new Error('Branch name is required')
  if (!team_name?.trim()) throw new Error('Team name is required')
  if (agent_code.length > 50) throw new Error('Agent code too long')
  if (full_name.length > 100) throw new Error('Full name too long')

  const eventResult = await pool.query(
    'SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL',
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new Error('Event not found')
  if (event.status !== 'open') throw new Error('Event registration is not open')

  const now = new Date()
  if (event.registration_start && now < new Date(event.registration_start))
    throw new Error('Registration has not started yet')
  if (event.registration_end && now > new Date(event.registration_end))
    throw new Error('Registration has already closed')

  const duplicate = await pool.query(
    'SELECT participant_id FROM participants WHERE event_id = $1 AND agent_code = $2 AND deleted_at IS NULL',
    [event_id, agent_code.trim()]
  )
  if (duplicate.rows.length > 0) throw new Error('This agent is already registered for this event')

  // ── Option 2: Resolve photo_url from agents table ──────
  // We do NOT copy photo_url into participants.
  // The agents table is the single source of truth for agent photos.
  // At registration time, we only check if a photo exists — it will be
  // resolved live via JOIN on agent_code whenever the participant is fetched.
  // This is a read-only lookup; nothing is written to participants.photo_url.

  const result = await pool.query(
    `INSERT INTO participants
      (event_id, agent_code, full_name, branch_name, team_name,
       registration_status, registered_at)
     VALUES ($1,$2,$3,$4,$5,'confirmed', NOW())
     RETURNING *`,
    [event_id, agent_code.trim(), full_name.trim(), branch_name.trim(), team_name.trim()]
  )

  // Invalidate participants cache and event detail (registered_count changes)
  await Promise.all([
    invalidateParticipantCache(event_id),
    import('../../utils/cache.js').then(m => m.cacheDel(CK.EVENT_DETAIL(event_id))),
  ])

  return { participant: result.rows[0] }
}

export const getParticipantsByEventService = async (event_id: number, branch_name?: string) => {
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')

  const cacheKey = CK.PARTICIPANTS_EVENT(event_id)
  let all = await cacheGet<any[]>(cacheKey)

  if (!all) {
    // ── Option 2: JOIN agents table to resolve photo_url live ──
    // photo_url is NOT stored on participants — it lives in the agents table.
    // LEFT JOIN ensures participants without a photo still appear (photo_url = null).
    const result = await pool.query(
      `SELECT
         p.participant_id,
         p.event_id,
         p.agent_code,
         p.full_name,
         p.branch_name,
         p.team_name,
         p.registration_status,
         p.registered_at,
         p.updated_at,
         p.label,
         p.label_description,
         a.photo_url
       FROM participants p
       LEFT JOIN agents a ON a.agent_code = p.agent_code
       WHERE p.event_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.registered_at DESC`,
      [event_id]
    )
    all = result.rows
    await cacheSet(cacheKey, all, TTL.SHORT)
  }

  // Filter in memory for staff — no extra DB round-trip
  return branch_name ? all.filter(p => p.branch_name === branch_name) : all
}

export const cancelParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new Error('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET registration_status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
     WHERE participant_id = $1 AND deleted_at IS NULL
     RETURNING participant_id, event_id`,
    [participant_id]
  )
  if (!result.rows[0]) throw new Error('Participant not found')

  await invalidateParticipantCache(result.rows[0].event_id)
}

export const setLabelService = async (
  participant_id: number,
  label: string | null,
  label_description: string | null
) => {
  if (!participant_id || isNaN(participant_id)) throw new Error('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET label = $1,
         label_description = $2,
         updated_at = NOW()
     WHERE participant_id = $3 AND deleted_at IS NULL
     RETURNING participant_id, event_id, full_name, label, label_description`,
    [label, label ? (label_description || null) : null, participant_id]
  )
  if (!result.rows[0]) throw new Error('Participant not found')

  await invalidateParticipantCache(result.rows[0].event_id)
  return result.rows[0]
}

// ── Trash Bin ─────────────────────────────────────────────────────────────────

export const restoreParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new Error('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET registration_status = 'confirmed', deleted_at = NULL, updated_at = NOW()
     WHERE participant_id = $1 AND registration_status = 'cancelled' AND deleted_at IS NOT NULL
     RETURNING participant_id`,
    [participant_id]
  )
  if (!result.rows[0]) throw new Error('Participant not found in trash')
}

export const permanentDeleteParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new Error('Valid participant ID is required')

  const check = await pool.query(
    `SELECT participant_id FROM participants WHERE participant_id = $1 AND registration_status = 'cancelled' AND deleted_at IS NOT NULL`,
    [participant_id]
  )
  if (!check.rows[0]) throw new Error('Participant not found in trash')

  await pool.query('DELETE FROM scan_logs WHERE participant_id = $1', [participant_id])
  await pool.query('DELETE FROM attendance_sessions WHERE participant_id = $1', [participant_id])
  await pool.query('DELETE FROM participants WHERE participant_id = $1', [participant_id])
}

export const getCancelledParticipantsByEventService = async (event_id: number) => {
  if (!event_id || isNaN(event_id)) throw new Error('Valid event ID is required')

  const result = await pool.query(
    `SELECT
       p.participant_id,
       p.event_id,
       p.agent_code,
       p.full_name,
       p.branch_name,
       p.team_name,
       p.registration_status,
       p.registered_at,
       p.updated_at,
       p.label,
       p.label_description,
       a.photo_url
     FROM participants p
     LEFT JOIN agents a ON a.agent_code = p.agent_code
     WHERE p.event_id = $1
       AND p.registration_status = 'cancelled'
       AND p.deleted_at IS NOT NULL
     ORDER BY p.updated_at DESC`,
    [event_id]
  )
  return result.rows
}