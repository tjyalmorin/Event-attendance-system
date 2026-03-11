import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  createAuditLog,
  getAuditLogs,
  deleteAuditLogsByIds,
  deleteAuditLogsOlderThan,
  clearAuditLogs,
} from './audit-logs.controller.js'

const router = Router()

router.use(authenticate)

// Any authenticated user can POST (staff can log their own profile changes)
router.post('/', createAuditLog)

// All other routes are admin-only
router.use(roleGuard('admin'))

router.get('/',                getAuditLogs)           // GET  /api/audit-logs
router.delete('/bulk',         deleteAuditLogsByIds)   // DELETE /api/audit-logs/bulk
router.delete('/retention',    deleteAuditLogsOlderThan) // DELETE /api/audit-logs/retention
router.delete('/clear',        clearAuditLogs)         // DELETE /api/audit-logs/clear

export default router