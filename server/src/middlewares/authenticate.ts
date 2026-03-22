import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'

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

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('❌ JWT_SECRET is not configured')
    res.status(500).json({ error: 'Server configuration error' })
    return
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload

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