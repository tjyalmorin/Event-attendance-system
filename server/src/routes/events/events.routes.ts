import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent, assignPermission } from './events.controller.js'
import { getEventAdminGrants } from '../users/admin-grant.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', getAllEvents)
router.get('/:event_id', getEventById)
router.post('/', roleGuard('admin'), createEvent)
router.put('/:event_id', roleGuard('admin'), updateEvent)
router.delete('/:event_id', roleGuard('admin'), deleteEvent)
router.post('/:event_id/permissions', roleGuard('admin'), assignPermission)
router.get('/:event_id/admin-grants', roleGuard('admin'), getEventAdminGrants)

export default router