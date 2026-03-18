import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  getCustomFieldsByEvent,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderCustomFields,
} from './custom-fields.controller.js'

const router = Router()

// Public GET — used by registration form to load questions
router.get('/events/:event_id/fields', getCustomFieldsByEvent)

// Admin-only writes — must come after authenticate
router.post('/events/:event_id/fields',         authenticate, roleGuard('admin'), createCustomField)
router.post('/events/:event_id/fields/reorder', authenticate, roleGuard('admin'), reorderCustomFields)
router.put('/fields/:field_id',                 authenticate, roleGuard('admin'), updateCustomField)
router.delete('/fields/:field_id',              authenticate, roleGuard('admin'), deleteCustomField)

export default router