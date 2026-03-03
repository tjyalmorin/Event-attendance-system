import { z } from 'zod'

export const lookupSchema = z.object({
  query: z.string().min(1, 'Agent code or surname is required').optional(),
  agent_code: z.string().min(1).optional(),
  event_id: z.number({ error: 'event_id is required' }).int().positive()
}).refine(data => data.query || data.agent_code, {
  message: 'query or agent_code is required'
})

export const resolveSchema = z.object({
  participant_id: z.number({ error: 'participant_id is required' }).int().positive(),
  event_id: z.number({ error: 'event_id is required' }).int().positive()
})

export const scanSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  event_id: z.number({ error: 'event_id is required' }).int().positive()
})

export const logDenialSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  event_id: z.number({ error: 'event_id is required' }).int().positive(),
  reason: z.string().max(500).optional()
})