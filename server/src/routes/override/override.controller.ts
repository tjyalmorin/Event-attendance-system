import { Request, Response } from 'express'
import {
  fixCheckinService,
  forceCheckoutService,
  earlyOutService,
  getOverrideLogsByEventService
} from './override.service'

export const fixCheckin = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await fixCheckinService(req.body, req.user!.user_id)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const forceCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await forceCheckoutService(req.body, req.user!.user_id)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const earlyOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await earlyOutService(req.body, req.user!.user_id)
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const getOverrideLogsByEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await getOverrideLogsByEventService(Number(req.params.event_id))
    res.json(logs)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}