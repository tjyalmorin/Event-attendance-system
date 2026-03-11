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
  registered_at: Date
  updated_at: Date
  deleted_at: Date | null
  label: boolean
  label_description: string | null
}

export interface RegisterPayload {
  agent_code: string
  full_name: string
  branch_name: string
  team_name: string
  agent_type: string
}