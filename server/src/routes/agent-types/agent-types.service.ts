import pool from '../../config/database.js'
import { cacheGet, cacheSet, cacheDel } from '../../utils/cache.js'
import { NotFoundError, ValidationError, AppError } from '../../errors/AppError.js'

const CACHE_KEY = 'agent_types:all'
const CACHE_TTL = 3600 // 1 hour

export const getAllAgentTypesService = async (includeInactive = false) => {
  // For public registration form, only return active types (cached)
  if (!includeInactive) {
    const cached = await cacheGet<any[]>(CACHE_KEY)
    if (cached) return cached
  }

  const result = await pool.query(
    `SELECT agent_type_id, name, display_order, is_active, created_at, updated_at
     FROM agent_types
     ${includeInactive ? '' : 'WHERE is_active = TRUE'}
     ORDER BY display_order ASC, name ASC`
  )

  if (!includeInactive) {
    await cacheSet(CACHE_KEY, result.rows, CACHE_TTL)
  }

  return result.rows
}

export const createAgentTypeService = async (name: string, display_order?: number) => {
  if (!name?.trim()) throw new ValidationError('Agent type name is required')
  if (name.trim().length > 100) throw new ValidationError('Agent type name too long')

  const existing = await pool.query(
    `SELECT agent_type_id FROM agent_types WHERE LOWER(name) = LOWER($1)`,
    [name.trim()]
  )
  if (existing.rows.length > 0) throw new AppError('An agent type with this name already exists', 409)

  // Auto-assign display_order if not provided
  let order = display_order
  if (order === undefined || order === null) {
    const maxRes = await pool.query(`SELECT COALESCE(MAX(display_order), 0) + 1 AS next_order FROM agent_types`)
    order = maxRes.rows[0].next_order
  }

  try {
    const res = await pool.query(
      `INSERT INTO agent_types (name, display_order) VALUES ($1, $2) RETURNING *`,
      [name.trim(), order]
    )
    await cacheDel(CACHE_KEY)
    return res.rows[0]
  } catch (err: any) {
    if (err.code === '23505') throw new AppError('An agent type with this name already exists', 409)
    throw err
  }
}

export const updateAgentTypeService = async (
  agent_type_id: number,
  payload: { name?: string; display_order?: number; is_active?: boolean }
) => {
  const existing = await pool.query(
    `SELECT * FROM agent_types WHERE agent_type_id = $1`,
    [agent_type_id]
  )
  if (!existing.rows[0]) throw new NotFoundError('Agent type not found')

  // Check for duplicate name (excluding self)
  if (payload.name) {
    const dup = await pool.query(
      `SELECT agent_type_id FROM agent_types WHERE LOWER(name) = LOWER($1) AND agent_type_id != $2`,
      [payload.name.trim(), agent_type_id]
    )
    if (dup.rows.length > 0) throw new AppError('An agent type with this name already exists', 409)
  }

  const res = await pool.query(
    `UPDATE agent_types
     SET name          = COALESCE($1, name),
         display_order = COALESCE($2, display_order),
         is_active     = COALESCE($3, is_active),
         updated_at    = NOW()
     WHERE agent_type_id = $4
     RETURNING *`,
    [
      payload.name?.trim() ?? null,
      payload.display_order ?? null,
      payload.is_active ?? null,
      agent_type_id
    ]
  )

  await cacheDel(CACHE_KEY)
  return res.rows[0]
}

export const deleteAgentTypeService = async (agent_type_id: number) => {
  // Check if any participants use this agent type
  const inUse = await pool.query(
    `SELECT COUNT(*) FROM participants WHERE agent_type = (
       SELECT name FROM agent_types WHERE agent_type_id = $1
     ) AND deleted_at IS NULL`,
    [agent_type_id]
  )
  if (parseInt(inUse.rows[0].count) > 0) {
    throw new AppError(
      'Cannot delete: this agent type is used by registered participants. Deactivate it instead.',
      409
    )
  }

  const res = await pool.query(
    `DELETE FROM agent_types WHERE agent_type_id = $1 RETURNING agent_type_id, name`,
    [agent_type_id]
  )
  if (!res.rows[0]) throw new NotFoundError('Agent type not found')

  await cacheDel(CACHE_KEY)
  return res.rows[0]
}

export const reorderAgentTypesService = async (ordered_ids: number[]) => {
  if (!Array.isArray(ordered_ids) || ordered_ids.length === 0) {
    throw new ValidationError('ordered_ids must be a non-empty array')
  }

  // Update display_order for each id based on its position in the array
  for (let i = 0; i < ordered_ids.length; i++) {
    await pool.query(
      `UPDATE agent_types SET display_order = $1, updated_at = NOW() WHERE agent_type_id = $2`,
      [i + 1, ordered_ids[i]]
    )
  }

  await cacheDel(CACHE_KEY)
  return getAllAgentTypesService(true)
}