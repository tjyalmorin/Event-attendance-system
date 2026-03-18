import api from './axios'

export interface ImportError {
  row: number
  agent_code: string
  reason: string
}

export interface ImportResult {
  success: boolean
  total_rows: number
  success_count: number
  error_count: number
  errors: ImportError[]
  import_id?: number
}

export interface ImportLog {
  import_id: number
  file_name: string
  total_rows: number
  success_count: number
  error_count: number
  errors: ImportError[]
  status: 'completed' | 'failed' | 'pending'
  created_at: string
  imported_by_name: string
}

export const bulkImportParticipantsApi = async (
  event_id: number,
  file: File
): Promise<ImportResult> => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post(`/import/events/${event_id}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export const getImportLogsApi = async (event_id: number): Promise<ImportLog[]> => {
  const res = await api.get(`/import/events/${event_id}/import-logs`)
  return res.data
}

export const downloadImportTemplateUrl = (): string => {
  const base = import.meta.env.VITE_API_URL || '/api'
  return `${base}/import/template`
}