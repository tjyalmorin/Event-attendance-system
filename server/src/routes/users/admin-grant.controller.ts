import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import { AppError } from '../../errors/AppError.js'
import {
  grantAdminAccessService,
  getUserAdminGrantsService,
  getEventAdminGrantsService,
  revokeAdminAccessService
} from './admin-grant.service.js'

export const grantAdminAccess = asyncHandler(async (req: Request, res: Response) => {
  const grantedByUserId = req.user?.user_id
  if (!grantedByUserId) throw new AppError('Unauthorized', 401)
  const grant = await grantAdminAccessService(grantedByUserId, req.body)
  res.status(201).json({ message: 'Admin access granted successfully', grant })
})

export const getMyAdminGrants = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.user_id
  if (!userId) throw new AppError('Unauthorized', 401)
  const grants = await getUserAdminGrantsService(userId)
  res.json(grants)
})

export const getEventAdminGrants = asyncHandler(async (req: Request, res: Response) => {
  const grants = await getEventAdminGrantsService(Number(req.params.event_id))
  res.json(grants)
})

export const revokeAdminAccess = asyncHandler(async (req: Request, res: Response) => {
  const revokedByUserId = req.user?.user_id
  if (!revokedByUserId) throw new AppError('Unauthorized', 401)
  await revokeAdminAccessService(Number(req.params.grant_id), revokedByUserId)
  res.json({ message: 'Admin access revoked successfully' })
})