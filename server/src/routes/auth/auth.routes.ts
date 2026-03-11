import { Router } from 'express'
import { login, getMe, sendOtp, verifyOtp, resetPassword } from './auth.controller.js'
import authenticate from '../../middlewares/authenticate.js'
import { authLimiter } from '../../middlewares/rateLimiters.js'
import validate from '../../middlewares/validate.js'
import { loginSchema, sendOtpSchema, verifyOtpSchema, resetPasswordSchema } from '../../schemas/auth.schema.js'

const router = Router()

router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', authenticate, getMe)

// ── Forgot Password (admin only) ───────────────────────────
router.post('/forgot-password', validate(sendOtpSchema), sendOtp)
router.post('/verify-otp', validate(verifyOtpSchema), verifyOtp)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)

export default router