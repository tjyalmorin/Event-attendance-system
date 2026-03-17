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

router.get('/trash',    authenticate, roleGuard('admin'), getTrashedEvents)
router.get('/archived', authenticate, roleGuard('admin'), getArchivedEvents)

router.get('/', authenticate, getAllEvents)

router.post('/', authenticate, roleGuard('admin'), uploadPoster.any(), validate(createEventSchema), createEvent)

router.get('/:event_id',    getEventById)
router.put('/:event_id',    authenticate, roleGuard('admin'), uploadPoster.any(), validate(updateEventSchema), updateEvent)
router.delete('/:event_id', authenticate, roleGuard('admin'), deleteEvent)

router.post('/:event_id/copy',              authenticate, roleGuard('admin'), copyEvent)
router.post('/:event_id/restore',           authenticate, roleGuard('admin'), restoreEvent)
router.post('/:event_id/restore-archive',   authenticate, roleGuard('admin'), restoreArchivedEvent)
router.delete('/:event_id/permanent',       authenticate, roleGuard('admin'), permanentDeleteEvent)
router.post('/:event_id/permissions',       authenticate, roleGuard('admin'), assignPermission)
router.get('/:event_id/admin-grants',       authenticate, roleGuard('admin'), getEventAdminGrants)

router.get('/:event_id/staff',              authenticate, roleGuard('admin'), getEventStaff)
router.delete('/:event_id/staff/:user_id',  authenticate, roleGuard('admin'), removeEventStaff)

router.get('/:event_id/participants/cancelled', authenticate, roleGuard('admin'), getCancelledParticipantsByEvent)

export default router