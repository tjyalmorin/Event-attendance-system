import pool from '../../config/database.js'
import { NotFoundError, ValidationError, AppError } from '../../errors/AppError.js'

const VALID_FIELD_TYPES = ['text', 'textarea', 'number', 'dropdown', 'radio', 'checkbox'] as const
type FieldType = typeof VALID_FIELD_TYPES[number]
const MAX_FIELDS_PER_EVENT = 15

export interface CustomFieldPayload {
  label: string
  field_type: FieldType
  options?: string[] | null
  is_required: boolean
  display_order?: number
  applicable_agent_types?: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const validateFieldPayload = (payload: CustomFieldPayload) => {
  if (!payload.label?.trim()) throw new ValidationError('Field label is required')
  if (payload.label.trim().length > 500) throw new ValidationError('Field label too long (max 500 characters)')
  if (!VALID_FIELD_TYPES.includes(payload.field_type)) {
    throw new ValidationError(`Invalid field type. Must be one of: ${VALID_FIELD_TYPES.join(', ')}`)
  }
  if (['dropdown', 'radio'].includes(payload.field_type)) {
    if (!payload.options || payload.options.length < 2) {
      throw new ValidationError(`${payload.field_type} fields require at least 2 options`)
    }
    if (payload.options.some(o => !o?.trim())) {
      throw new ValidationError('All options must be non-empty strings')
    }
    if (payload.options.length > 20) {
      throw new ValidationError('Maximum 20 options allowed per field')
    }
  }
}

// Lock all fields for an event once a participant registers
export const lockFieldsForEventService = async (event_id: number) => {
  await pool.query(
    `UPDATE event_custom_fields SET is_locked = TRUE, updated_at = NOW()
     WHERE event_id = $1 AND is_locked = FALSE`,
    [event_id]
  )
}

// Check if event has any answers (used to determine lock state)
const eventHasAnswers = async (event_id: number): Promise<boolean> => {
  const res = await pool.query(
    `SELECT COUNT(*) FROM participant_field_answers pfa
     JOIN event_custom_fields ecf ON ecf.field_id = pfa.field_id
     WHERE ecf.event_id = $1`,
    [event_id]
  )
  return parseInt(res.rows[0].count) > 0
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export const getCustomFieldsByEventService = async (event_id: number) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')

  const result = await pool.query(
    `SELECT field_id, event_id, label, field_type, options,
            is_required, display_order, applicable_agent_types, is_locked,
            created_at, updated_at
     FROM event_custom_fields
     WHERE event_id = $1
     ORDER BY display_order ASC, field_id ASC`,
    [event_id]
  )
  return result.rows
}

export const createCustomFieldService = async (event_id: number, payload: CustomFieldPayload) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')
  validateFieldPayload(payload)

  // Check event exists
  const eventCheck = await pool.query(
    `SELECT event_id FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  if (!eventCheck.rows[0]) throw new NotFoundError('Event not found')

  // Check max fields limit
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM event_custom_fields WHERE event_id = $1`,
    [event_id]
  )
  if (parseInt(countRes.rows[0].count) >= MAX_FIELDS_PER_EVENT) {
    throw new AppError(`Maximum of ${MAX_FIELDS_PER_EVENT} questions per event reached`, 400)
  }

  // Auto-assign display_order if not provided
  let order = payload.display_order
  if (order === undefined || order === null) {
    const maxRes = await pool.query(
      `SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM event_custom_fields WHERE event_id = $1`,
      [event_id]
    )
    order = maxRes.rows[0].next_order
  }

  const res = await pool.query(
    `INSERT INTO event_custom_fields
      (event_id, label, field_type, options, is_required, display_order, applicable_agent_types, is_locked)
     VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
     RETURNING *`,
    [
      event_id,
      payload.label.trim(),
      payload.field_type,
      payload.options ? JSON.stringify(payload.options) : null,
      payload.is_required,
      order,
      payload.applicable_agent_types ?? []
    ]
  )
  return res.rows[0]
}

export const updateCustomFieldService = async (field_id: number, payload: Partial<CustomFieldPayload>) => {
  if (!field_id || isNaN(field_id)) throw new ValidationError('Valid field ID is required')

  const existing = await pool.query(
    `SELECT * FROM event_custom_fields WHERE field_id = $1`,
    [field_id]
  )
  if (!existing.rows[0]) throw new NotFoundError('Custom field not found')

  // If locked, only allow updating is_required and applicable_agent_types
  // (label, type, options are frozen once answers exist)
  if (existing.rows[0].is_locked) {
    const res = await pool.query(
      `UPDATE event_custom_fields
       SET is_required             = COALESCE($1, is_required),
           applicable_agent_types  = COALESCE($2, applicable_agent_types),
           updated_at              = NOW()
       WHERE field_id = $3
       RETURNING *`,
      [
        payload.is_required ?? null,
        payload.applicable_agent_types ?? null,
        field_id
      ]
    )
    return res.rows[0]
  }

  // Not locked — full update allowed
  if (payload.label || payload.field_type) {
    validateFieldPayload({ ...existing.rows[0], ...payload } as CustomFieldPayload)
  }

  const res = await pool.query(
    `UPDATE event_custom_fields
     SET label                   = COALESCE($1, label),
         field_type              = COALESCE($2, field_type),
         options                 = COALESCE($3, options),
         is_required             = COALESCE($4, is_required),
         display_order           = COALESCE($5, display_order),
         applicable_agent_types  = COALESCE($6, applicable_agent_types),
         updated_at              = NOW()
     WHERE field_id = $7
     RETURNING *`,
    [
      payload.label?.trim() ?? null,
      payload.field_type ?? null,
      payload.options ? JSON.stringify(payload.options) : null,
      payload.is_required ?? null,
      payload.display_order ?? null,
      payload.applicable_agent_types ?? null,
      field_id
    ]
  )
  return res.rows[0]
}

export const deleteCustomFieldService = async (field_id: number) => {
  if (!field_id || isNaN(field_id)) throw new ValidationError('Valid field ID is required')

  const existing = await pool.query(
    `SELECT * FROM event_custom_fields WHERE field_id = $1`,
    [field_id]
  )
  if (!existing.rows[0]) throw new NotFoundError('Custom field not found')

  if (existing.rows[0].is_locked) {
    throw new AppError(
      'Cannot delete: this question is locked because participants have already answered it.',
      409
    )
  }

  await pool.query(`DELETE FROM event_custom_fields WHERE field_id = $1`, [field_id])
  return { deleted: true }
}

export const reorderCustomFieldsService = async (event_id: number, ordered_ids: number[]) => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')
  if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
    throw new ValidationError('ordered_ids must be a non-empty array')
  }

  for (let i = 0; i < ordered_ids.length; i++) {
    await pool.query(
      `UPDATE event_custom_fields
       SET display_order = $1, updated_at = NOW()
       WHERE field_id = $2 AND event_id = $3`,
      [i + 1, ordered_ids[i], event_id]
    )
  }

  return getCustomFieldsByEventService(event_id)
}

// ── Answers ────────────────────────────────────────────────────────────────────

export interface FieldAnswer {
  field_id: number
  answer: string | null
}

export const saveParticipantAnswersService = async (
  participant_id: number,
  event_id: number,
  answers: FieldAnswer[],
  agent_type: string
) => {
  if (!Array.isArray(answers) || answers.length === 0) return

  // Fetch all fields for this event
  const fields = await getCustomFieldsByEventService(event_id)

  // Determine which fields are applicable to this agent_type
  const applicableFields = fields.filter(f => {
    if (!f.applicable_agent_types || f.applicable_agent_types.length === 0) return true
    return f.applicable_agent_types.includes(agent_type)
  })

  const applicableFieldIds = new Set(applicableFields.map((f: any) => f.field_id))

  // Validate required fields are answered
  for (const field of applicableFields) {
    if (!field.is_required) continue
    const answer = answers.find(a => a.field_id === field.field_id)
    if (!answer || answer.answer === null || answer.answer === '') {
      throw new ValidationError(`"${field.label}" is required`)
    }
  }

  // Insert only applicable answers
  for (const ans of answers) {
    if (!applicableFieldIds.has(ans.field_id)) continue

    await pool.query(
      `INSERT INTO participant_field_answers (participant_id, field_id, answer)
       VALUES ($1, $2, $3)
       ON CONFLICT (participant_id, field_id)
       DO UPDATE SET answer = EXCLUDED.answer, updated_at = NOW()`,
      [participant_id, ans.field_id, ans.answer ?? null]
    )
  }

  // Lock all fields for this event now that at least one participant has answered
  await lockFieldsForEventService(event_id)
}

export const getParticipantAnswersService = async (participant_id: number) => {
  const res = await pool.query(
    `SELECT pfa.answer_id, pfa.participant_id, pfa.field_id, pfa.answer,
            ecf.label, ecf.field_type, ecf.applicable_agent_types
     FROM participant_field_answers pfa
     JOIN event_custom_fields ecf ON ecf.field_id = pfa.field_id
     WHERE pfa.participant_id = $1`,
    [participant_id]
  )
  return res.rows
}

// Get all answers for an event — used for Excel export
export const getAllAnswersByEventService = async (event_id: number) => {
  const res = await pool.query(
    `SELECT
       p.participant_id, p.agent_code, p.full_name, p.branch_name,
       p.team_name, p.agent_type, p.registration_status, p.registered_at,
       p.label, p.label_description,
       ecf.field_id, ecf.label AS question_label, ecf.field_type,
       ecf.applicable_agent_types, ecf.display_order,
       pfa.answer
     FROM participants p
     LEFT JOIN participant_field_answers pfa ON pfa.participant_id = p.participant_id
     LEFT JOIN event_custom_fields ecf ON ecf.field_id = pfa.field_id
     WHERE p.event_id = $1
       AND p.deleted_at IS NULL
       AND p.registration_status = 'confirmed'
     ORDER BY p.registered_at ASC, ecf.display_order ASC`,
    [event_id]
  )
  return res.rows
}