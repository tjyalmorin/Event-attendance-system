import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import { registerParticipantSchema, setLabelSchema } from '../../schemas/participants.schema.js'
import {
  registerParticipant,
  getParticipantsByEvent,
  cancelParticipant,
  uploadParticipantPhoto,
  setLabel,
  restoreParticipant,
  permanentDeleteParticipant,
} from './participants.controller.js'

const router = Router()

// PUBLIC — no auth, agents register themselves
router.post('/register/:event_id', validate(registerParticipantSchema), registerParticipant)

// PROTECTED
router.get('/event/:event_id', authenticate, getParticipantsByEvent)
router.delete('/:participant_id', authenticate, roleGuard('admin'), cancelParticipant)

// PHOTO UPLOAD — admin only (multipart/form-data, no body validation needed)
router.post('/:participant_id/photo', authenticate, roleGuard('admin'), uploadParticipantPhoto)

// LABEL — admin and staff
router.patch('/:participant_id/label', authenticate, roleGuard('admin', 'staff'), validate(setLabelSchema), setLabel)

// ── Trash Bin (admin only) ────────────────────────────────────────────────────
// NOTE: specific routes (/restore, /permanent) must come BEFORE /:participant_id
router.patch('/:participant_id/restore', authenticate, roleGuard('admin'), restoreParticipant)
router.delete('/:participant_id/permanent', authenticate, roleGuard('admin'), permanentDeleteParticipant)

export default router