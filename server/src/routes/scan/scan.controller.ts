// STEP 04 — server/src/routes/scan/scan.controller.ts
// TYPE: Full replacement
// WHY: Added resolveParticipant controller. lookupParticipant now accepts 'query' field.

import { Request, Response } from 'express'
import {
  lookupParticipantService,
  resolveParticipantService,
  scanAgentCodeService,
  logDenialService,
  getSessionsByEventService,
  getScanLogsByEventService
} from './scan.service.js'

export const lookupParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    // Accept 'query' (new) OR 'agent_code' (backwards compat)
    const query = (req.body.query || req.body.agent_code || '').trim()
    const { event_id } = req.body
    if (!query || !event_id) {
      res.status(400).json({ error: 'query and event_id are required' })
      return
    }
    const result = await lookupParticipantService(query, Number(event_id))
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const resolveParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { participant_id, event_id } = req.body
    if (!participant_id || !event_id) {
      res.status(400).json({ error: 'participant_id and event_id are required' })
      return
    }
    const result = await resolveParticipantService(Number(participant_id), Number(event_id))
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

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

export const logDenial = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agent_code, event_id, reason } = req.body
    if (!agent_code || !event_id) {
      res.status(400).json({ error: 'agent_code and event_id are required' })
      return
    }
    await logDenialService(agent_code.trim(), Number(event_id), reason || 'Staff denied — identity mismatch')
    res.json({ message: 'Denial logged' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
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