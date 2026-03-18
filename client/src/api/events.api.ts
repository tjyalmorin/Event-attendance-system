import api from './axios'
import { Event, CreateEventPayload } from '../types'

export const getAllEventsApi = async (): Promise<Event[]> => {
  const res = await api.get('/events')
  return res.data
}

export const getEventByIdApi = async (event_id: number): Promise<Event> => {
  const res = await api.get(`/events/${event_id}`)
  return res.data
}

export const getEventByTokenApi = async (token: string): Promise<Event> => {
  const res = await api.get(`/events/by-token/${token}`)
  return res.data
}

export const createEventApi = async (payload: CreateEventPayload): Promise<Event> => {
  const res = await api.post('/events', payload)
  return res.data
}

export const updateEventApi = async (event_id: number, payload: Partial<CreateEventPayload & { status: string }>): Promise<Event> => {
  const res = await api.put(`/events/${event_id}`, payload)
  return res.data
}

export const deleteEventApi = async (event_id: number): Promise<void> => {
  await api.delete(`/events/${event_id}`)
}

export const assignPermissionApi = async (event_id: number, user_id: string): Promise<void> => {
  await api.post(`/events/${event_id}/permissions`, { user_id })
}

export const getTrashedEventsApi = async () => {
  const res = await api.get('/events/trash')
  return res.data
}

export const restoreEventApi = async (event_id: number) => {
  const res = await api.post(`/events/${event_id}/restore`)
  return res.data
}

export const permanentDeleteEventApi = async (event_id: number): Promise<void> => {
  await api.delete(`/events/${event_id}/permanent`)
}

export const updateEventStatusApi = async (event_id: number, status: string): Promise<Event> => {
  const res = await api.put(`/events/${event_id}`, { status })
  return res.data
}

// ── Staff management ──────────────────────────────────────────────────────────

export const getEventStaffApi = async (event_id: number) => {
  const res = await api.get(`/events/${event_id}/staff`)
  return res.data
}

export const removeEventStaffApi = async (event_id: number, user_id: string) => {
  const res = await api.delete(`/events/${event_id}/staff/${user_id}`)
  return res.data
}

export const getStaffByBranchesApi = async (branch_names: string[]) => {
  const res = await api.get(`/users/staff-by-branches?branches=${branch_names.join(',')}`)
  return res.data
}