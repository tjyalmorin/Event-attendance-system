import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import { AppError } from '../../errors/AppError.js'
import {
  lookupParticipantService,
  resolveParticipantService,
  scanAgentCodeService,
  logDenialService,
  getSessionsByEventService,
  getScanLogsByEventService
} from './scan.service.js'

export const lookupParticipant = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.body.query || req.body.agent_code || '').trim()
  const { event_id } = req.body
  if (!query || !event_id) throw new AppError('query and event_id are required', 400)
  const result = await lookupParticipantService(query, Number(event_id))
  res.json(result)
})

export const resolveParticipant = asyncHandler(async (req: Request, res: Response) => {
  const { participant_id, event_id } = req.body
  if (!participant_id || !event_id) throw new AppError('participant_id and event_id are required', 400)
  const result = await resolveParticipantService(Number(participant_id), Number(event_id))
  res.json(result)
})

export const scanAgentCode = asyncHandler(async (req: Request, res: Response) => {
  const { agent_code, event_id } = req.body
  if (!agent_code || !event_id) throw new AppError('agent_code and event_id are required', 400)
  const result = await scanAgentCodeService(agent_code.trim(), Number(event_id))
  res.json(result)
})

export const logDenial = asyncHandler(async (req: Request, res: Response) => {
  const { agent_code, event_id, reason } = req.body
  if (!agent_code || !event_id) throw new AppError('agent_code and event_id are required', 400)
  await logDenialService(agent_code.trim(), Number(event_id), reason || 'Staff denied — identity mismatch')
  res.json({ message: 'Denial logged' })
})

export const getSessionsByEvent = asyncHandler(async (req: Request, res: Response) => {
  const sessions = await getSessionsByEventService(Number(req.params.event_id))
  res.json(sessions)
})

export const getScanLogsByEvent = asyncHandler(async (req: Request, res: Response) => {
  const logs = await getScanLogsByEventService(Number(req.params.event_id))
  res.json(logs)
})