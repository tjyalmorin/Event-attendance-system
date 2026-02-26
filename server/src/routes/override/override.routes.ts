import { Router } from 'express'
import authenticate from '../../middlewares/authenticate'
import roleGuard from '../../middlewares/roleGuard'
import {
  fixCheckin,
  forceCheckout,
  earlyOut,
  getOverrideLogsByEvent
} from './override.controller'

const router = Router()

router.use(authenticate)
router.use(roleGuard('admin'))

router.post('/fix-checkin', fixCheckin)
router.post('/force-checkout', forceCheckout)
router.post('/early-out', earlyOut)
router.get('/logs/:event_id', getOverrideLogsByEvent)

export default router