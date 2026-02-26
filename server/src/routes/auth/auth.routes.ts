import { Router } from 'express'
import { login, getMe } from './auth.controller'
import authenticate from '../../middlewares/authenticate'
import { authLimiter } from '../../middlewares/rateLimiters'

const router = Router()

router.post('/login', authLimiter, login)
router.get('/me', authenticate, getMe)

export default router