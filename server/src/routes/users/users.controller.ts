import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import {
  createUserService,
  getAllUsersService,
  softDeleteUserService,
  updateProfileService,
  changePasswordService,
  adminResetPasswordService,
  updateUserService,
  toggleUserActiveService,
} from './users.service.js'

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await createUserService(req.body)
  res.status(201).json(user)
})

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await getAllUsersService()
  res.json(users)
})

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await softDeleteUserService(req.params.user_id)
  res.json({ message: 'User deleted successfully' })
})

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateProfileService(req.user!.user_id, req.body)
  res.json(user)
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  const result = await changePasswordService(req.user!.user_id, currentPassword, newPassword)
  res.json(result)
})

export const adminResetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { newPassword } = req.body
  const result = await adminResetPasswordService(req.params.user_id, newPassword)
  res.json(result)
})

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUserService(req.params.user_id, req.body)
  res.json(user)
})

export const toggleUserActive = asyncHandler(async (req: Request, res: Response) => {
  const user = await toggleUserActiveService(req.params.user_id)
  res.json(user)
})