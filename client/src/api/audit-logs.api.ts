import api from './axios'

export interface AuditLogEntry {
  log_id: number
  actor_id: string | null
  actor_name: string
  actor_role: string
  action: 'created' | 'edited' | 'deactivated' | 'reactivated' | 'deleted' | 'password_changed'
  target_id: string | null
  target_name: string
  target_role: string
  details: string | null
  created_at: string
}

export const getAuditLogsApi = async (): Promise<AuditLogEntry[]> => {
  const res = await api.get('/audit-logs')
  return res.data
}

export const createAuditLogApi = async (payload: {
  action: AuditLogEntry['action']
  target_id: string
  target_name: string
  target_role: string
  details?: string | null
}): Promise<AuditLogEntry> => {
  const res = await api.post('/audit-logs', payload)
  return res.data
}