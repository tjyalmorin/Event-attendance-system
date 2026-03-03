// STEP 05 — server/src/routes/scan/scan.routes.ts
// TYPE: Full replacement
// WHY: Added POST /resolve route for the surname disambiguation step

import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import { lookupParticipant, resolveParticipant, scanAgentCode, logDenial, getSessionsByEvent, getScanLogsByEvent } from './scan.controller.js'
import { scanLimiter, lookupLimiter } from '../../middlewares/rateLimiters.js'

const router = Router()

router.use(authenticate)

router.post('/lookup', lookupLimiter, lookupParticipant)
router.post('/resolve', lookupLimiter, resolveParticipant)   // ← NEW
router.post('/scan', scanLimiter, scanAgentCode)
router.post('/deny', logDenial)
router.get('/sessions/:event_id', getSessionsByEvent)
router.get('/logs/:event_id', getScanLogsByEvent)

export default router