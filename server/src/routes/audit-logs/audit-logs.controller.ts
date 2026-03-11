import { Request, Response } from 'express'
import { createAuditLogService, getAuditLogsService } from './audit-logs.service.js'

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const actor = (req as any).user
    const { action, target_id, target_name, target_role, details } = req.body

    if (!action || !target_id || !target_name || !target_role) {
      res.status(400).json({ error: 'Missing required fields: action, target_id, target_name, target_role' })
      return
    }

    const log = await createAuditLogService({
      actor_id:   actor.user_id,
      actor_name: actor.full_name,
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
    const limit = parseInt(req.query.limit as string) || 200
    const logs = await getAuditLogsService(limit)
    res.json(logs)
  } catch (err: any) {
    console.error('getAuditLogs error:', err)
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs' })
  }
}