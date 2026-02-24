import api from './axios'
import { ScanPayload, ScanResponse, AttendanceSession, ScanLog } from '../types'

export const scanAgentCodeApi = async (payload: ScanPayload): Promise<ScanResponse> => {
  const res = await api.post('/attendance/scan', payload)
  return res.data
}

export const getSessionsByEventApi = async (event_id: number): Promise<AttendanceSession[]> => {
  const res = await api.get(`/attendance/sessions/${event_id}`)
  return res.data
}

export const getScanLogsByEventApi = async (event_id: number): Promise<ScanLog[]> => {
  const res = await api.get(`/attendance/logs/${event_id}`)
  return res.data
}