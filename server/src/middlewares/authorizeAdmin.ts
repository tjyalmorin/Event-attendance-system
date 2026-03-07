import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError.js'

// Place this file at: src/middlewares/authorizeAdmin.ts
// (same folder as authenticate.ts and validate.ts)
//
// Requires authenticate middleware to run first (via router.use(authenticate))
// so that req.user is already attached before this middleware is called.

const authorizeAdmin = (req: Request, _res: Response, next: NextFunction) => {
  const user = (req as any).user
  if (!user)                 throw new AppError('Unauthorized', 401)
  if (user.role !== 'admin') throw new AppError('Forbidden: admin access required', 403)
  next()
}

export default authorizeAdmin