import pool from '../../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import { UnauthorizedError, ValidationError, AppError } from '../../errors/AppError.js'

const resend = new Resend(process.env.RESEND_API_KEY)

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new AppError('JWT_SECRET is not configured', 500)
  return secret
}

export const loginService = async (email: string, password: string) => {
  if (!email || typeof email !== 'string') throw new ValidationError('Valid email is required')
  if (!password || typeof password !== 'string') throw new ValidationError('Password is required')
  if (email.length > 255) throw new ValidationError('Invalid email')
  if (password.length > 128) throw new ValidationError('Invalid password')

  const sanitizedEmail = email.trim().toLowerCase()

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [sanitizedEmail]
  )
  const user = result.rows[0]

  if (!user) throw new UnauthorizedError('Invalid email or password')

  let isMatch: boolean
  try {
    isMatch = await bcrypt.compare(password, user.password_hash)
  } catch {
    throw new UnauthorizedError('Invalid email or password')
  }
  if (!isMatch) throw new UnauthorizedError('Invalid email or password')

  if (!user.is_active) throw new AppError('Your account has been deactivated. Please contact your administrator.', 403)

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, branch_name: user.branch_name },
    getJwtSecret(),
    { expiresIn: '8h' }
  )

  const { password_hash, ...userWithoutPassword } = user
  return { token, user: userWithoutPassword }
}

export const getMeService = async (user_id: string) => {
  const result = await pool.query(
    'SELECT user_id, agent_code, full_name, email, branch_name, team_name, role FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [user_id]
  )
  if (!result.rows[0]) throw new AppError('User not found', 404)
  return result.rows[0]
}

export const sendOtpService = async (email: string) => {
  if (!email?.trim()) throw new ValidationError('Email is required')

  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email.trim().toLowerCase()]
  )
  const user = result.rows[0]

  if (!user) return { message: 'If that email exists, an OTP has been sent.' }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = new Date(Date.now() + 1000 * 60 * 10)

  await pool.query(
    `UPDATE users SET otp_code = $1, otp_expires = $2, otp_verified = FALSE WHERE user_id = $3`,
    [otp, expires, user.user_id]
  )

  try {
    await resend.emails.send({
      from: 'PrimeLog <onboarding@resend.dev>',
      to: user.email,
      subject: 'Your PrimeLog OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px;">
          <h2 style="color: #DC143C;">PrimeLog — Password Reset</h2>
          <p>Hi ${user.full_name},</p>
          <p>Use this OTP to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align:center; margin: 32px 0; padding: 24px; background: #fff5f5; border-radius: 12px;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #DC143C;">
              ${otp}
            </span>
          </div>
          <p style="color: #888; font-size: 12px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `
    })
    console.log(`✅ OTP email sent to ${user.email} via Resend`)
  } catch (err: any) {
    console.error('❌ Resend email error:', err.message)
    throw new AppError('Failed to send email. Please try again later.', 500)
  }

  return { message: 'If that email exists, an OTP has been sent.' }
}

export const verifyOtpService = async (email: string, otp: string) => {
  if (!email?.trim()) throw new ValidationError('Email is required')
  if (!otp?.trim()) throw new ValidationError('OTP is required')

  const result = await pool.query(
    `SELECT * FROM users
     WHERE email = $1
     AND otp_code = $2
     AND otp_expires > NOW()
     AND deleted_at IS NULL`,
    [email.trim().toLowerCase(), otp.trim()]
  )
  const user = result.rows[0]

  if (!user) throw new ValidationError('Invalid or expired OTP. Please try again.')

  await pool.query(
    `UPDATE users SET otp_verified = TRUE WHERE user_id = $1`,
    [user.user_id]
  )

  return { message: 'OTP verified successfully.' }
}

export const resetPasswordService = async (email: string, newPassword: string) => {
  if (!email?.trim()) throw new ValidationError('Email is required')
  if (!newPassword || newPassword.length < 6) throw new ValidationError('Password must be at least 6 characters')

  const result = await pool.query(
    `SELECT * FROM users
     WHERE email = $1
     AND otp_verified = TRUE
     AND otp_expires > NOW()
     AND deleted_at IS NULL`,
    [email.trim().toLowerCase()]
  )
  const user = result.rows[0]
  if (!user) throw new ValidationError('Session expired. Please restart the forgot password process.')

  const password_hash = await bcrypt.hash(newPassword, 10)

  await pool.query(
    `UPDATE users
     SET password_hash = $1, otp_code = NULL, otp_expires = NULL, otp_verified = FALSE, updated_at = NOW()
     WHERE user_id = $2`,
    [password_hash, user.user_id]
  )

  return { message: 'Password reset successful. You can now log in.' }
}