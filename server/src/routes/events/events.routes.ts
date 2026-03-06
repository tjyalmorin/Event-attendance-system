import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import { createEventSchema, updateEventSchema } from '../../schemas/events.schema.js'
import {
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, assignPermission,
  getTrashedEvents, restoreEvent, permanentDeleteEvent,
  getEventStaff, removeEventStaff
} from './events.controller.js'
import { getEventAdminGrants } from '../users/admin-grant.controller.js'
import { getCancelledParticipantsByEvent } from '../participants/participants.controller.js'

const router = Router()

router.use(authenticate)

// ── Trash routes come FIRST — before /:event_id ──────────────
router.get('/trash', roleGuard('admin'), getTrashedEvents)
router.post('/:event_id/restore', roleGuard('admin'), restoreEvent)
router.delete('/:event_id/permanent', roleGuard('admin'), permanentDeleteEvent)

// ── Standard routes ───────────────────────────────────────────
router.get('/', getAllEvents)
router.get('/:event_id', getEventById)
router.post('/', roleGuard('admin'), validate(createEventSchema), createEvent)
router.put('/:event_id', roleGuard('admin'), validate(updateEventSchema), updateEvent)
router.delete('/:event_id', roleGuard('admin'), deleteEvent)
router.post('/:event_id/permissions', roleGuard('admin'), assignPermission)
router.get('/:event_id/admin-grants', roleGuard('admin'), getEventAdminGrants)

// ── Staff management (admin only) ────────────────────────────
router.get('/:event_id/staff', roleGuard('admin'), getEventStaff)
router.delete('/:event_id/staff/:user_id', roleGuard('admin'), removeEventStaff)

// ── Trash Bin — cancelled participants (admin only) ───────────
router.get('/:event_id/participants/cancelled', roleGuard('admin'), getCancelledParticipantsByEvent)

export default router