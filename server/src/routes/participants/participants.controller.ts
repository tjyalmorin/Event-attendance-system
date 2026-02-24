import { Request, Response } from 'express'
import {
  registerParticipantService,
  getParticipantsByEventService,
  cancelParticipantService
} from './participants.service.js'

export const registerParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await registerParticipantService(Number(req.params.event_id), req.body)
    res.status(201).json(data)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const getParticipantsByEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    const userBranch = user?.role === 'staff' ? user.branch_name : undefined
    const participants = await getParticipantsByEventService(Number(req.params.event_id), userBranch)
    res.json(participants)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export const cancelParticipant = async (req: Request, res: Response): Promise<void> => {
  try {
    await cancelParticipantService(Number(req.params.participant_id))
    res.json({ message: 'Participant cancelled successfully' })
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
}