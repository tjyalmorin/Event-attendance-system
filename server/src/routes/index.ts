import { Router } from 'express'
import authRoutes from './auth/auth.routes'
import usersRoutes from './users/users.routes'
import eventsRoutes from './events/events.routes'
import participantsRoutes from './participants/participants.routes'
import scanRoutes from './scan/scan.routes'
import branchRoutes from './branches/branches.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/events', eventsRoutes)
router.use('/branches', branchRoutes)
router.use('/participants', participantsRoutes)
router.use('/attendance', scanRoutes)

export default router