import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { JwtPayload } from '../types/user.types.js'

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
    
    // ── Check if user is still active and not deleted ──────────────────────
    // This forces session invalidation when admin deactivates or deletes account
    const result = await pool.query(
      'SELECT user_id, role, is_active, deleted_at FROM users WHERE user_id = $1',
      [decoded.user_id]
    )
    const user = result.rows[0]

    if (!user || user.deleted_at) {
      res.status(401).json({ error: 'Account no longer exists' })
      return
    }

    if (!user.is_active) {
      res.status(401).json({ error: 'Your account has been deactivated. Please contact your administrator.' })
      return
    }

    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export default authenticate