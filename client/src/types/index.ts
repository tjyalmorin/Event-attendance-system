// User types
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'admin' | 'staff' | 'data_analyst';
}

// Event types
export interface Event {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue?: string;
  allowedCheckoutTime: string;
  registrationLink?: string;
  createdAt: string;
  updatedAt: string;
}

// Participant types
export interface Participant {
  id: number;
  eventId: number;
  agentCode: string;
  fullName: string;
  branchName: string;
  teamName: string;
  phoneNumber: string;
  photoUrl?: string;
  qrCode: string;
  registeredAt: string;
}

// Attendance types
export interface Attendance {
  id: number;
  participantId: number;
  eventId: number;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'checked_in' | 'checked_out' | 'early_out' | 'completed';
  durationMinutes?: number;
  earlyCheckoutReason?: string;
  earlyCheckoutNotes?: string;
  approvedBy?: number;
}

// Stats types
export interface AttendanceStats {
  totalRegistered: number;
  checkedIn: number;
  currentlyInside: number;
  checkedOut: number;
  noShows: number;
  earlyCheckouts: number;
  attendanceRate: number;
}

// Form types
export interface RegistrationFormData {
  agentCode: string;
  fullName: string;
  branchName: string;
  teamName: string;
  phoneNumber: string;
  photo?: File;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface EventFormData {
  title: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue?: string;
  allowedCheckoutTime: string;
}
