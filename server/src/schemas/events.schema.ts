import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  venue: z.string().max(255).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  checkin_cutoff: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  registration_start: z.string().optional().nullable(),
  registration_end: z.string().optional().nullable(),
  event_branches: z.array(z.object({
    branch_name: z.string().min(1),
    teams: z.array(z.string())
  })).optional().nullable(),
  staff_ids: z.array(z.string()).optional().nullable(),
})

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['draft', 'open', 'closed', 'completed', 'archived']).optional()
})