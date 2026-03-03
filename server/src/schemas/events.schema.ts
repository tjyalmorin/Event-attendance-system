import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid start time').optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid end time').optional().nullable(),
  venue: z.string().max(255).optional().nullable(),
  capacity: z.coerce.number().int().positive('Capacity must be a positive number').optional().nullable(),
  checkin_cutoff: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid cutoff time').optional().nullable(),
  registration_start: z.string().optional().nullable(),
  registration_end: z.string().optional().nullable(),
})

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['draft', 'open', 'closed', 'completed']).optional()
})