import pool from '../../config/database.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { CreateUserPayload } from '../../types/user.types.js'
import { NotFoundError, ValidationError, UnauthorizedError, AppError } from '../../errors/AppError.js'
import { invalidateUserActiveCache } from '../../middlewares/authenticate.js'

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const createUserService = async (payload: CreateUserPayload) => {
  const { agent_code, full_name, email, password, branch_name, role, team_name } = payload

  if (!full_name?.trim())    throw new ValidationError('Full name is required')
  if (!email?.trim())        throw new ValidationError('Email is required')
  if (!validateEmail(email)) throw new ValidationError('Invalid email format')
  if (!password || password.length < 6) throw new ValidationError('Password must be at least 6 characters')
  if (!branch_name?.trim())  throw new ValidationError('Branch name is required')
  if (!['admin', 'staff'].includes(role)) throw new ValidationError('Role must be admin or staff')

  const existing = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.trim().toLowerCase()]
  )
  if (existing.rows.length > 0) throw new AppError('Email already in use', 409)

  const trimmedCode = agent_code?.trim() || null
  if (trimmedCode) {
    const existingCode = await pool.query(
      'SELECT user_id FROM users WHERE agent_code = $1 AND deleted_at IS NULL',
      [trimmedCode]
    )
    if (existingCode.rows.length > 0) throw new AppError('Agent code already in use', 409)
  }

  const password_hash = await bcrypt.hash(password, 10)
  const user_id = uuidv4()
  const trimmedTeam = team_name?.trim() || null

  const result = await pool.query(
    `INSERT INTO users (user_id, agent_code, full_name, email, password_hash, branch_name, team_name, role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING user_id, agent_code, full_name, email, branch_name, team_name, role, is_active, created_at`,
    [user_id, trimmedCode, full_name.trim(), email.trim().toLowerCase(), password_hash, branch_name.trim(), trimmedTeam, role]
  )
  return result.rows[0]
}

export const getAllUsersService = async () => {
  const result = await pool.query(
    `SELECT user_id, agent_code, full_name, email, branch_name, team_name, role, is_active, created_at
     FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
  )
  return result.rows
}

export const softDeleteUserService = async (user_id: string) => {
  if (!user_id?.trim()) throw new ValidationError('User ID is required')
  const result = await pool.query(
    `UPDATE users SET deleted_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND deleted_at IS NULL RETURNING user_id`,
    [user_id]
  )
  if (!result.rows[0]) throw new NotFoundError('User not found')

  // Invalidate cache so deleted user is blocked on next request
  await invalidateUserActiveCache(user_id)

  return result.rows[0]
}

export const updateProfileService = async (user_id: string, payload: {
  full_name?: string; email?: string; branch_name?: string; team_name?: string
}) => {
  const { full_name, email, branch_name, team_name } = payload
  if (full_name && full_name.trim().length === 0) throw new ValidationError('Full name cannot be empty')
  if (email && !validateEmail(email)) throw new ValidationError('Invalid email format')
  if (email) {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 AND deleted_at IS NULL AND user_id != $2',
      [email.trim().toLowerCase(), user_id]
    )
    if (existing.rows.length > 0) throw new AppError('Email already in use by another account', 409)
  }
  const result = await pool.query(
    `UPDATE users SET
       full_name   = COALESCE($1, full_name),
       email       = COALESCE($2, email),
       branch_name = COALESCE($3, branch_name),
       team_name   = COALESCE($4, team_name),
       updated_at  = NOW()
     WHERE user_id = $5 AND deleted_at IS NULL
     RETURNING user_id, agent_code, full_name, email, branch_name, team_name, role`,
    [full_name?.trim() || null, email?.trim().toLowerCase() || null, branch_name?.trim() || null, team_name?.trim() || null, user_id]
  )
  if (!result.rows[0]) throw new NotFoundError('User not found')
  return result.rows[0]
}

export const changePasswordService = async (user_id: string, currentPassword: string, newPassword: string) => {
  if (!currentPassword) throw new ValidationError('Current password is required')
  if (!newPassword || newPassword.length < 6) throw new ValidationError('New password must be at least 6 characters')

  const result = await pool.query(
    'SELECT * FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [user_id]
  )
  const user = result.rows[0]
  if (!user) throw new NotFoundError('User not found')

  let isMatch: boolean
  try {
    isMatch = await bcrypt.compare(currentPassword, user.password_hash)
  } catch {
    throw new UnauthorizedError('Current password is incorrect')
  }
  if (!isMatch) throw new ValidationError('Current password is incorrect')

  const password_hash = await bcrypt.hash(newPassword, 10)
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [password_hash, user_id]
  )
  return { message: 'Password changed successfully' }
}

export const adminResetPasswordService = async (user_id: string, newPassword: string) => {
  if (!newPassword || newPassword.length < 6) throw new ValidationError('Password must be at least 6 characters')
  const result = await pool.query(
    'SELECT user_id FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [user_id]
  )
  if (!result.rows[0]) throw new NotFoundError('User not found')
  const password_hash = await bcrypt.hash(newPassword, 10)
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2',
    [password_hash, user_id]
  )
  return { message: 'Password reset successfully' }
}

export const updateUserService = async (user_id: string, payload: {
  agent_code?: string | null; full_name?: string; email?: string; password?: string
  branch_name?: string; team_name?: string | null; role?: 'admin' | 'staff'
}) => {
  if (!user_id?.trim()) throw new ValidationError('User ID is required')
  const { agent_code, full_name, email, password, branch_name, team_name, role } = payload

  if (email) {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 AND user_id != $2 AND deleted_at IS NULL',
      [email.trim().toLowerCase(), user_id]
    )
    if (existing.rows.length > 0) throw new AppError('Email already in use', 409)
  }

  const trimmedCode = agent_code?.trim() || null
  if (trimmedCode) {
    const existingCode = await pool.query(
      'SELECT user_id FROM users WHERE agent_code = $1 AND user_id != $2 AND deleted_at IS NULL',
      [trimmedCode, user_id]
    )
    if (existingCode.rows.length > 0) throw new AppError('Agent code already in use', 409)
  }

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  if (full_name)                { fields.push(`full_name = $${idx++}`);   values.push(full_name.trim()) }
  if (email)                    { fields.push(`email = $${idx++}`);       values.push(email.trim().toLowerCase()) }
  if ('agent_code' in payload)  { fields.push(`agent_code = $${idx++}`);  values.push(trimmedCode) }
  if (branch_name)              { fields.push(`branch_name = $${idx++}`); values.push(branch_name.trim()) }
  if (role)                     { fields.push(`role = $${idx++}`);        values.push(role) }
  if ('team_name' in payload)   { fields.push(`team_name = $${idx++}`);   values.push(team_name?.trim() || null) }
  if (password)                 {
    const h = await bcrypt.hash(password, 10)
    fields.push(`password_hash = $${idx++}`)
    values.push(h)
  }

  if (fields.length === 0) throw new ValidationError('No fields to update')
  fields.push(`updated_at = NOW()`)
  values.push(user_id)

  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${idx} AND deleted_at IS NULL
     RETURNING user_id, agent_code, full_name, email, branch_name, team_name, role, is_active, created_at`,
    values
  )
  if (!result.rows[0]) throw new NotFoundError('User not found')
  return result.rows[0]
}

export const toggleUserActiveService = async (user_id: string) => {
  if (!user_id?.trim()) throw new ValidationError('User ID is required')
  const result = await pool.query(
    `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
     WHERE user_id = $1 AND deleted_at IS NULL
     RETURNING user_id, agent_code, full_name, email, branch_name, team_name, role, is_active, created_at`,
    [user_id]
  )
  if (!result.rows[0]) throw new NotFoundError('User not found')

  // Invalidate cache so deactivated user is blocked on next request within 30 seconds
  await invalidateUserActiveCache(user_id)

  return result.rows[0]
}