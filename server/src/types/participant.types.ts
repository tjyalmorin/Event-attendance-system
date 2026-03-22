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
  custom_answers?: Record<string, string>
}

// ── Custom Form Builder Types ──────────────────────────────────────────────

export type FormFieldType = 'text' | 'textarea' | 'radio' | 'dropdown' | 'checkbox' | 'date'

export interface ConditionRule {
  field_key: string   // plain field_key (no page prefix)
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
  page_conditions?: PageConditions | null  // show/hide entire page
  condition?: ConditionRule | null         // show/hide individual field
  is_required: boolean
  is_final: boolean                        // marks last page
  sort_order: number
}