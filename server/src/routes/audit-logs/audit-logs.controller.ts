import { Request, Response } from 'express'
import pool from '../../config/database.js'
import {
  createAuditLogService,
  getAuditLogsService,
  deleteAuditLogsByIdsService,
  deleteAuditLogsOlderThanService,
  deleteAuditLogsByDateRangeService,
  clearAllAuditLogsService,
} from './audit-logs.service.js'

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user
    const { action, target_id, target_name, target_role, details } = req.body

    if (!action || !target_id || !target_name || !target_role) {
      res.status(400).json({ error: 'Missing required fields: action, target_id, target_name, target_role' })
      return
    }

    // JWT only contains user_id and role — fetch full_name from DB
    const userResult = await pool.query(
      'SELECT full_name FROM users WHERE user_id = $1 AND deleted_at IS NULL',
      [actor.user_id]
    )
    const actorName = userResult.rows[0]?.full_name ?? 'Unknown'

    const log = await createAuditLogService({
      actor_id:   actor.user_id,
      actor_name: actorName,
      actor_role: actor.role,
      action,
      target_id,
      target_name,
      target_role,
      details: details ?? null,
    })

    res.status(201).json(log)
  } catch (err: any) {
    console.error('createAuditLog error:', err)
    res.status(500).json({ error: err.message || 'Failed to create audit log' })
  }
}

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 500
    const logs = await getAuditLogsService(limit)
    res.json(logs)
  } catch (err: any) {
    console.error('getAuditLogs error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' })
  }
}

// DELETE /api/audit-logs/bulk  — body: { log_ids: number[] }
export const deleteAuditLogsByIds = async (req: Request, res: Response) => {
  try {
    const { log_ids } = req.body
    if (!Array.isArray(log_ids) || log_ids.length === 0) {
      res.status(400).json({ error: 'log_ids must be a non-empty array' })
      return
    }
    const deleted = await deleteAuditLogsByIdsService(log_ids.map(Number))
    res.json({ deleted })
  } catch (err: any) {
    console.error('deleteAuditLogsByIds error:', err)
    res.status(500).json({ error: err.message || 'Failed to delete logs' })
  }
}

// DELETE /api/audit-logs/retention  — body: { days: number }
export const deleteAuditLogsOlderThan = async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.body.days)
    if (!days || days < 1) {
      res.status(400).json({ error: 'days must be a positive integer' })
      return
    }
    const deleted = await deleteAuditLogsOlderThanService(days)
    res.json({ deleted })
  } catch (err: any) {
    console.error('deleteAuditLogsOlderThan error:', err)
    res.status(500).json({ error: err.message || 'Failed to delete old logs' })
  }
}

// DELETE /api/audit-logs/clear  — clears all
export const clearAuditLogs = async (req: Request, res: Response) => {
  try {
    const deleted = await clearAllAuditLogsService()
    res.json({ deleted })
  } catch (err: any) {
    console.error('clearAuditLogs error:', err)
    res.status(500).json({ error: err.message || 'Failed to clear logs' })
  }
}