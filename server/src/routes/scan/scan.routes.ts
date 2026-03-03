import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import validate from '../../middlewares/validate.js'
import { lookupSchema, resolveSchema, scanSchema, logDenialSchema } from '../../schemas/scan.schema.js'
import {
  lookupParticipant, resolveParticipant, scanAgentCode,
  logDenial, getSessionsByEvent, getScanLogsByEvent
} from './scan.controller.js'
import { scanLimiter, lookupLimiter } from '../../middlewares/rateLimiters.js'

const router = Router()

router.use(authenticate)

router.post('/lookup', lookupLimiter, validate(lookupSchema), lookupParticipant)
router.post('/resolve', lookupLimiter, validate(resolveSchema), resolveParticipant)
router.post('/scan', scanLimiter, validate(scanSchema), scanAgentCode)
router.post('/deny', validate(logDenialSchema), logDenial)
router.get('/sessions/:event_id', getSessionsByEvent)
router.get('/logs/:event_id', getScanLogsByEvent)

export default router