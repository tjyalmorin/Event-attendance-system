import api from './axios'
import { User, CreateUserPayload } from '../types'

export const createUserApi = async (payload: CreateUserPayload): Promise<User> => {
  const res = await api.post('/users', payload)
  return res.data
}

export const getAllUsersApi = async (): Promise<User[]> => {
  const res = await api.get('/users')
  return res.data
}

export const deleteUserApi = async (user_id: string): Promise<void> => {
  await api.delete(`/users/${user_id}`)
}

export const updateProfileApi = async (payload: {
  full_name?: string
  email?: string
  branch_name?: string
  team_name?: string
}): Promise<User> => {
  const res = await api.put('/users/profile', payload)
  return res.data
}

export const changePasswordApi = async (payload: {
  currentPassword: string
  newPassword: string
}): Promise<{ message: string }> => {
  const res = await api.put('/users/change-password', payload)
  return res.data
}

export const adminResetPasswordApi = async (user_id: string, newPassword: string): Promise<{ message: string }> => {
  const res = await api.put(`/users/${user_id}/reset-password`, { newPassword })
  return res.data
}