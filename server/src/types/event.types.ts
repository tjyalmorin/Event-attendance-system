export interface Event {
  event_id: number
  created_by: string
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  registration_start: Date
  registration_end: Date
  venue: string
  capacity: number
  checkin_cutoff: string
  registration_link: string
  status: 'draft' | 'open' | 'closed' | 'completed'
  version: number
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  event_branches?: EventBranchEntry[]
}

export interface EventBranchEntry {
  branch_name: string
  team_names: string[]
}

export interface CreateEventPayload {
  title: string
  description?: string | null
  event_date: string
  start_time?: string | null
  end_time?: string | null
  registration_start?: string | null
  registration_end?: string | null
  venue?: string | null
  capacity?: number | null
  checkin_cutoff?: string | null
  // ── Branches/teams selected for this event ──
  event_branches?: { branch_name: string; teams: string[] }[] | null
  // ── Staff assigned to this event ──
  staff_ids?: string[] | null
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: 'draft' | 'open' | 'closed' | 'completed'
}