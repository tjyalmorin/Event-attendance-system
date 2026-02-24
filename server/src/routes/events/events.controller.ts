import { Request, Response } from 'express'
import {
  createEventService, getAllEventsService, getEventByIdService,
  updateEventService, softDeleteEventService, assignPermissionService
} from './events.service.js'

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await createEventService(req.user!.user_id, req.body)
    res.status(201).json(event)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user
    const events = await getAllEventsService(user?.user_id, user?.role, user?.branch_name)
    res.json(events)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}

export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await getEventByIdService(Number(req.params.event_id))
    res.json(event)
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
}

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await updateEventService(Number(req.params.event_id), req.body)
    res.json(event)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    await softDeleteEventService(Number(req.params.event_id))
    res.json({ message: 'Event deleted successfully' })
  } catch (err: any) {
    res.status(404).json({ error: err.message })
  }
}

export const assignPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.body
    const permission = await assignPermissionService(Number(req.params.event_id), user_id)
    res.status(201).json(permission)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}