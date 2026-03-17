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

// ── Public read — no auth required ─────────────────────────
// Used by the public registration form (unauthenticated visitors)
router.get('/', getAllBranches)
router.get('/:branch_id/teams', getTeamsByBranch)

// ── Admin-only write ────────────────────────────────────────
router.post('/',                        authenticate, roleGuard('admin'), createBranch)
router.put('/:branch_id',               authenticate, roleGuard('admin'), updateBranch)
router.delete('/:branch_id',            authenticate, roleGuard('admin'), deleteBranch)

router.post('/:branch_id/teams',        authenticate, roleGuard('admin'), createTeam)
router.put('/teams/:team_id',           authenticate, roleGuard('admin'), updateTeam)
router.delete('/teams/:team_id',        authenticate, roleGuard('admin'), deleteTeam)

export default router