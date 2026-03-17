import { Request, Response } from 'express'
import asyncHandler from '../../middlewares/asyncHandler.js'
import cloudinary from '../../config/cloudinary.js'
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

const extractPublicId = (url: string): string => {
  const parts = url.split('/upload/')
  if (parts.length < 2) return ''
  return parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '')
}

const uploadSlideshowFiles = async (
  files: Express.Multer.File[],
  eventId?: number
): Promise<string[]> => {
  return Promise.all(
    files.map((file, i) => {
      const filename = eventId
        ? `events/${eventId}/slide-${i}-${Date.now()}`
        : `slide-${Date.now()}-${Math.round(Math.random() * 1e6)}-${i}`
      return uploadToCloudinary(file.buffer, 'primelog/slideshow', filename)
    })
  )
}

const deleteCloudinaryUrls = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(url => {
      const publicId = extractPublicId(url)
      if (!publicId) return Promise.resolve()
      return cloudinary.uploader.destroy(publicId).catch(() => {})
    })
  )
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

  try {
    const event = await createEventService(req.user!.user_id, body)
    res.status(201).json(event)
  } catch (dbErr) {
    await deleteCloudinaryUrls(slideshowUrls)
    throw dbErr
  }
})

export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user
  const events = await getAllEventsService(user?.user_id, user?.role, user?.branch_name)
  res.json(events)
})

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const isPublic = !req.headers.authorization
  const event = await getEventByIdService(Number(req.params.event_id), isPublic)
  res.json(event)
})

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined
  const eventId = Number(req.params.event_id)

  const newSlideshowFiles = files?.filter(f => f.fieldname === 'slideshow_images') ?? []
  const newSlideshowUrls = await uploadSlideshowFiles(newSlideshowFiles, eventId)

  const removeSlideshowUrls: string[] = Array.isArray(req.body.remove_slideshow_urls)
    ? req.body.remove_slideshow_urls
    : []

  // ── staff_ids: only include in payload when explicitly sent by the client ──
  // When omitted (e.g. modal still initializing), undefined tells the service
  // to skip the staff update entirely and preserve existing assignments.
  const staffIdsPayload = req.body.staff_ids !== undefined
    ? { staff_ids: parseField(req.body.staff_ids) }
    : {}

  // ── preset_url: distinguish three cases ───────────────────────────────────
  // ''  (empty string) → admin explicitly cleared it → pass null to service
  // URL string         → admin set or preserved it   → pass URL to service
  // undefined          → field absent from FormData   → omit so service keeps existing
  const presetPayload = req.body.preset_url !== undefined
    ? { preset_url: req.body.preset_url === '' ? null : req.body.preset_url }
    : {}

  const body = {
    ...req.body,
    ...staffIdsPayload,
    ...presetPayload,
    event_branches:        parseField(req.body.event_branches),
    new_slideshow_urls:    newSlideshowUrls,
    remove_slideshow_urls: removeSlideshowUrls,
  }

  try {
    const event = await updateEventService(eventId, body)

    if (removeSlideshowUrls.length > 0) {
      await deleteCloudinaryUrls(removeSlideshowUrls)
    }

    res.json(event)
  } catch (dbErr) {
    await deleteCloudinaryUrls(newSlideshowUrls)
    throw dbErr
  }
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
  const event = await getEventByIdService(Number(req.params.event_id))
  const slideshowUrls: string[] = Array.isArray(event.slideshow_urls) ? event.slideshow_urls : []

  await permanentDeleteEventService(Number(req.params.event_id))

  if (slideshowUrls.length > 0) {
    await deleteCloudinaryUrls(slideshowUrls)
  }

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