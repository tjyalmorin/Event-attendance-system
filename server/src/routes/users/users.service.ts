import pool from '../../config/database'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { CreateUserPayload } from '../../types/user.types'

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const createUserService = async (payload: CreateUserPayload) => {
  const { agent_code, full_name, email, password, branch_name, team_name, role } = payload

  // Validate required fields
  if (!agent_code?.trim()) throw new Error('Agent code is required')
  if (!full_name?.trim()) throw new Error('Full name is required')
  if (!email?.trim()) throw new Error('Email is required')
  if (!validateEmail(email)) throw new Error('Invalid email format')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters')
  if (!branch_name?.trim()) throw new Error('Branch name is required')
  if (!team_name?.trim()) throw new Error('Team name is required')
  if (!['admin', 'staff'].includes(role)) throw new Error('Role must be admin or staff')

  // Check duplicate email
  const existing = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 AND deleted_at IS NULL',
    [email.trim().toLowerCase()]
  )
  if (existing.rows.length > 0) throw new Error('Email already in use')

  // Check duplicate agent code
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
     WHERE user_id = $1 AND deleted_at IS NULL
     RETURNING user_id`,
    [user_id]
  )
  if (!result.rows[0]) throw new Error('User not found')
  return result.rows[0]
}