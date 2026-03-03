import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError.js'
import { ZodError } from 'zod'

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    })
    return
  }

  console.error('❌ Unexpected error:', err)
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred. Please try again later.'
  })
}

export default errorHandler