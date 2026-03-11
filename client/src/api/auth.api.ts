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

// ── Forgot Password (admin only) ───────────────────────────
export const sendOtpApi = async (email: string): Promise<{ message: string }> => {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}

export const verifyOtpApi = async (email: string, otp: string): Promise<{ message: string }> => {
  const res = await api.post('/auth/verify-otp', { email, otp })
  return res.data
}

export const resetPasswordApi = async (email: string, newPassword: string): Promise<{ message: string }> => {
  const res = await api.post('/auth/reset-password', { email, newPassword })
  return res.data
}