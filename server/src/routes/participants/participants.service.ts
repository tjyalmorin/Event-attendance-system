import pool from '../../config/database.js'
import { RegisterPayload } from '../../types/participant.types.js'
import {
  cacheGet, cacheSet,
  CK, invalidateParticipantCache
} from '../../utils/cache.js'
import { NotFoundError, ValidationError, AppError } from '../../errors/AppError.js'

export const registerParticipantService = async (event_id: number, payload: RegisterPayload) => {
  const { agent_code, full_name, branch_name, team_name, agent_type, custom_responses = {} } = payload

  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')
  if (!full_name?.trim()) throw new ValidationError('Full name is required')
  if (agent_code && agent_code.length > 50) throw new ValidationError('Agent code too long')
  if (full_name.length > 100) throw new ValidationError('Full name too long')

  const eventResult = await pool.query(
    'SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL',
    [event_id]
  )
  const event = eventResult.rows[0]
  if (!event) throw new NotFoundError('Event not found')
  if (event.status !== 'open') throw new ValidationError('Event registration is not open')

  // ── Registration window check in DB time (Asia/Manila) ───────────────────
  const windowCheck = await pool.query(
    `SELECT
       ($1::timestamptz IS NULL OR NOW() >= $1::timestamptz) AS after_start,
       ($2::timestamptz IS NULL OR NOW() <= $2::timestamptz) AS before_end`,
    [event.registration_start, event.registration_end]
  )
  if (!windowCheck.rows[0].after_start) throw new ValidationError('Registration has not started yet')
  if (!windowCheck.rows[0].before_end)  throw new ValidationError('Registration has already closed')

  // ── Validate required custom fields ──────────────────────────────────────
  const formFieldsResult = await pool.query(
    `SELECT field_key, label, is_required, condition FROM event_form_fields
     WHERE event_id = $1 ORDER BY page_number, sort_order`,
    [event_id]
  )
  for (const field of formFieldsResult.rows) {
    if (!field.is_required) continue
    // Skip fields with an unmet condition — they won't be shown to this user
    if (field.condition) {
      const { field_key: condKey, operator, value: condVal } = field.condition
      const userVal = custom_responses[condKey] ?? agent_type ?? ''
      const met = operator === 'eq' ? String(userVal) === condVal : String(userVal) !== condVal
      if (!met) continue
    }
    const answer = custom_responses[field.field_key]
    if (answer === undefined || answer === null || answer === '') {
      throw new ValidationError(`"${field.label}" is required`)
    }
  }

  if (agent_code) {
    const duplicate = await pool.query(
      'SELECT participant_id FROM participants WHERE event_id = $1 AND agent_code = $2 AND deleted_at IS NULL',
      [event_id, agent_code.trim()]
    )
    if (duplicate.rows.length > 0) {
      throw new AppError('This agent is already registered for this event', 409)
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO participants
        (event_id, agent_code, full_name, branch_name, team_name, agent_type,
         custom_responses, registration_status, registered_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed', NOW())
       RETURNING *`,
      [
        event_id,
        agent_code?.trim() || null,
        full_name.trim(),
        branch_name?.trim() || null,
        team_name?.trim() || null,
        agent_type?.trim() || null,
        JSON.stringify(custom_responses),
      ]
    )

    await Promise.all([
      invalidateParticipantCache(event_id),
      import('../../utils/cache.js').then(m => m.cacheDel(CK.EVENT_DETAIL(event_id))),
    ])

    return { participant: result.rows[0] }
  } catch (err: any) {
    if (err.code === '23505') {
      throw new AppError('This agent is already registered for this event', 409)
    }
    throw err
  }
}

export const getParticipantsByEventService = async (event_id: number, branch_name?: string) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')

  const cacheKey = CK.PARTICIPANTS_EVENT(event_id)
  let all = await cacheGet<any[]>(cacheKey)

  if (!all) {
    if (pool.waitingCount > 3) {
      console.warn(`⚠️  getParticipants skipped — pool pressure (waiting: ${pool.waitingCount})`)
      throw new AppError('Server is under high load, please retry in a moment', 503)
    }

    const result = await pool.query(
      `SELECT
         p.participant_id,
         p.event_id,
         p.agent_code,
         p.full_name,
         p.branch_name,
         p.team_name,
         p.agent_type,
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
    await cacheSet(cacheKey, all, 60)
  }

  return branch_name ? all.filter(p => p.branch_name === branch_name) : all
}

export const cancelParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new ValidationError('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET registration_status = 'cancelled', deleted_at = NOW(), updated_at = NOW()
     WHERE participant_id = $1 AND deleted_at IS NULL
     RETURNING participant_id, event_id`,
    [participant_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Participant not found')

  await invalidateParticipantCache(result.rows[0].event_id)
}

export const setLabelService = async (
  participant_id: number,
  label: string | null,
  label_description: string | null
) => {
  if (!participant_id || isNaN(participant_id)) throw new ValidationError('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET label = $1,
         label_description = $2,
         updated_at = NOW()
     WHERE participant_id = $3 AND deleted_at IS NULL
     RETURNING participant_id, event_id, full_name, label, label_description`,
    [label, label ? (label_description || null) : null, participant_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Participant not found')

  await invalidateParticipantCache(result.rows[0].event_id)
  return result.rows[0]
}

export const restoreParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new ValidationError('Valid participant ID is required')

  const result = await pool.query(
    `UPDATE participants
     SET registration_status = 'confirmed', deleted_at = NULL, updated_at = NOW()
     WHERE participant_id = $1 AND registration_status = 'cancelled' AND deleted_at IS NOT NULL
     RETURNING participant_id`,
    [participant_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Participant not found in trash')
}

export const permanentDeleteParticipantService = async (participant_id: number) => {
  if (!participant_id || isNaN(participant_id)) throw new ValidationError('Valid participant ID is required')

  const check = await pool.query(
    `SELECT participant_id FROM participants
     WHERE participant_id = $1 AND registration_status = 'cancelled' AND deleted_at IS NOT NULL`,
    [participant_id]
  )
  if (!check.rows[0]) throw new NotFoundError('Participant not found in trash')

  await pool.query('DELETE FROM scan_logs WHERE participant_id = $1', [participant_id])
  await pool.query('DELETE FROM attendance_sessions WHERE participant_id = $1', [participant_id])
  await pool.query('DELETE FROM participants WHERE participant_id = $1', [participant_id])
}

export const getCancelledParticipantsByEventService = async (event_id: number) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')

  const result = await pool.query(
    `SELECT
       p.participant_id,
       p.event_id,
       p.agent_code,
       p.full_name,
       p.branch_name,
       p.team_name,
       p.agent_type,
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

// ── Form Fields ────────────────────────────────────────────────────────────

export const getFormFieldsService = async (event_id: number) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')

  const result = await pool.query(
    `SELECT field_id, field_key, label, field_type, options, is_required,
            sort_order, page_number, page_title, page_description, page_condition, page_conditions, is_final, condition
     FROM event_form_fields
     WHERE event_id = $1
     ORDER BY page_number ASC, sort_order ASC`,
    [event_id]
  )
  return result.rows
}

export const saveFormFieldsService = async (event_id: number, fields: any[]) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Delete all existing fields for this event then re-insert
    // Simple replace strategy — fine since form builder always sends the full list
    await client.query(
      `DELETE FROM event_form_fields WHERE event_id = $1`,
      [event_id]
    )

    for (const f of fields) {
      await client.query(
        `INSERT INTO event_form_fields
          (event_id, field_key, label, field_type, options, is_required,
           sort_order, page_number, page_title, page_description, page_condition, page_conditions, is_final, condition)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          event_id,
          f.field_key,
          f.label,
          f.field_type,
          f.options ? JSON.stringify(f.options) : null,
          f.is_required ?? false,
          f.sort_order ?? 0,
          f.page_number ?? 1,
          f.page_title ?? null,
          f.page_description ?? null,
          f.page_condition ? JSON.stringify(f.page_condition) : null,
          f.page_conditions ? JSON.stringify(f.page_conditions) : null,
          f.is_final ?? false,
          f.condition ? JSON.stringify(f.condition) : null,
        ]
      )
    }

    await client.query('COMMIT')
    return { saved: fields.length }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}