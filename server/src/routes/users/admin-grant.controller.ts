import { Request, Response } from 'express'
import {
  grantAdminAccessService,
  getUserAdminGrantsService,
  getEventAdminGrantsService,
  revokeAdminAccessService
} from './admin-grant.service.js'

/**
 * POST /api/users/admin-grant
 * SuperAdmin grants temporary admin to staff for event
 */
export const grantAdminAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const grantedByUserId = req.user?.user_id
    if (!grantedByUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const grant = await grantAdminAccessService(grantedByUserId, req.body)
    res.status(201).json({
      message: 'Admin access granted successfully',
      grant
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

/**
 * GET /api/users/admin-grants/me
 * Get all active admin grants for current user
 */
export const getMyAdminGrants = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.user_id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const grants = await getUserAdminGrantsService(userId)
    res.json(grants)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * GET /api/events/:event_id/admin-grants
 * Get all admin grants for event (SuperAdmin only)
 */
export const getEventAdminGrants = async (req: Request, res: Response): Promise<void> => {
  try {
    const grants = await getEventAdminGrantsService(Number(req.params.event_id))
    res.json(grants)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * DELETE /api/users/admin-grant/:grant_id
 * SuperAdmin revokes admin access
 */
export const revokeAdminAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const revokedByUserId = req.user?.user_id
    if (!revokedByUserId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    await revokeAdminAccessService(Number(req.params.grant_id), revokedByUserId)
    res.json({ message: 'Admin access revoked successfully' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
