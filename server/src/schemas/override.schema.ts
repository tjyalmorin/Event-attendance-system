import { z } from 'zod'

export const fixCheckinSchema = z.object({
    session_id: z.number({ error: 'Session ID is required' }),
    participant_id: z.number({ error: 'Participant ID is required' }),
    event_id: z.number({ error: 'Event ID is required' }),
    adjusted_time: z.string({ error: 'Adjusted time is required' }),
    reason: z.string({ error: 'Reason is required' }).min(1, 'Reason cannot be empty')
})

export const forceCheckoutSchema = z.object({
    session_id: z.number({ error: 'Session ID is required' }),
    participant_id: z.number({ error: 'Participant ID is required' }),
    event_id: z.number({ error: 'Event ID is required' }),
    adjusted_time: z.string({ error: 'Check-out time is required' }),
    reason: z.string({ error: 'Reason is required' }).min(1, 'Reason cannot be empty')
})

export const earlyOutSchema = z.object({
    session_id: z.number({ error: 'Session ID is required' }),
    participant_id: z.number({ error: 'Participant ID is required' }),
    event_id: z.number({ error: 'Event ID is required' }),
    early_out_cutoff: z.string({ error: 'Early out cutoff time is required' }),
    adjusted_time: z.string({ error: 'Adjusted check-out time is required' }),
    reason: z.string({ error: 'Reason is required' }).min(1, 'Reason cannot be empty')
})
