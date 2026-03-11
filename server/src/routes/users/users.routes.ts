import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
} from '../../schemas/users.schema.js'
import {
  createUser,
  getAllUsers,
  deleteUser,
  updateUser,
  toggleUserActive,
  updateProfile,
  changePassword,
  adminResetPassword,
  getStaffByBranches,
} from './users.controller.js'
import { grantAdminAccess, getMyAdminGrants, revokeAdminAccess } from './admin-grant.controller.js'

const router = Router()

router.use(authenticate)

// ── Own profile (any logged-in user) ──────────────────────
router.put('/profile',          validate(updateProfileSchema),  updateProfile)
router.put('/change-password',  validate(changePasswordSchema), changePassword)

// ── Staff by branches (must come BEFORE /:user_id) ────────
router.get('/staff-by-branches', getStaffByBranches)

// ── Admin grant routes (must come BEFORE /:user_id) ───────
router.post('/admin-grant',             roleGuard('admin'), grantAdminAccess)
router.get('/admin-grants/me',          getMyAdminGrants)
router.delete('/admin-grant/:grant_id', roleGuard('admin'), revokeAdminAccess)

// ── User management (admin only) ──────────────────────────
router.post('/',                       roleGuard('admin'), validate(createUserSchema),         createUser)
router.get('/',                        roleGuard('admin'),                                     getAllUsers)
router.put('/:user_id',                roleGuard('admin'), validate(updateUserSchema),         updateUser)
router.patch('/:user_id/active',       roleGuard('admin'),                                     toggleUserActive)
router.delete('/:user_id',             roleGuard('admin'),                                     deleteUser)
router.put('/:user_id/reset-password', roleGuard('admin'), validate(adminResetPasswordSchema), adminResetPassword)

export default router