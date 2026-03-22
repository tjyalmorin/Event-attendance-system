import { Router } from 'express'
import authenticate from '../../middlewares/authenticate.js'
import roleGuard from '../../middlewares/roleGuard.js'
import validate from '../../middlewares/validate.js'
import { registerParticipantSchema, setLabelSchema, saveFormFieldsSchema } from '../../schemas/participants.schema.js'
import { scanLimiter } from '../../middlewares/rateLimiters.js'
import {
  registerParticipant,
  getParticipantsByEvent,
  cancelParticipant,
  uploadParticipantPhoto,
  setLabel,
  restoreParticipant,
  permanentDeleteParticipant,
  getFormFields,
  saveFormFields,
} from './participants.controller.js'

const router = Router()

// PUBLIC — rate limited to prevent spam registrations
router.post('/register/:event_id', scanLimiter, validate(registerParticipantSchema), registerParticipant)

// ── Form Fields ────────────────────────────────────────────────────────────
// Public GET — needed by RegistrationPage (no auth, like /by-token)
router.get('/form-fields/:event_id', getFormFields)
// Admin POST — save/replace form fields for an event
router.post('/form-fields/:event_id', authenticate, roleGuard('admin'), validate(saveFormFieldsSchema), saveFormFields)

// PROTECTED
router.get('/event/:event_id', authenticate, getParticipantsByEvent)
router.delete('/:participant_id', authenticate, roleGuard('admin'), cancelParticipant)

// PHOTO UPLOAD — admin only
router.post('/:participant_id/photo', authenticate, roleGuard('admin'), uploadParticipantPhoto)

// LABEL — admin and staff
router.patch('/:participant_id/label', authenticate, roleGuard('admin', 'staff'), validate(setLabelSchema), setLabel)

// ── Trash Bin (admin only) ────────────────────────────────────────────────────
router.patch('/:participant_id/restore', authenticate, roleGuard('admin'), restoreParticipant)
router.delete('/:participant_id/permanent', authenticate, roleGuard('admin'), permanentDeleteParticipant)

export default router