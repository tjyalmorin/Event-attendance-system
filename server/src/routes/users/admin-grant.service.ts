import pool from '../../config/database.js'

export interface AdminGrant {
  grant_id: number
  granted_to_user_id: string
  granted_by_user_id: string
  event_id: number
  is_edit_allowed: boolean
  expires_at: Date
  created_at: Date
  revoked_at: Date | null
}

export interface GrantAdminPayload {
  granted_to_user_id: string
  event_id: number
  is_edit_allowed: boolean
}

export const grantAdminAccessService = async (
  grantedByUserId: string,
  payload: GrantAdminPayload
): Promise<AdminGrant> => {
  const granter = await pool.query(
    'SELECT role FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [grantedByUserId]
  )
  if (granter.rows.length === 0 || granter.rows[0].role !== 'admin') {
    throw new Error('Only SuperAdmin can grant temporary admin access')
  }

  const grantee = await pool.query(
    'SELECT user_id, role, branch_name FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [payload.granted_to_user_id]
  )
  if (grantee.rows.length === 0 || grantee.rows[0].role !== 'staff') {
    throw new Error('Can only grant admin access to staff members')
  }

  const eventResult = await pool.query(
    'SELECT event_id, event_date, end_time FROM events WHERE event_id = $1 AND deleted_at IS NULL',
    [payload.event_id]
  )
  if (eventResult.rows.length === 0) {
    throw new Error('Event not found')
  }

  // ── Fix: use +08:00 (Asia/Manila) instead of Z (UTC) ─────────────────────
  const eventRow = eventResult.rows[0]
  const dateStr  = new Date(eventRow.event_date).toISOString().split('T')[0]
  const expiresAt = new Date(`${dateStr}T${eventRow.end_time}+08:00`)

  const result = await pool.query(
    `INSERT INTO admin_grants
      (granted_to_user_id, granted_by_user_id, event_id, is_edit_allowed, expires_at, revoked_at)
     VALUES ($1, $2, $3, $4, $5, NULL)
     ON CONFLICT (granted_to_user_id, event_id)
     DO UPDATE SET is_edit_allowed = $4, expires_at = $5, revoked_at = NULL
     RETURNING *`,
    [payload.granted_to_user_id, grantedByUserId, payload.event_id, payload.is_edit_allowed, expiresAt]
  )

  return result.rows[0]
}

export const getUserAdminGrantsService = async (userId: string): Promise<AdminGrant[]> => {
  const result = await pool.query(
    `SELECT * FROM admin_grants
     WHERE granted_to_user_id = $1
     AND revoked_at IS NULL
     AND expires_at > NOW()
     ORDER BY expires_at DESC`,
    [userId]
  )
  return result.rows
}

export const hasAdminAccessForEventService = async (userId: string, eventId: number): Promise<boolean> => {
  const result = await pool.query(
    `SELECT grant_id FROM admin_grants
     WHERE granted_to_user_id = $1
     AND event_id = $2
     AND revoked_at IS NULL
     AND expires_at > NOW()`,
    [userId, eventId]
  )
  return result.rows.length > 0
}

export const canEditEventService = async (userId: string, eventId: number): Promise<boolean> => {
  const result = await pool.query(
    `SELECT is_edit_allowed FROM admin_grants
     WHERE granted_to_user_id = $1
     AND event_id = $2
     AND revoked_at IS NULL
     AND expires_at > NOW()`,
    [userId, eventId]
  )
  return result.rows.length > 0 && result.rows[0].is_edit_allowed === true
}

export const getEventAdminGrantsService = async (
  eventId: number
): Promise<Array<AdminGrant & { granted_to_name: string; granted_by_name: string }>> => {
  const result = await pool.query(
    `SELECT
      ag.*,
      gu.full_name as granted_to_name,
      gb.full_name as granted_by_name
     FROM admin_grants ag
     JOIN users gu ON ag.granted_to_user_id = gu.user_id
     JOIN users gb ON ag.granted_by_user_id = gb.user_id
     WHERE ag.event_id = $1
     ORDER BY ag.created_at DESC`,
    [eventId]
  )
  return result.rows
}

export const revokeAdminAccessService = async (grantId: number, revokedByUserId: string): Promise<void> => {
  const user = await pool.query(
    'SELECT role FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [revokedByUserId]
  )
  if (user.rows.length === 0 || user.rows[0].role !== 'admin') {
    throw new Error('Only SuperAdmin can revoke admin access')
  }
  await pool.query(
    'UPDATE admin_grants SET revoked_at = NOW() WHERE grant_id = $1',
    [grantId]
  )
}