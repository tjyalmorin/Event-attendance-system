import { JwtPayload } from './user.types'

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}