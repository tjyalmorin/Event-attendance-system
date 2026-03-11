import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import { createAuditLog, getAuditLogs } from './audit-logs.controller.js'

const router = Router()

router.use(authenticate)
router.use(roleGuard('admin'))

router.get('/',  getAuditLogs)    // GET  /api/audit-logs
router.post('/', createAuditLog)  // POST /api/audit-logs

export default router