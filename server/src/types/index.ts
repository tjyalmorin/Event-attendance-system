// User types
export interface User {
  id: number;
  username: string;
  password: string;
  full_name: string;
  role: 'admin' | 'staff' | 'data_analyst';
  created_at: Date;
}

// Event types
export interface Event {
  event_id: number;
  title: string;
  description?: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  venue?: string | null;
  capacity?: number | null;
  checkin_cutoff?: string | null;
  registration_start?: string | null;
  registration_end?: string | null;
  status: 'draft' | 'open' | 'closed' | 'completed';
  created_by?: number;
  created_at: string;
  updated_at: string;
}

// Participant types
export interface Participant {
  participant_id: number;
  event_id: number;
  agent_code: string;
  full_name: string;
  branch_name: string;
  team_name: string;
  registration_status: 'confirmed' | 'cancelled';
  registered_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  label: boolean;
  label_description: string | null;
}

export interface RegisterPayload {
  agent_code: string;
  full_name: string;
  branch_name: string;
  team_name: string;
}

// Attendance types
export interface AttendanceSession {
  session_id: number;
  participant_id: number;
  event_id: number;
  agent_code: string;
  full_name: string;
  branch_name: string;
  team_name: string;
  check_in_time: string;
  check_out_time: string | null;
  check_out_method: 'normal' | 'early_out' | 'force_checkout' | null;
}

// Scan log types
export interface ScanLog {
  scan_id: number;
  event_id: number;
  participant_id?: number | null;
  agent_code?: string | null;
  full_name?: string | null;
  qr_token?: string | null;
  scan_type: 'check_in' | 'check_out' | 'denied';
  denial_reason?: string | null;
  scanned_at: string;
}

// Override log types
export interface OverrideLog {
  override_id: number;
  session_id: number;
  participant_id: number;
  event_id: number;
  agent_code: string;
  full_name: string;
  override_type: 'fix_checkin' | 'force_checkout' | 'early_out';
  original_time: string | null;
  adjusted_time: string | null;
  reason: string;
  admin_name: string;
  created_at: string;
}

// Request/Response types
export interface RegisterParticipantRequest {
  eventId: number;
  agentCode: string;
  fullName: string;
  branchName: string;
  teamName: string;
  phoneNumber: string;
  photo?: string;
}

export interface AttendanceStats {
  totalRegistered: number;
  checkedIn: number;
  currentlyInside: number;
  checkedOut: number;
  noShows: number;
  earlyCheckouts: number;
  attendanceRate: number;
}