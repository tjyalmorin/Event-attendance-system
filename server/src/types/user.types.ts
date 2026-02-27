export interface User {
  user_id: string
  agent_code: string
  full_name: string
  email: string
  password_hash: string
  branch_name: string
  team_name: string
  role: 'admin' | 'scanner' | 'viewer'
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface JwtPayload {
  user_id: string
  role: string
}

export interface CreateUserPayload {
  agent_code: string
  full_name: string
  email: string
  password: string
  branch_name: string
  team_name: string
  role: 'admin' | 'scanner' | 'viewer'
}

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