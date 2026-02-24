import pool from '../../config/database.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const loginService = async (email: string, password: string) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email]
  )
  const user = result.rows[0]
  if (!user) throw new Error('User not found')

  const match = await bcrypt.compare(password, user.password_hash)
  if (!match) throw new Error('Invalid password')

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  )

  return {
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      role: user.role,
      email: user.email
    }
  }
}

export const getMeService = async (user_id: string) => {
  const result = await pool.query(
    `SELECT user_id, agent_code, full_name, email,
            branch_name, team_name, role
     FROM users WHERE user_id = $1 AND deleted_at IS NULL`,
    [user_id]
  )
  return result.rows[0]
}