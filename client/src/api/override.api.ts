import api from './axios'

export const fixCheckinApi = async (payload: {
  session_id: number        // ✅ was: attendance_session_id
  participant_id: number
  event_id: number
  adjusted_time: string
  reason: string
}) => {
  const res = await api.post('/override/fix-checkin', payload)
  return res.data
}

export const forceCheckoutApi = async (payload: {
  session_id: number        // ✅ was: attendance_session_id
  participant_id: number
  event_id: number
  adjusted_time: string
  reason: string
}) => {
  const res = await api.post('/override/force-checkout', payload)
  return res.data
}

export const earlyOutApi = async (payload: {
  session_id: number        // ✅ was: attendance_session_id
  participant_id: number
  event_id: number
  early_out_cutoff: string
  adjusted_time: string
  reason: string
}) => {
  const res = await api.post('/override/early-out', payload)
  return res.data
}

export const getOverrideLogsByEventApi = async (event_id: number) => {
  const res = await api.get(`/override/logs/${event_id}`)
  return res.data
}