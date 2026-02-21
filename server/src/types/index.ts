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
  id: number;
  title: string;
  description?: string;
  event_date: Date;
  start_time: string;
  end_time: string;
  venue?: string;
  allowed_checkout_time: string;
  registration_link?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Participant types
export interface Participant {
  id: number;
  event_id: number;
  agent_code: string;
  full_name: string;
  branch_name: string;
  team_name: string;
  phone_number: string;
  photo_url?: string;
  qr_code: string;
  registered_at: Date;
}

// Attendance types
export interface Attendance {
  id: number;
  participant_id: number;
  event_id: number;
  check_in_time?: Date;
  check_out_time?: Date;
  status: 'checked_in' | 'checked_out' | 'early_out' | 'completed';
  duration_minutes?: number;
  early_checkout_reason?: string;
  early_checkout_notes?: string;
  approved_by?: number;
  created_at: Date;
  updated_at: Date;
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

export interface CheckInRequest {
  participantId: number;
  eventId: number;
  timestamp: string;
}

export interface CheckOutRequest {
  participantId: number;
  eventId: number;
  timestamp: string;
}

export interface EarlyCheckoutApprovalRequest {
  participantId: number;
  eventId: number;
  reason: string;
  notes?: string;
  approvedBy: number;
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
