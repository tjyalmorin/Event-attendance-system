import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import { createUserSchema, updateProfileSchema, changePasswordSchema, adminResetPasswordSchema } from '../../schemas/users.schema.js'
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateProfile,
  changePassword,
  adminResetPassword
} from './users.controller.js'
import { grantAdminAccess, getMyAdminGrants, revokeAdminAccess } from './admin-grant.controller.js'

const router = Router()

router.use(authenticate)

// ── Own profile (any logged-in user) ──────────────────────
router.put('/profile', validate(updateProfileSchema), updateProfile)
router.put('/change-password', validate(changePasswordSchema), changePassword)

// ── User management (admin only) ──────────────────────────
router.post('/', roleGuard('admin'), validate(createUserSchema), createUser)
router.get('/', roleGuard('admin'), getAllUsers)
router.delete('/:user_id', roleGuard('admin'), deleteUser)
router.put('/:user_id/reset-password', roleGuard('admin'), validate(adminResetPasswordSchema), adminResetPassword)

// ── Admin grant routes ─────────────────────────────────────
router.post('/admin-grant', roleGuard('admin'), grantAdminAccess)
router.get('/admin-grants/me', getMyAdminGrants)
router.delete('/admin-grant/:grant_id', roleGuard('admin'), revokeAdminAccess)

export default router