import api from './axios'
import { LoginPayload, LoginResponse, User } from '../types'

export const loginApi = async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', payload)
  return res.data
}

export const getMeApi = async (): Promise<User> => {
  const res = await api.get('/auth/me')
  return res.data
}