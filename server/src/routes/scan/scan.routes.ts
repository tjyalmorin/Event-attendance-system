import { Router } from 'express'
import authenticate from '../../middlewares/authenticate'
import { scanAgentCode, getSessionsByEvent, getScanLogsByEvent } from './scan.controller'

const router = Router()

router.use(authenticate)

router.post('/scan', scanAgentCode)                                    // scan a QR code
router.get('/sessions/:event_id', getSessionsByEvent)           // get all check-ins for an event
router.get('/logs/:event_id', getScanLogsByEvent)               // get all scan logs for an event

export default router
