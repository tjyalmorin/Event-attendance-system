import { Request, Response, NextFunction } from 'express'

const roleGuard = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access denied: insufficient permissions' })
      return
    }
    next()
  }
}

export default roleGuard