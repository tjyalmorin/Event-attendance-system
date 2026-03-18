import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import multer from 'multer'
import {
  bulkImportParticipants,
  getBulkImportLogs,
  downloadImportTemplate,
} from './bulk-import.controller.js'

// Memory storage — file buffer passed to ExcelJS for parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
})

const router = Router()

router.use(authenticate)
router.use(roleGuard('admin'))

router.get('/template',                      downloadImportTemplate)
router.post('/events/:event_id/import',      upload.single('file'), bulkImportParticipants)
router.get('/events/:event_id/import-logs',  getBulkImportLogs)

export default router