// STEP 11 — server/src/routes/events/events.routes.ts
// TYPE: Full replacement
// WHY: Added trash, restore, permanent-delete routes.
//      IMPORTANT: trash routes are placed BEFORE /:event_id to avoid route collision.

import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, assignPermission,
  getTrashedEvents, restoreEvent, permanentDeleteEvent
} from './events.controller.js'
import { getEventAdminGrants } from '../users/admin-grant.controller.js'

const router = Router()

router.use(authenticate)

// ── Trash routes come FIRST — before /:event_id ───────────────────────────────
router.get('/trash', roleGuard('admin'), getTrashedEvents)
router.post('/:event_id/restore', roleGuard('admin'), restoreEvent)
router.delete('/:event_id/permanent', roleGuard('admin'), permanentDeleteEvent)

// ── Standard routes ───────────────────────────────────────────────────────────
router.get('/', getAllEvents)
router.get('/:event_id', getEventById)
router.post('/', roleGuard('admin'), createEvent)
router.put('/:event_id', roleGuard('admin'), updateEvent)
router.delete('/:event_id', roleGuard('admin'), deleteEvent)
router.post('/:event_id/permissions', roleGuard('admin'), assignPermission)
router.get('/:event_id/admin-grants', roleGuard('admin'), getEventAdminGrants)

export default router