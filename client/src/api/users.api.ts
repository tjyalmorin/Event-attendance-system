import api from './axios'
import { User, CreateUserPayload } from '../types'

export const getAllUsersApi = async (): Promise<User[]> => {
  const res = await api.get('/users')
  return res.data
}

export const createUserApi = async (payload: CreateUserPayload): Promise<User> => {
  const res = await api.post('/users', payload)
  return res.data
}

export const deleteUserApi = async (user_id: string): Promise<void> => {
  await api.delete(`/users/${user_id}`)
}