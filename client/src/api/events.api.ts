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