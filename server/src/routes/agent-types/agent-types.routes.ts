import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  getAllAgentTypes,
  getAllAgentTypesAdmin,
  createAgentType,
  updateAgentType,
  deleteAgentType,
  reorderAgentTypes,
} from './agent-types.controller.js'

const router = Router()

// Public GET — used by registration form dropdown
router.get('/', getAllAgentTypes)

// Admin-only reads
router.get('/all',                        authenticate, roleGuard('admin'), getAllAgentTypesAdmin)

// Admin-only writes
router.post('/',                          authenticate, roleGuard('admin'), createAgentType)
router.put('/reorder',                    authenticate, roleGuard('admin'), reorderAgentTypes)
router.put('/:agent_type_id',             authenticate, roleGuard('admin'), updateAgentType)
router.delete('/:agent_type_id',          authenticate, roleGuard('admin'), deleteAgentType)

export default router