import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import {
  fixCheckinService,
  forceCheckoutService,
  earlyOutService,
  getOverrideLogsByEventService
} from './override.service.js'

export const fixCheckin = asyncHandler(async (req: Request, res: Response) => {
  const result = await fixCheckinService(req.body, req.user!.user_id)
  res.json(result)
})

export const forceCheckout = asyncHandler(async (req: Request, res: Response) => {
  const result = await forceCheckoutService(req.body, req.user!.user_id)
  res.json(result)
})

export const earlyOut = asyncHandler(async (req: Request, res: Response) => {
  const result = await earlyOutService(req.body, req.user!.user_id)
  res.json(result)
})

export const getOverrideLogsByEvent = asyncHandler(async (req: Request, res: Response) => {
  const logs = await getOverrideLogsByEventService(Number(req.params.event_id))
  res.json(logs)
})