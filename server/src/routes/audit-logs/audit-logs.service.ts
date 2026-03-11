import pool from '../../config/database.js'

export interface AuditLogEntry {
  log_id: number
  actor_id: string | null
  actor_name: string
  actor_role: string
  action: 'created' | 'edited' | 'deactivated' | 'reactivated' | 'deleted' | 'password_changed'
  target_id: string | null
  target_name: string
  target_role: string
  details: string | null
  created_at: string
}

export const createAuditLogService = async (payload: {
  actor_id: string
  actor_name: string
  actor_role: string
  action: AuditLogEntry['action']
  target_id: string
  target_name: string
  target_role: string
  details?: string | null
}): Promise<AuditLogEntry> => {
  const { actor_id, actor_name, actor_role, action, target_id, target_name, target_role, details } = payload
  const result = await pool.query(
    `INSERT INTO account_audit_logs
      (actor_id, actor_name, actor_role, action, target_id, target_name, target_role, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [actor_id, actor_name, actor_role, action, target_id, target_name, target_role, details ?? null]
  )
  return result.rows[0]
}

export const getAuditLogsService = async (limit = 500): Promise<AuditLogEntry[]> => {
  const result = await pool.query(
    `SELECT * FROM account_audit_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows
}

// Delete specific logs by ID array
export const deleteAuditLogsByIdsService = async (logIds: number[]): Promise<number> => {
  if (!logIds.length) return 0
  const result = await pool.query(
    `DELETE FROM account_audit_logs WHERE log_id = ANY($1::int[])`,
    [logIds]
  )
  return result.rowCount ?? 0
}

// Delete all logs older than X days (auto-retention)
export const deleteAuditLogsOlderThanService = async (days: number): Promise<number> => {
  const result = await pool.query(
    `DELETE FROM account_audit_logs
     WHERE created_at < NOW() - INTERVAL '1 day' * $1`,
    [days]
  )
  return result.rowCount ?? 0
}

// Delete all logs within a date range (inclusive)
export const deleteAuditLogsByDateRangeService = async (from: string, to: string): Promise<number> => {
  const result = await pool.query(
    `DELETE FROM account_audit_logs
     WHERE created_at::date BETWEEN $1::date AND $2::date`,
    [from, to]
  )
  return result.rowCount ?? 0
}

// Delete ALL logs
export const clearAllAuditLogsService = async (): Promise<number> => {
  const result = await pool.query(`DELETE FROM account_audit_logs`)
  return result.rowCount ?? 0
}