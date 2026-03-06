export interface Branch {
  branch_id: number
  name: string
  created_at: string
  updated_at: string
  teams?: Team[]
}

export interface Team {
  team_id: number
  branch_id: number
  name: string
  created_at: string
  updated_at: string
}