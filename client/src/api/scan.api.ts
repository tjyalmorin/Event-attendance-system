import api from './axios'
import { ScanResponse } from '../types'

export const lookupParticipantApi = async (payload: { query: string; event_id: number }) => {
  const res = await api.post('/attendance/lookup', payload)
  return res.data
}

export const resolveParticipantApi = async (payload: { participant_id: number; event_id: number }) => {
  const res = await api.post('/attendance/resolve', payload)
  return res.data
}

export const scanAgentCodeApi = async (payload: {
  agent_code: string
  event_id: number
  is_early_out?: boolean
  early_out_reason?: string | null
}): Promise<ScanResponse> => {
  const res = await api.post('/attendance/scan', payload)
  return res.data
}

export const logDenialApi = async (payload: { agent_code: string; event_id: number; reason?: string }) => {
  const res = await api.post('/attendance/deny', payload)
  return res.data
}

export const getSessionsByEventApi = async (event_id: number) => {
  const res = await api.get(`/attendance/sessions/${event_id}`)
  return res.data
}

export const getScanLogsByEventApi = async (event_id: number) => {
  const res = await api.get(`/attendance/logs/${event_id}`)
  return res.data
}

export const updateSessionTimesApi = async (
  session_id: number,
  body: { check_in_time: string; check_out_time: string | null }
) => {
  const res = await api.patch(`/attendance/sessions/${session_id}/times`, body)
  return res.data
}

export const bulkCheckOutApi = async (event_id: number, session_ids: number[]) => {
  const res = await api.post(`/attendance/sessions/${event_id}/bulk-checkout`, { session_ids })
  return res.data
}