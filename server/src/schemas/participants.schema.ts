import { z } from 'zod'

// agent_type is now a free string validated against DB values at service layer
// (not a hardcoded enum) so we just validate it's a non-empty string here
export const registerParticipantSchema = z.object({
  agent_code:  z.string().min(1, 'Agent code is required').max(50),
  full_name:   z.string().min(1, 'Full name is required').max(255),
  branch_name: z.string().min(1, 'Branch name is required').max(255),
  team_name:   z.string().min(1, 'Team name is required').max(255),
  agent_type:  z.string().min(1, 'Agent type is required').max(100),
  answers: z.array(
    z.object({
      field_id: z.number().int().positive(),
      answer:   z.string().max(5000).nullable().optional(),
    })
  ).optional(),
})

export const setLabelSchema = z.object({
  label:             z.string().max(100).nullable(),
  label_description: z.string().max(500).optional().nullable(),
})