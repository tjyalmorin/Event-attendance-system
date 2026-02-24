import { Request, Response } from 'express'
import { scanAgentCodeService, getSessionsByEventService, getScanLogsByEventService } from './scan.service'

export const scanAgentCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agent_code, event_id } = req.body

    if (!agent_code || !event_id) {
      res.status(400).json({ error: 'agent_code and event_id are required' })
      return
    }

    const result = await scanAgentCodeService(agent_code.trim(), Number(event_id))
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const getSessionsByEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessions = await getSessionsByEventService(Number(req.params.event_id))
    res.json(sessions)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export const getScanLogsByEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await getScanLogsByEventService(Number(req.params.event_id))
    res.json(logs)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}