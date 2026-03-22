import { z } from 'zod'

const AGENT_TYPES = ['District Manager', 'Area Manager', 'Branch Manager', 'Unit Manager', 'Agent'] as const

export const registerParticipantSchema = z.object({
  agent_code: z.string().min(1, 'Agent code is required').max(50),
  full_name: z.string().min(1, 'Full name is required').max(100),
  branch_name: z.string().min(1, 'Branch name is required').max(255),
  team_name: z.string().min(1, 'Team name is required').max(255),
  agent_type: z.enum(AGENT_TYPES, { error: () => ({ message: 'Valid agent type is required' }) }),
  custom_answers: z.record(z.string(), z.string()).optional(),
})

export const setLabelSchema = z.object({
  label: z.string().max(100).nullable(),
  label_description: z.string().max(500).optional().nullable()
})

// ── Form Fields ────────────────────────────────────────────────────────────

const conditionRuleSchema = z.object({
  field_key: z.string().min(1),
  operator: z.enum(['eq', 'neq']),
  value: z.string(),
})

const pageConditionsSchema = z.object({
  logic: z.enum(['AND', 'OR']),
  rules: z.array(conditionRuleSchema).min(1),
})

const formFieldSchema = z.object({
  field_key:          z.string().min(1).max(100),
  label:              z.string().min(1).max(255),
  // Accept both "type" (new) and "field_type" (old UI) — coerce field_type → type
  type:               z.enum(['text', 'textarea', 'radio', 'dropdown', 'checkbox', 'date']).optional(),
  field_type:         z.enum(['text', 'textarea', 'radio', 'dropdown', 'checkbox', 'date']).optional(),
  options:            z.array(z.string()).default([]),
  page_number:        z.number().int().min(1),
  page_label:         z.string().max(255).nullable().optional(),
  page_title:         z.string().max(255).nullable().optional(),
  page_description:   z.string().nullable().optional(),
  page_conditions:    pageConditionsSchema.nullable().optional(),
  condition:          conditionRuleSchema.nullable().optional(),
  is_required:        z.boolean().default(false),
  is_final:           z.boolean().default(false),
  sort_order:         z.number().int().min(0).default(0),
}).transform(data => ({
  ...data,
  // Normalize: use type if set, else fall back to field_type
  type: (data.type ?? data.field_type ?? 'text') as 'text' | 'textarea' | 'radio' | 'dropdown' | 'checkbox',
  page_label: data.page_label ?? data.page_title ?? null,
}))

export const saveFormFieldsSchema = z.object({
  fields: z.array(formFieldSchema),
})