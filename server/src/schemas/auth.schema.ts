import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128)
})

export const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase()
})

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits')
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
})