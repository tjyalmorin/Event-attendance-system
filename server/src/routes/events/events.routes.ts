import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import { createEventSchema, updateEventSchema } from '../../schemas/events.schema.js'
import { uploadPoster } from '../../middlewares/upload.js'
import {
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, assignPermission,
  getTrashedEvents, restoreEvent, permanentDeleteEvent,
  getEventStaff, removeEventStaff,
  getArchivedEvents, restoreArchivedEvent,
  copyEvent
} from './events.controller.js'
import { getEventAdminGrants } from '../users/admin-grant.controller.js'
import { getCancelledParticipantsByEvent } from '../participants/participants.controller.js'

const router = Router()

// ── Static/named routes come FIRST — before /:event_id ───────
router.get('/trash',    authenticate, roleGuard('admin'), getTrashedEvents)
router.get('/archived', authenticate, roleGuard('admin'), getArchivedEvents)

// ── Standard routes ───────────────────────────────────────────
router.get('/', authenticate, getAllEvents)

// ── FIX #4, #5: Add validate(createEventSchema) BEFORE controller ───────────
// uploadPoster.any() runs first (handles multipart), then Zod validates the body
router.post('/', authenticate, roleGuard('admin'), uploadPoster.any(), validate(createEventSchema), createEvent)

// ── Event-specific routes ─────────────────────────────────────
router.get('/:event_id',    getEventById)  // ← PUBLIC: used by RegistrationPage
router.put('/:event_id',    authenticate, roleGuard('admin'), validate(updateEventSchema), updateEvent)
router.delete('/:event_id', authenticate, roleGuard('admin'), deleteEvent)

router.post('/:event_id/copy',              authenticate, roleGuard('admin'), copyEvent)
router.post('/:event_id/restore',           authenticate, roleGuard('admin'), restoreEvent)
router.post('/:event_id/restore-archive',   authenticate, roleGuard('admin'), restoreArchivedEvent)
router.delete('/:event_id/permanent',       authenticate, roleGuard('admin'), permanentDeleteEvent)
router.post('/:event_id/permissions',       authenticate, roleGuard('admin'), assignPermission)
router.get('/:event_id/admin-grants',       authenticate, roleGuard('admin'), getEventAdminGrants)

// ── Staff management ──────────────────────────────────────────
router.get('/:event_id/staff',              authenticate, roleGuard('admin'), getEventStaff)
router.delete('/:event_id/staff/:user_id',  authenticate, roleGuard('admin'), removeEventStaff)

// ── Cancelled participants (trash bin) ────────────────────────
router.get('/:event_id/participants/cancelled', authenticate, roleGuard('admin'), getCancelledParticipantsByEvent)

export default router