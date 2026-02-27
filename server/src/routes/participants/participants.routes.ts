import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import {
  registerParticipant,
  getParticipantsByEvent,
  cancelParticipant,
  uploadParticipantPhoto
} from './participants.controller.js'

const router = Router()

// PUBLIC — no auth, agents register themselves
router.post('/register/:event_id', registerParticipant)

// PROTECTED
router.get('/event/:event_id', authenticate, getParticipantsByEvent)
router.delete('/:participant_id', authenticate, roleGuard('admin'), cancelParticipant)

// PHOTO UPLOAD — admin only
router.post('/:participant_id/photo', authenticate, roleGuard('admin'), uploadParticipantPhoto)

export default router