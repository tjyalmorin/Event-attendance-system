// User types
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
  status: 'draft' | 'open' | 'closed' | 'completed' | 'archived'
  version: number
  created_at: string
  updated_at: string
  poster_url: string | null
  preset_url?: string | null       // stock photo preset for event card
  slideshow_urls?: string[]        // Cloudinary URLs shown on registration page
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

// Participant types
export type AgentType = 'District Manager' | 'Area Manager' | 'Branch Manager' | 'Unit Manager' | 'Agent'

export interface Participant {
  participant_id: number
  event_id: number
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  agent_type: AgentType | null
  registration_status: 'confirmed' | 'cancelled'
  registered_at: string
  label: string | null             // string label e.g. "Awardee", NOT boolean
  label_description: string | null
}

export interface RegisterPayload {
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  agent_type: string
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
// ── Custom Form Builder Types ──────────────────────────────────────────────

export type FormFieldType = 'text' | 'textarea' | 'radio' | 'dropdown' | 'checkbox'

export interface ConditionRule {
  field_key: string
  operator: 'eq' | 'neq'
  value: string
}

export interface PageConditions {
  logic: 'AND' | 'OR'
  rules: ConditionRule[]
}

export interface FormField {
  field_id?: number
  event_id?: number
  field_key: string
  label: string
  type: FormFieldType
  options: string[]
  page_number: number
  page_label?: string | null
  page_conditions?: PageConditions | null
  condition?: ConditionRule | null
  is_required: boolean
  is_final: boolean
  sort_order: number
}