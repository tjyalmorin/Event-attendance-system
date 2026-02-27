export interface OverrideLog {
  override_id: number
  attendance_session_id: number | null
  participant_id: number
  event_id: number
  admin_id: string
  override_type: 'fix_checkin' | 'force_checkout' | 'early_out'
  reason: string
  original_time: string | null
  adjusted_time: string | null
  early_out_cutoff: string | null
  created_at: string
}

export interface FixCheckinPayload {
  session_id: number        // ← was attendance_session_id
  participant_id: number
  event_id: number
  adjusted_time: string
  reason: string
}

export interface ForceCheckoutPayload {
  session_id: number        // ← was attendance_session_id
  participant_id: number
  event_id: number
  adjusted_time: string
  reason: string
}

export interface EarlyOutPayload {
  session_id: number        // ← was attendance_session_id
  participant_id: number
  event_id: number
  early_out_cutoff: string
  adjusted_time: string
  reason: string
}