import { z } from 'zod'

const AGENT_TYPES = ['District Manager', 'Area Manager', 'Branch Manager', 'Unit Manager', 'Agent'] as const

export const registerParticipantSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  full_name: z.string().min(1, 'Full name is required').max(100),
  branch_name: z.string().min(1, 'Branch name is required').max(255),
  team_name: z.string().min(1, 'Team name is required').max(255),
  agent_type: z.enum(AGENT_TYPES, { error: () => ({ message: 'Valid agent type is required' }) }),
})

export const setLabelSchema = z.object({
  label: z.string().max(100).nullable(),
  label_description: z.string().max(500).optional().nullable()
})