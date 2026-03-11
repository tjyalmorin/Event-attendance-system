import { Request, Response, NextFunction } from 'express'
import pool from '../config/database.js'

/**
 * Middleware to check if staff user has admin grant for specific event
 * Extracts event_id from request params and checks admin_grants table
 * Allows access if:
 * 1. User is SuperAdmin (role = 'admin'), OR
 * 2. User is staff with valid admin grant for the event
 */
const adminGrantGuard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // SuperAdmin always allowed
    if (user.role === 'admin') {
      next()
      return
    }

    // For staff, check if they have admin grant for event
    const eventId = req.params.event_id || req.body.event_id
    if (!eventId) {
      res.status(400).json({ error: 'Event ID required' })
      return
    }

    const grant = await pool.query(
      `SELECT grant_id FROM admin_grants 
       WHERE granted_to_user_id = $1 
       AND event_id = $2 
       AND revoked_at IS NULL 
       AND expires_at > NOW()`,
      [user.user_id, Number(eventId)]
    )

    if (grant.rows.length === 0) {
      res.status(403).json({ error: 'Access denied: no admin access for this event' })
      return
    }

    next()
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export default adminGrantGuard
