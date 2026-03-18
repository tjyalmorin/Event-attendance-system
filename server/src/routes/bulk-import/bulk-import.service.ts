import pool from '../../config/database.js'
import { ValidationError, NotFoundError, AppError } from '../../errors/AppError.js'
import { invalidateParticipantCache } from '../../utils/cache.js'

export interface ImportRow {
  rowNumber: number
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  agent_type: string
}

export interface ImportError {
  row: number
  agent_code: string
  reason: string
}

export interface ImportResult {
  success: boolean
  total_rows: number
  success_count: number
  error_count: number
  errors: ImportError[]
  import_id?: number
}

// ── Validate all rows BEFORE inserting anything ────────────────────────────────
// Returns errors array — if non-empty, entire import is rejected
const validateRows = async (
  rows: ImportRow[],
  event_id: number,
  validBranches: string[],
  validAgentTypes: string[]
): Promise<ImportError[]> => {
  const errors: ImportError[] = []
  const seenCodes = new Set<string>()

  for (const row of rows) {
    const rowErrors: string[] = []

    // Required field checks
    if (!row.agent_code?.trim()) rowErrors.push('agent_code is required')
    if (!row.full_name?.trim()) rowErrors.push('full_name is required')
    if (!row.branch_name?.trim()) rowErrors.push('branch_name is required')
    if (!row.team_name?.trim()) rowErrors.push('team_name is required')
    if (!row.agent_type?.trim()) rowErrors.push('agent_type is required')

    // Length checks
    if (row.agent_code?.length > 50) rowErrors.push('agent_code too long (max 50 chars)')
    if (row.full_name?.length > 255) rowErrors.push('full_name too long (max 255 chars)')

    // Duplicate within file
    if (row.agent_code?.trim()) {
      if (seenCodes.has(row.agent_code.trim().toLowerCase())) {
        rowErrors.push(`Duplicate agent_code "${row.agent_code}" within file`)
      } else {
        seenCodes.add(row.agent_code.trim().toLowerCase())
      }
    }

    // Duplicate in DB (already registered for this event)
    if (row.agent_code?.trim()) {
      const existing = await pool.query(
        `SELECT participant_id FROM participants
         WHERE event_id = $1 AND agent_code = $2 AND deleted_at IS NULL`,
        [event_id, row.agent_code.trim()]
      )
      if (existing.rows.length > 0) {
        rowErrors.push(`Agent code "${row.agent_code}" is already registered for this event`)
      }
    }

    // Valid agent type check
    if (row.agent_type?.trim() && validAgentTypes.length > 0) {
      const isValidType = validAgentTypes.some(
        t => t.toLowerCase() === row.agent_type.trim().toLowerCase()
      )
      if (!isValidType) {
        rowErrors.push(`Invalid agent_type "${row.agent_type}". Valid types: ${validAgentTypes.join(', ')}`)
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: row.rowNumber,
        agent_code: row.agent_code ?? '(blank)',
        reason: rowErrors.join('; ')
      })
    }
  }

  return errors
}

export const bulkImportParticipantsService = async (
  event_id: number,
  rows: ImportRow[],
  imported_by: string,
  file_name: string
): Promise<ImportResult> => {
  if (!event_id || isNaN(event_id)) throw new ValidationError('Valid event ID is required')
  if (!rows || rows.length === 0) throw new ValidationError('No rows to import')
  if (rows.length > 500) throw new ValidationError('Maximum 500 rows per import')

  // Check event exists and is open
  const eventRes = await pool.query(
    `SELECT * FROM events WHERE event_id = $1 AND deleted_at IS NULL`,
    [event_id]
  )
  const event = eventRes.rows[0]
  if (!event) throw new NotFoundError('Event not found')
  if (event.status !== 'open') throw new AppError('Event is not open for registration', 400)

  // Get valid agent types from DB
  const agentTypesRes = await pool.query(
    `SELECT name FROM agent_types WHERE is_active = TRUE`
  )
  const validAgentTypes = agentTypesRes.rows.map((r: any) => r.name)

  // Get valid branches from DB (just for reference — we don't hard-block on this)
  const branchesRes = await pool.query(`SELECT name FROM branches`)
  const validBranches = branchesRes.rows.map((r: any) => r.name)

  // ── Phase 1: Validate ALL rows — reject entire file if any errors ──────────
  const errors = await validateRows(rows, event_id, validBranches, validAgentTypes)

  if (errors.length > 0) {
    // Log the failed attempt
    await pool.query(
      `INSERT INTO bulk_import_logs
        (event_id, imported_by, file_name, total_rows, success_count, error_count, errors, status)
       VALUES ($1, $2, $3, $4, 0, $5, $6, 'failed')`,
      [event_id, imported_by, file_name, rows.length, errors.length, JSON.stringify(errors)]
    )

    return {
      success: false,
      total_rows: rows.length,
      success_count: 0,
      error_count: errors.length,
      errors
    }
  }

  // ── Phase 2: All rows valid — insert all ───────────────────────────────────
  let successCount = 0

  for (const row of rows) {
    await pool.query(
      `INSERT INTO participants
        (event_id, agent_code, full_name, branch_name, team_name, agent_type,
         registration_status, registered_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', NOW(), NOW())`,
      [
        event_id,
        row.agent_code.trim(),
        row.full_name.trim(),
        row.branch_name.trim(),
        row.team_name.trim(),
        row.agent_type.trim()
      ]
    )
    successCount++
  }

  // Invalidate participant cache
  await invalidateParticipantCache(event_id)

  // Log the successful import
  const importLog = await pool.query(
    `INSERT INTO bulk_import_logs
      (event_id, imported_by, file_name, total_rows, success_count, error_count, errors, status)
     VALUES ($1, $2, $3, $4, $5, 0, '[]', 'completed')
     RETURNING import_id`,
    [event_id, imported_by, file_name, rows.length, successCount]
  )

  return {
    success: true,
    total_rows: rows.length,
    success_count: successCount,
    error_count: 0,
    errors: [],
    import_id: importLog.rows[0].import_id
  }
}

export const getBulkImportLogsByEventService = async (event_id: number) => {
  const res = await pool.query(
    `SELECT
       bil.import_id, bil.file_name, bil.total_rows, bil.success_count,
       bil.error_count, bil.errors, bil.status, bil.created_at,
       u.full_name AS imported_by_name
     FROM bulk_import_logs bil
     JOIN users u ON u.user_id = bil.imported_by
     WHERE bil.event_id = $1
     ORDER BY bil.created_at DESC`,
    [event_id]
  )
  return res.rows
}