import { Request, Response } from 'express'
import {
  loginService,
  getMeService,
  sendOtpService,
  verifyOtpService,
  resetPasswordService
} from './auth.service.js'

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }
    const data = await loginService(email, password)
    res.json(data)
  } catch (err: any) {
    res.status(401).json({ error: err.message })
  }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await getMeService(req.user!.user_id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

// ── Step 1: Send OTP to admin email ───────────────────────
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body
    const result = await sendOtpService(email)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Step 2: Verify OTP ────────────────────────────────────
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body
    const result = await verifyOtpService(email, otp)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

// ── Step 3: Reset Password ────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body
    const result = await resetPasswordService(email, newPassword)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}