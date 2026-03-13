import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  fixCheckin,
  forceCheckout,
  earlyOut,
  getOverrideLogsByEvent
} from './override.controller.js'
import validate from '../../middlewares/validate.js'
import {
  fixCheckinSchema,
  forceCheckoutSchema,
  earlyOutSchema
} from '../../schemas/override.schema.js'

const router = Router()

router.use(authenticate)
router.use(roleGuard('admin'))

router.post('/fix-checkin',   validate(fixCheckinSchema),   fixCheckin)
router.post('/force-checkout', validate(forceCheckoutSchema), forceCheckout)
router.post('/early-out',     validate(earlyOutSchema),     earlyOut)
router.get('/logs/:event_id', getOverrideLogsByEvent)

export default router