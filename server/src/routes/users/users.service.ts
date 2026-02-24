import pool from '../../config/database.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { CreateUserPayload } from '../../types/user.types.js'

export const createUserService = async (payload: CreateUserPayload) => {
  const { agent_code, full_name, email, password, branch_name, team_name, role } = payload

  const existing = await pool.query(
    'SELECT user_id FROM users WHERE email = $1 OR agent_code = $2',
    [email, agent_code]
  )
  if (existing.rows.length > 0) throw new Error('Email or agent code already exists')

  const password_hash = await bcrypt.hash(password, 10)
  const user_id = uuidv4()

  const result = await pool.query(
    `INSERT INTO users (user_id, agent_code, full_name, email, password_hash, branch_name, team_name, role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING user_id, agent_code, full_name, email, role, branch_name, team_name`,
    [user_id, agent_code, full_name, email, password_hash, branch_name, team_name, role]
  )
  return result.rows[0]
}

export const getAllUsersService = async () => {
  const result = await pool.query(
    `SELECT user_id, agent_code, full_name, email, role, branch_name, team_name, created_at
     FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
  )
  return result.rows
}

export const softDeleteUserService = async (user_id: string) => {
  const result = await pool.query(
    'UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL RETURNING user_id',
    [user_id]
  )
  if (result.rows.length === 0) throw new Error('User not found')
}