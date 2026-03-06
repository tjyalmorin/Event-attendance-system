import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getTeamsByBranch,
  createTeam,
  updateTeam,
  deleteTeam,
} from './branches.controller.js'

const router = Router()

router.use(authenticate)

// ── Public read (any logged-in user + public registration) ──
// GET /api/branches — used by registration form, dropdowns everywhere
router.get('/', getAllBranches)
router.get('/:branch_id/teams', getTeamsByBranch)

// ── Admin-only write ────────────────────────────────────────
router.post('/',                        roleGuard('admin'), createBranch)
router.put('/:branch_id',               roleGuard('admin'), updateBranch)
router.delete('/:branch_id',            roleGuard('admin'), deleteBranch)

router.post('/:branch_id/teams',        roleGuard('admin'), createTeam)
router.put('/teams/:team_id',           roleGuard('admin'), updateTeam)
router.delete('/teams/:team_id',        roleGuard('admin'), deleteTeam)

export default router