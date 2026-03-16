import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import { uploadToCloudinary } from '../../middlewares/upload.js'
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

// ── Helper: upload slideshow files to Cloudinary ─────────
const uploadSlideshowFiles = async (files: Express.Multer.File[]): Promise<string[]> => {
  const urls: string[] = []
  for (const file of files) {
    const filename = `slide-${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const url = await uploadToCloudinary(file.buffer, 'primelog/slideshow', filename)
    urls.push(url)
  }
  return urls
}

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined

  const slideshowFiles = files?.filter(f => f.fieldname === 'slideshow_images') ?? []
  const slideshowUrls = await uploadSlideshowFiles(slideshowFiles)

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

  // Upload any new slideshow images to Cloudinary
  const newSlideshowFiles = files?.filter(f => f.fieldname === 'slideshow_images') ?? []
  const newSlideshowUrls = await uploadSlideshowFiles(newSlideshowFiles)

  // remove_slideshow_urls: Zod already parsed it from JSON string → string[]
  // via the jsonStringArrayField preprocess in updateEventSchema.
  // We just read it directly — no need to re-parse.
  const removeSlideshowUrls: string[] = Array.isArray(req.body.remove_slideshow_urls)
    ? req.body.remove_slideshow_urls
    : []

  console.log('=== UPDATE EVENT DEBUG ===')
  console.log('remove_slideshow_urls from req.body:', req.body.remove_slideshow_urls)
  console.log('removeSlideshowUrls (final):', removeSlideshowUrls)
  console.log('newSlideshowUrls:', newSlideshowUrls)

  const body = {
    ...req.body,
    event_branches:        parseField(req.body.event_branches),
    staff_ids:             parseField(req.body.staff_ids),
    new_slideshow_urls:    newSlideshowUrls,
    remove_slideshow_urls: removeSlideshowUrls,
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

export const getArchivedEvents = asyncHandler(async (_req: Request, res: Response) => {
  const events = await getArchivedEventsService()
  res.json(events)
})

export const restoreArchivedEvent = asyncHandler(async (req: Request, res: Response) => {
  const restored = await restoreArchivedEventService(Number(req.params.event_id))
  res.json({ message: `Event "${restored.title}" restored successfully`, event: restored })
})

export const copyEvent = asyncHandler(async (req: Request, res: Response) => {
  const event_id = Number(req.params.event_id)
  const created_by = req.user!.user_id
  const newEvent = await copyEventService(event_id, created_by)
  res.status(201).json(newEvent)
})