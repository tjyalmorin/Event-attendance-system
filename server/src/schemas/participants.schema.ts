import { z } from 'zod'

export const registerParticipantSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  full_name: z.string().min(1, 'Full name is required').max(100),
  branch_name: z.string().min(1, 'Branch name is required').max(255),
  team_name: z.string().min(1, 'Team name is required').max(255),
})

export const setAwardeeSchema = z.object({
  label: z.boolean({ error: 'label (boolean) is required' }),
  label_description: z.string().max(500).optional().nullable()
})