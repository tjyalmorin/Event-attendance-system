// User types
export interface User {
  user_id: string
  agent_code: string
  full_name: string
  email: string
  branch_name: string
  team_name: string
  role: 'admin' | 'staff'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CreateUserPayload {
  agent_code: string
  full_name: string
  email: string
  password: string
  branch_name: string
  team_name: string
  role: 'admin' | 'staff'
}

// Event types
export interface Event {
  event_id: number
  created_by: string
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  registration_start: string
  registration_end: string
  venue: string
  capacity: number
  checkin_cutoff: string
  registration_link: string
  status: 'draft' | 'open' | 'closed' | 'completed'
  version: number
  created_at: string
  updated_at: string
}

export interface CreateEventPayload {
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  registration_start: string
  registration_end: string
  venue: string
  capacity: number
  checkin_cutoff: string
}

// Participant types — NO QR fields
export interface Participant {
  participant_id: number
  event_id: number
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  registration_status: 'confirmed' | 'cancelled'
  registered_at: string
  label: boolean
  label_description: string | null
}

export interface RegisterPayload {
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
}

// Attendance types
export interface AttendanceSession {
  session_id: number
  participant_id: number
  event_id: number
  check_in_time: string
  check_out_time: string | null
  check_in_method: string
  check_out_method: string | null
  full_name: string
  agent_code: string
  branch_name: string
  team_name: string
}

export interface ScanLog {
  scan_id: number
  scanned_at: string
  scan_type: 'check_in' | 'check_out' | 'denied'
  denial_reason: string | null
  qr_token: string   // now stores agent_code value
  full_name: string
  agent_code: string
}

// Changed from qr_token to agent_code
export interface ScanPayload {
  agent_code: string
  event_id: number
}

export interface ScanResponse {
  action: 'check_in' | 'check_out'
  message: string
  participant: {
    full_name: string
    agent_code: string
    branch_name: string
    team_name: string
    photo_url?: string
  }
  session: AttendanceSession
}

// Admin Grant types
export interface AdminGrant {
  grant_id: number
  granted_to_user_id: string
  granted_by_user_id: string
  event_id: number
  is_edit_allowed: boolean
  expires_at: string
  created_at: string
  revoked_at: string | null
}

export interface GrantAdminPayload {
  granted_to_user_id: string
  event_id: number
  is_edit_allowed: boolean
}

// Override types
export interface OverrideLog {
  override_id: number
  override_type: 'fix_checkin' | 'force_checkout' | 'early_out'
  reason: string
  original_time: string | null
  adjusted_time: string | null
  early_out_cutoff: string | null
  created_at: string
  full_name: string
  agent_code: string
  admin_name: string
}