import pool from '../../config/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const loginService = async (email: string, password: string) => {
  // Validate inputs
  if (!email || typeof email !== 'string') throw new Error('Valid email is required')
  if (!password || typeof password !== 'string') throw new Error('Password is required')
  if (email.length > 255) throw new Error('Invalid email')
  if (password.length > 128) throw new Error('Invalid password')

  // Sanitize
  const sanitizedEmail = email.trim().toLowerCase()

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [sanitizedEmail]
  )
  const user = result.rows[0]
  if (!user) throw new Error('Invalid email or password')

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) throw new Error('Invalid email or password')

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET!,
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
  if (!result.rows[0]) throw new Error('User not found')
  return result.rows[0]
}