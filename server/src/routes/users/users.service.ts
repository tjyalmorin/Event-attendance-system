import pool from '../../config/database.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { CreateUserPayload } from '../../types/user.types.js'

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const createUserService = async (payload: CreateUserPayload) => {
  const { agent_code, full_name, email, password, branch_name, team_name, role } = payload

  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!full_name?.trim()) throw new Error('Full name is required')
  if (!email?.trim()) throw new Error('Email is required')
  if (!validateEmail(email)) throw new Error('Invalid email format')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
  if (!branch_name?.trim()) throw new Error('Branch name is required')
  if (!team_name?.trim()) throw new Error('Team name is required')
  if (!['admin', 'staff'].includes(role)) throw new Error('Role must be admin or staff')

  const existing = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.trim().toLowerCase()]
  )
  if (existing.rows.length > 0) throw new Error('Email already in use')

  const existingCode = await pool.query(
    'SELECT user_id FROM users WHERE agent_code = $1 AND deleted_at IS NULL',
    [agent_code.trim()]
  )
  if (existingCode.rows.length > 0) throw new Error('Agent code already in use')

  const password_hash = await bcrypt.hash(password, 10)
  const user_id = uuidv4()

  const result = await pool.query(
    `INSERT INTO users (user_id, agent_code, full_name, email, password_hash, branch_name, team_name, role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING user_id, agent_code, full_name, email, branch_name, team_name, role, created_at`,
    [user_id, agent_code.trim(), full_name.trim(), email.trim().toLowerCase(),
     password_hash, branch_name.trim(), team_name.trim(), role]
  )
  return result.rows[0]
}

export const getAllUsersService = async () => {
  const result = await pool.query(
    `SELECT user_id, agent_code, full_name, email, branch_name, team_name, role, created_at
     FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
  )
  return result.rows
}

export const softDeleteUserService = async (user_id: string) => {
  if (!user_id?.trim()) throw new Error('User ID is required')
  const result = await pool.query(
    `UPDATE users SET deleted_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND deleted_at IS NULL RETURNING user_id`,
    [user_id]
  )
  if (!result.rows[0]) throw new Error('User not found')
  return result.rows[0]
}

// ── Update own profile ─────────────────────────────────────
export const updateProfileService = async (user_id: string, payload: {
  full_name?: string
  email?: string
  branch_name?: string
  team_name?: string
}) => {
  const { full_name, email, branch_name, team_name } = payload

  if (full_name && full_name.trim().length === 0) throw new Error('Full name cannot be empty')
  if (email && !validateEmail(email)) throw new Error('Invalid email format')

  // Check email not taken by another user
  if (email) {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 AND deleted_at IS NULL AND user_id != $2',
      [email.trim().toLowerCase(), user_id]
    )
    if (existing.rows.length > 0) throw new Error('Email already in use by another account')
  }

  const result = await pool.query(
    `UPDATE users
     SET
       full_name   = COALESCE($1, full_name),
       email       = COALESCE($2, email),
       branch_name = COALESCE($3, branch_name),
       team_name   = COALESCE($4, team_name),
       updated_at  = NOW()
     WHERE user_id = $5 AND deleted_at IS NULL
     RETURNING user_id, agent_code, full_name, email, branch_name, team_name, role`,
    [
      full_name?.trim() || null,
      email?.trim().toLowerCase() || null,
      branch_name?.trim() || null,
      team_name?.trim() || null,
      user_id
    ]
  )
  if (!result.rows[0]) throw new Error('User not found')
  return result.rows[0]
}

// ── Change own password ────────────────────────────────────
export const changePasswordService = async (user_id: string, currentPassword: string, newPassword: string) => {
  if (!currentPassword) throw new Error('Current password is required')
  if (!newPassword || newPassword.length < 6) throw new Error('New password must be at least 6 characters')

  const result = await pool.query(
    'SELECT * FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [user_id]
  )
  const user = result.rows[0]
  if (!user) throw new Error('User not found')

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
  if (!isMatch) throw new Error('Current password is incorrect')

  const password_hash = await bcrypt.hash(newPassword, 10)
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [password_hash, user_id]
  )
  return { message: 'Password changed successfully' }
}

// ── Admin resets any user password ────────────────────────
export const adminResetPasswordService = async (user_id: string, newPassword: string) => {
  if (!newPassword || newPassword.length < 6) throw new Error('Password must be at least 6 characters')

  const result = await pool.query(
    'SELECT user_id FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [user_id]
  )
  if (!result.rows[0]) throw new Error('User not found')

  const password_hash = await bcrypt.hash(newPassword, 10)
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [password_hash, user_id]
  )
  return { message: 'Password reset successfully' }
}