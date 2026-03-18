import api from './axios'

export interface AgentType {
  agent_type_id: number
  name: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Public — used by registration form (returns active only)
export const getAgentTypesApi = async (): Promise<AgentType[]> => {
  const res = await api.get('/agent-types')
  return res.data
}

// Admin — returns all including inactive
export const getAllAgentTypesApi = async (): Promise<AgentType[]> => {
  const res = await api.get('/agent-types?include_inactive=true')
  return res.data
}

export const createAgentTypeApi = async (payload: {
  name: string
  display_order?: number
}): Promise<AgentType> => {
  const res = await api.post('/agent-types', payload)
  return res.data
}

export const updateAgentTypeApi = async (
  agent_type_id: number,
  payload: { name?: string; display_order?: number; is_active?: boolean }
): Promise<AgentType> => {
  const res = await api.put(`/agent-types/${agent_type_id}`, payload)
  return res.data
}

export const deleteAgentTypeApi = async (agent_type_id: number): Promise<void> => {
  await api.delete(`/agent-types/${agent_type_id}`)
}

export const reorderAgentTypesApi = async (ordered_ids: number[]): Promise<AgentType[]> => {
  const res = await api.put('/agent-types/reorder', { ordered_ids })
  return res.data
}