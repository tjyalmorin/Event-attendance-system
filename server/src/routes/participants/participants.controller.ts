import { Request, Response } from 'express'
import path from 'path'
import asyncHandler from '../../middlewares/asyncHandler.js'
import { AppError } from '../../errors/AppError.js'
import pool from '../../config/database.js'
import cloudinary from '../../config/cloudinary.js'
import {
  registerParticipantService,
  getParticipantsByEventService,
  cancelParticipantService,
  setAwardeeService
} from './participants.service.js'

export const registerParticipant = asyncHandler(async (req: Request, res: Response) => {
  const data = await registerParticipantService(Number(req.params.event_id), req.body)
  res.status(201).json(data)
})

export const getParticipantsByEvent = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  const userBranch = user?.role === 'staff' ? user.branch_name : undefined
  const participants = await getParticipantsByEventService(Number(req.params.event_id), userBranch)
  res.json(participants)
})

export const cancelParticipant = asyncHandler(async (req: Request, res: Response) => {
  await cancelParticipantService(Number(req.params.participant_id))
  res.json({ message: 'Participant cancelled successfully' })
})

export const uploadParticipantPhoto = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded', 400)

  const { participant_id } = req.params
  const result = await pool.query(
    'SELECT agent_code FROM participants WHERE participant_id = $1',
    [participant_id]
  )
  const participant = result.rows[0]
  if (!participant) throw new AppError('Participant not found', 404)

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '')
  const publicId = `agents/${participant.agent_code}`

  const uploadResult = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, overwrite: true, resource_type: 'image', format: ext === 'jpg' ? 'jpg' : ext },
      (error, result) => { if (error) reject(error); else resolve(result) }
    )
    stream.end(req.file!.buffer)
  })

  const photo_url = uploadResult.secure_url
  await pool.query(
    `UPDATE participants SET photo_url = $1, updated_at = NOW() WHERE agent_code = $2`,
    [photo_url, participant.agent_code]
  )

  res.json({ message: 'Photo uploaded successfully', photo_url })
})

export const setAwardee = asyncHandler(async (req: Request, res: Response) => {
  const { participant_id } = req.params
  const { is_awardee, awardee_description } = req.body
  if (typeof is_awardee !== 'boolean') throw new AppError('is_awardee (boolean) is required', 400)
  const updated = await setAwardeeService(Number(participant_id), is_awardee, awardee_description ?? null)
  res.json(updated)
})