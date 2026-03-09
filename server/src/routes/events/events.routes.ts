import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import { updateEventSchema } from '../../schemas/events.schema.js'
import { uploadPoster } from '../../middlewares/upload.js'
import {
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, assignPermission,
  getTrashedEvents, restoreEvent, permanentDeleteEvent,
  getEventStaff, removeEventStaff,
  getArchivedEvents, restoreArchivedEvent
} from './events.controller.js'
import { getEventAdminGrants } from '../users/admin-grant.controller.js'
import { getCancelledParticipantsByEvent } from '../participants/participants.controller.js'

const router = Router()

router.use(authenticate)

// ── Static/named routes come FIRST — before /:event_id ───────
router.get('/trash',    roleGuard('admin'), getTrashedEvents)
router.get('/archived', roleGuard('admin'), getArchivedEvents)

// ── Standard routes ───────────────────────────────────────────
router.get('/',    getAllEvents)
router.post('/',   roleGuard('admin'), uploadPoster.any(), createEvent)

// ── Event-specific routes ─────────────────────────────────────
router.get('/:event_id',    getEventById)
router.put('/:event_id',    roleGuard('admin'), validate(updateEventSchema), updateEvent)
router.delete('/:event_id', roleGuard('admin'), deleteEvent)

router.post('/:event_id/restore',           roleGuard('admin'), restoreEvent)
router.post('/:event_id/restore-archive',   roleGuard('admin'), restoreArchivedEvent)
router.delete('/:event_id/permanent',       roleGuard('admin'), permanentDeleteEvent)
router.post('/:event_id/permissions',       roleGuard('admin'), assignPermission)
router.get('/:event_id/admin-grants',       roleGuard('admin'), getEventAdminGrants)

// ── Staff management ──────────────────────────────────────────
router.get('/:event_id/staff',              roleGuard('admin'), getEventStaff)
router.delete('/:event_id/staff/:user_id',  roleGuard('admin'), removeEventStaff)

// ── Cancelled participants (trash bin) ────────────────────────
router.get('/:event_id/participants/cancelled', roleGuard('admin'), getCancelledParticipantsByEvent)

export default router