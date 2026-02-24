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

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
  status?: 'draft' | 'open' | 'closed' | 'completed'
}
