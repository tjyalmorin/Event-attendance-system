import { Router } from 'express'
import authRoutes from './auth/auth.routes.js'
import usersRoutes from './users/users.routes.js'
import eventsRoutes from './events/events.routes.js'
import participantsRoutes from './participants/participants.routes.js'
import scanRoutes from './scan/scan.routes.js'
import branchRoutes from './branches/branches.routes.js'
import auditLogsRoutes from './audit-logs/audit-logs.routes.js'
import overrideRoutes from './override/override.routes.js'
import agentTypesRoutes from './agent-types/agent-types.routes.js'
import customFieldsRoutes from './custom-fields/custom-fields.routes.js'
import bulkImportRoutes from './bulk-import/bulk-import.routes.js'

const router = Router()

router.use('/auth',        authRoutes)
router.use('/users',       usersRoutes)
router.use('/events',      eventsRoutes)
router.use('/branches',    branchRoutes)
router.use('/participants', participantsRoutes)
router.use('/attendance',  scanRoutes)
router.use('/audit-logs',  auditLogsRoutes)
router.use('/override',    overrideRoutes)
router.use('/agent-types', agentTypesRoutes)
router.use('/custom-fields', customFieldsRoutes)
router.use('/import',      bulkImportRoutes)

export default router