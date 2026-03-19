export type AgentType = 'District Manager' | 'Area Manager' | 'Branch Manager' | 'Unit Manager' | 'Agent'

export interface Participant {
  participant_id: number
  event_id: number
  agent_code: string | null
  full_name: string
  branch_name: string | null
  team_name: string | null
  agent_type: AgentType | null
  custom_responses: Record<string, string | boolean | number | string[] | null>
  registration_status: 'confirmed' | 'cancelled'
  registered_at: Date
  updated_at: Date
  deleted_at: Date | null
  label: string | null
  label_description: string | null
}

export interface RegisterPayload {
  agent_code?: string
  full_name?: string
  branch_name?: string
  team_name?: string
  agent_type?: string
  custom_responses?: Record<string, string | boolean | number | string[] | null>
}