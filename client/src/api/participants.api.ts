import api from './axios'
import { Participant, RegisterPayload } from '../types'

export const registerParticipantApi = async (event_id: number, payload: RegisterPayload) => {
  const res = await api.post(`/participants/register/${event_id}`, payload)
  return res.data // { participant } — no qr_image anymore
}

export const getParticipantsByEventApi = async (event_id: number): Promise<Participant[]> => {
  const res = await api.get(`/participants/event/${event_id}`)
  return res.data
}

export const setLabel = async (
  participant_id: number,
  payload: { label: boolean; label_description?: string | null }
) => {
  const res = await api.patch(`/participants/${participant_id}/awardee`, payload)
  return res.data
}

export const cancelParticipantApi = async (participant_id: number): Promise<void> => {
  await api.delete(`/participants/${participant_id}`)
}

export const setLabelApi = async (
  participant_id: number,
  payload: { label: string | null; label_description?: string | null }
) => {
  const res = await api.patch(`/participants/${participant_id}/label`, payload)
  return res.data
}