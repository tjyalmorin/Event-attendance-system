import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import {
  createEventService, getAllEventsService, getEventByIdService,
  updateEventService, softDeleteEventService, assignPermissionService,
  getTrashedEventsService, restoreEventService, permanentDeleteEventService,
  getEventStaffService, removeEventStaffService,
  getArchivedEventsService, restoreArchivedEventService,
  copyEventService
} from './events.service.js'

const parseField = (val: any) => {
  if (!val) return []
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return val
}

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined

  // Collect all uploaded slideshow images (field name: slideshow_images)
  const slideshowFiles = files?.filter(f => f.fieldname === 'slideshow_images') ?? []
  const slideshowUrls = slideshowFiles.map(f => `/uploads/slideshow/${f.filename}`)

  const body = {
    ...req.body,
    event_branches:     parseField(req.body.event_branches),
    staff_ids:          parseField(req.body.staff_ids),
    description:        req.body.description         || null,
    start_time:         req.body.start_time          || null,
    end_time:           req.body.end_time            || null,
    checkin_cutoff:     req.body.checkin_cutoff      || null,
    registration_start: req.body.registration_start  || null,
    registration_end:   req.body.registration_end    || null,
    slideshow_urls:     slideshowUrls,
    preset_url:         req.body.preset_url || null,
  }

  const event = await createEventService(req.user!.user_id, body)
  res.status(201).json(event)
})

export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  const events = await getAllEventsService(user?.user_id, user?.role, user?.branch_name)
  res.json(events)
})

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const event = await getEventByIdService(Number(req.params.event_id))
  res.json(event)
})

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined

  // New slideshow images uploaded in this request
  const newSlideshowFiles = files?.filter(f => f.fieldname === 'slideshow_images') ?? []
  const newSlideshowUrls = newSlideshowFiles.map(f => `/uploads/slideshow/${f.filename}`)

  // URLs the frontend wants removed from the existing array
  const removeSlideshowUrls: string[] = parseField(req.body.remove_slideshow_urls)

  const body = {
    ...req.body,
    event_branches:        parseField(req.body.event_branches),
    staff_ids:             parseField(req.body.staff_ids),
    new_slideshow_urls:    newSlideshowUrls,
    remove_slideshow_urls: removeSlideshowUrls,
    // preset_url: empty string means remove, otherwise use value from body
    preset_url: req.body.preset_url === ''
      ? null
      : req.body.preset_url ?? undefined,
  }

  const event = await updateEventService(Number(req.params.event_id), body)
  res.json(event)
})

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await softDeleteEventService(Number(req.params.event_id))
  res.json({ message: 'Event deleted successfully' })
})

export const assignPermission = asyncHandler(async (req: Request, res: Response) => {
  const { user_id } = req.body
  const permission = await assignPermissionService(Number(req.params.event_id), user_id)
  res.status(201).json(permission)
})

export const getTrashedEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await getTrashedEventsService()
  res.json(events)
})

export const restoreEvent = asyncHandler(async (req: Request, res: Response) => {
  const restored = await restoreEventService(Number(req.params.event_id))
  res.json({ message: `Event "${restored.title}" restored successfully`, event: restored })
})

export const permanentDeleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await permanentDeleteEventService(Number(req.params.event_id))
  res.json({ message: 'Event permanently deleted' })
})

export const getEventStaff = asyncHandler(async (req: Request, res: Response) => {
  const event_id = Number(req.params.event_id)
  const data = await getEventStaffService(event_id)
  res.json(data)
})

export const removeEventStaff = asyncHandler(async (req: Request, res: Response) => {
  const event_id = Number(req.params.event_id)
  const { user_id } = req.params
  await removeEventStaffService(event_id, user_id)
  res.json({ message: 'Staff removed from event' })
})

// ── Archive ───────────────────────────────────────────────────────────────────

export const getArchivedEvents = asyncHandler(async (_req: Request, res: Response) => {
  const events = await getArchivedEventsService()
  res.json(events)
})

export const restoreArchivedEvent = asyncHandler(async (req: Request, res: Response) => {
  const restored = await restoreArchivedEventService(Number(req.params.event_id))
  res.json({ message: `Event "${restored.title}" restored successfully`, event: restored })
})

// ── Copy Event ────────────────────────────────────────────────────────────────

export const copyEvent = asyncHandler(async (req: Request, res: Response) => {
  const event_id = Number(req.params.event_id)
  const created_by = req.user!.user_id
  const newEvent = await copyEventService(event_id, created_by)
  res.status(201).json(newEvent)
})