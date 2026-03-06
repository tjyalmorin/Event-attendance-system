import api from './axios'

export interface TeamItem {
  team_id: number
  branch_id: number
  name: string
}

export interface BranchItem {
  branch_id: number
  name: string
  teams: TeamItem[]
}

// ── Read ───────────────────────────────────────────────────
export const getAllBranchesApi = async (): Promise<BranchItem[]> => {
  const res = await api.get('/branches')
  return res.data
}

// ── Branch CRUD ────────────────────────────────────────────
export const createBranchApi = async (name: string): Promise<BranchItem> => {
  const res = await api.post('/branches', { name })
  return res.data
}

export const updateBranchApi = async (branch_id: number, name: string): Promise<BranchItem> => {
  const res = await api.put(`/branches/${branch_id}`, { name })
  return res.data
}

export const deleteBranchApi = async (branch_id: number): Promise<void> => {
  await api.delete(`/branches/${branch_id}`)
}

// ── Team CRUD ──────────────────────────────────────────────
export const createTeamApi = async (branch_id: number, name: string): Promise<TeamItem> => {
  const res = await api.post(`/branches/${branch_id}/teams`, { name })
  return res.data
}

export const updateTeamApi = async (team_id: number, name: string): Promise<TeamItem> => {
  const res = await api.put(`/branches/teams/${team_id}`, { name })
  return res.data
}

export const deleteTeamApi = async (team_id: number): Promise<void> => {
  await api.delete(`/branches/teams/${team_id}`)
}