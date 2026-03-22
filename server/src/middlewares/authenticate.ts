import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'

// ── Define JwtPayload locally to avoid import issues ─────────────────────────
interface JwtPayload {
  user_id: string
  role: string
  branch_name: string
}

export const invalidateUserActiveCache = async (user_id: string) => {
  await cacheDel(`user:active:${user_id}`)
}

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload

    // ── Check Redis cache first before hitting the DB ─────────────────────
    const cacheKey = `user:active:${decoded.user_id}`
    let userStatus = await cacheGet<{ is_active: boolean; deleted_at: string | null }>(cacheKey)

    if (!userStatus) {
      const result = await pool.query(
        'SELECT is_active, deleted_at FROM users WHERE user_id = $1',
        [decoded.user_id]
      )
      const user = result.rows[0]

      if (!user) {
        res.status(401).json({ error: 'Account no longer exists' })
        return
      }

      userStatus = { is_active: user.is_active, deleted_at: user.deleted_at }

      // Cache for 30 seconds — short enough for near-instant deactivation
      await cacheSet(cacheKey, userStatus, 30)
    }

    if (userStatus.deleted_at) {
      res.status(401).json({ error: 'Account no longer exists' })
      return
    }

    if (!userStatus.is_active) {
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