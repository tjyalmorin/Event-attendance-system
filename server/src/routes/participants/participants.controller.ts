import { Request, Response } from 'express'
import path from 'path'
import pool from '../../config/database.js'
import cloudinary from '../../config/cloudinary.js'
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

export const uploadParticipantPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { participant_id } = req.params

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    // Get participant to know their agent_code
    const result = await pool.query(
      'SELECT agent_code FROM participants WHERE participant_id = $1',
      [participant_id]
    )
    const participant = result.rows[0]
    if (!participant) {
      res.status(404).json({ error: 'Participant not found' })
      return
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '')
    const publicId = `agents/${participant.agent_code}`

    // Upload buffer to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          format: ext === 'jpg' ? 'jpg' : ext,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      stream.end(req.file!.buffer)
    })

    const photo_url = uploadResult.secure_url

    // Update ALL participants with this agent_code across all events
    await pool.query(
      `UPDATE participants SET photo_url = $1, updated_at = NOW()
       WHERE agent_code = $2`,
      [photo_url, participant.agent_code]
    )

    res.json({ message: 'Photo uploaded successfully', photo_url })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}