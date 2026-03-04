import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = (result.error as ZodError).issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      res.status(400).json({ error: 'Validation failed', details: errors })
      return
    }
    req.body = result.data
    next()
  }
}

export default validate
