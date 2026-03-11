import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import authorizeAdmin from '../../middlewares/authorizeAdmin.js'
import validate from '../../middlewares/validate.js'
import { lookupSchema, resolveSchema, scanSchema, logDenialSchema, updateSessionTimesSchema, bulkCheckOutSchema } from '../../schemas/scan.schema.js'
import {
  lookupParticipant, resolveParticipant, scanAgentCode,
  logDenial, getSessionsByEvent, getScanLogsByEvent,
  updateSessionTimes, bulkCheckOut,
} from './scan.controller.js'
import { scanLimiter, lookupLimiter } from '../../middlewares/rateLimiters.js'

const router = Router()

router.use(authenticate)

router.post('/lookup',  lookupLimiter, validate(lookupSchema),  lookupParticipant)
router.post('/resolve', lookupLimiter, validate(resolveSchema), resolveParticipant)
router.post('/scan',    scanLimiter,   validate(scanSchema),    scanAgentCode)
router.post('/deny',   validate(logDenialSchema),               logDenial)
router.get('/sessions/:event_id',                               getSessionsByEvent)
router.get('/logs/:event_id',                                   getScanLogsByEvent)

// ── Admin-only ──
router.patch('/sessions/:session_id/times',          authorizeAdmin, validate(updateSessionTimesSchema), updateSessionTimes)
router.post('/sessions/:event_id/bulk-checkout',     authorizeAdmin, validate(bulkCheckOutSchema),       bulkCheckOut)

export default router