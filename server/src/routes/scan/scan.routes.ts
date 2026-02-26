import { Router } from 'express'
import authenticate from '../../middlewares/authenticate'
import { scanAgentCode, getSessionsByEvent, getScanLogsByEvent } from './scan.controller'
import { scanLimiter } from '../../middlewares/rateLimiters'

const router = Router()

router.use(authenticate)

router.post('/scan', scanLimiter, scanAgentCode)
router.get('/sessions/:event_id', getSessionsByEvent)
router.get('/logs/:event_id', getScanLogsByEvent)

export default router