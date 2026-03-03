import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import { AppError } from '../../errors/AppError.js'
import {
  loginService,
  getMeService,
  sendOtpService,
  verifyOtpService,
  resetPasswordService
} from './auth.service.js'

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) throw new AppError('Email and password are required', 400)
  const data = await loginService(email, password)
  res.json(data)
})

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getMeService(req.user!.user_id)
  if (!user) throw new AppError('User not found', 404)
  res.json(user)
})

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await sendOtpService(req.body.email)
  res.json(result)
})

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body
  const result = await verifyOtpService(email, otp)
  res.json(result)
})

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, newPassword } = req.body
  const result = await resetPasswordService(email, newPassword)
  res.json(result)
})
