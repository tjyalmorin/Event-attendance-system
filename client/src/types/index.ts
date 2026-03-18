// ── User types ─────────────────────────────────────────────────────────────────
export interface User {
  user_id: string
  agent_code: string
  full_name: string
  email: string
  branch_name: string
  team_name: string
  role: 'admin' | 'staff'
  is_active: boolean
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
  role: 'admin' | 'staff'
}

// ── Agent Type ─────────────────────────────────────────────────────────────────
// Dynamic — managed by admin in Branch Management settings page
export interface AgentType {
  agent_type_id: number
  name: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Event types ─────────────────────────────────────────────────────────────────
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
  status: 'draft' | 'open' | 'closed' | 'completed' | 'archived'
  version: number
  created_at: string
  updated_at: string
  poster_url: string | null
  preset_url?: string | null
  slideshow_urls?: string[]
}

export interface CreateEventPayload {
  title: string
  description?: string | null
  event_date: string
  start_time?: string | null
  end_time?: string | null
  registration_start?: string | null
  registration_end?: string | null
  venue: string
  capacity?: number
  checkin_cutoff?: string | null
  event_branches?: { branch_name: string; teams: string[] }[]
  staff_ids?: string[]
}

// ── Custom Fields ──────────────────────────────────────────────────────────────
export type FieldType = 'text' | 'textarea' | 'number' | 'dropdown' | 'radio' | 'checkbox'

export interface CustomField {
  field_id: number
  event_id: number
  label: string
  field_type: FieldType
  options: string[] | null       // used for dropdown and radio types
  is_required: boolean
  display_order: number
  applicable_agent_types: string[] // empty = applies to all agent types
  is_locked: boolean               // true once any participant has answered
  created_at: string
  updated_at: string
}

export interface FieldAnswer {
  field_id: number
  answer: string | null
}

// ── Participant types ──────────────────────────────────────────────────────────
// agent_type is now a plain string (not a hardcoded enum)
// Values come from the agent_types table managed by admin
export interface Participant {
  participant_id: number
  event_id: number
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  agent_type: string | null       // string from dynamic agent_types table
  registration_status: 'confirmed' | 'cancelled'
  registered_at: string
  label: string | null            // string e.g. "Awardee", NOT boolean
  label_description: string | null
  photo_url?: string | null       // resolved from agents table via JOIN
}

export interface RegisterPayload {
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  agent_type: string
  answers?: FieldAnswer[]         // custom field answers
}

// ── Bulk Import ────────────────────────────────────────────────────────────────
export interface ImportError {
  row: number
  agent_code: string
  reason: string
}

export interface ImportResult {
  success: boolean
  total_rows: number
  success_count: number
  error_count: number
  errors: ImportError[]
  import_id?: number
}

export interface ImportLog {
  import_id: number
  file_name: string
  total_rows: number
  success_count: number
  error_count: number
  errors: ImportError[]
  status: 'completed' | 'failed' | 'pending'
  created_at: string
  imported_by_name: string
}

// ── Attendance types ───────────────────────────────────────────────────────────
export interface AttendanceSession {
  session_id: number
  participant_id: number
  event_id: number
  check_in_time: string
  check_out_time: string | null
  check_in_method: string
  check_out_method: string | null
  early_out_reason: string | null
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
  qr_token: string
  full_name: string
  agent_code: string
}

export interface ScanPayload {
  agent_code: string
  event_id: number
  is_early_out?: boolean
  early_out_reason?: string | null
}

export interface ScanResponse {
  action: 'check_in' | 'check_out'
  message: string
  is_early_out?: boolean
  participant: {
    full_name: string
    agent_code: string
    branch_name: string
    team_name: string
    photo_url?: string
  }
  session: AttendanceSession
}

// ── Admin Grant types ──────────────────────────────────────────────────────────
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