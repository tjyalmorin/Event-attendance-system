import { Router } from 'express'
import { login, getMe, sendOtp, verifyOtp, resetPassword } from './auth.controller'
import authenticate from '../../middlewares/authenticate'
import { authLimiter } from '../../middlewares/rateLimiters'

const router = Router()

router.post('/login', authLimiter, login)
router.get('/me', authenticate, getMe)

// ── Forgot Password (admin only) ───────────────────────────
router.post('/forgot-password', sendOtp)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

export default router