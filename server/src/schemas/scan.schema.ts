import { z } from 'zod'

export const lookupSchema = z.object({
  query: z.string().min(1, 'Agent code or surname is required').optional(),
  agent_code: z.string().min(1).optional(),
  event_id: z.number({ error: 'event_id is required' }).int().positive(),
  branch_name: z.string().max(255).optional().nullable()
}).refine(data => data.query || data.agent_code, {
  message: 'query or agent_code is required'
})

export const resolveSchema = z.object({
  participant_id: z.number({ error: 'participant_id is required' }).int().positive(),
  event_id: z.number({ error: 'event_id is required' }).int().positive()
})

export const scanSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  event_id: z.number({ error: 'event_id is required' }).int().positive(),
  is_early_out: z.boolean().optional().default(false),
  early_out_reason: z.string().max(500).optional().nullable()
})

export const logDenialSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  event_id: z.number({ error: 'event_id is required' }).int().positive(),
  reason: z.string().max(500).optional()
})

export const updateSessionTimesSchema = z.object({
  check_in_time: z
    .string({ error: 'check_in_time is required' })
    .datetime({ message: 'check_in_time must be a valid ISO 8601 datetime' }),
  check_out_time: z
    .string()
    .datetime({ message: 'check_out_time must be a valid ISO 8601 datetime' })
    .nullable()
    .optional(),
}).refine(
  data => {
    if (!data.check_out_time) return true
    return new Date(data.check_out_time) > new Date(data.check_in_time)
  },
  { message: 'check_out_time must be after check_in_time', path: ['check_out_time'] }
)

export const bulkCheckOutSchema = z.object({
  session_ids: z
    .array(z.number().int().positive())
    .min(1, 'session_ids must contain at least one ID'),
})