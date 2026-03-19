import { z } from 'zod'

export const registerParticipantSchema = z.object({
  // Core identity fields — still stored as dedicated columns on participants
  // All optional here because the admin may have removed/renamed them via form builder
  agent_code:   z.string().max(50).optional(),
  full_name:    z.string().min(1, 'Full name is required').max(100).optional(),
  branch_name:  z.string().max(255).optional(),
  team_name:    z.string().max(255).optional(),
  agent_type:   z.string().max(100).optional(),

  // Dynamic answers — keys match field_key from event_form_fields, stored in custom_responses JSONB
  custom_responses: z.record(
    z.string(),
    z.union([z.string(), z.boolean(), z.number(), z.array(z.string()), z.null()])
  ).optional().default({}),
})

export const setLabelSchema = z.object({
  label:             z.string().max(100).nullable(),
  label_description: z.string().max(500).optional().nullable(),
})

// For saving/updating form fields (used by CreateRegistrationForm page)
export const saveFormFieldsSchema = z.object({
  fields: z.array(z.object({
    field_key:        z.string().min(1).max(100),
    label:            z.string().min(1).max(255),
    field_type:       z.enum(['text', 'dropdown', 'radio', 'checkbox', 'date']),
    options:          z.array(z.string()).optional().nullable(),
    is_required:      z.boolean().default(false),
    sort_order:       z.number().int().default(0),
    page_number:      z.number().int().min(1).default(1),
    page_title:       z.string().max(255).optional().nullable(),
    page_description: z.string().optional().nullable(),
    // Legacy single condition (kept for backwards compat)
    page_condition:   z.object({
      field_key: z.string(),
      operator:  z.enum(['eq', 'neq']),
      value:     z.string(),
    }).optional().nullable(),
    // New multi-condition with AND/OR logic
    page_conditions:  z.object({
      logic: z.enum(['AND', 'OR']),
      rules: z.array(z.object({
        field_key: z.string(),
        operator:  z.enum(['eq', 'neq']),
        value:     z.string(),
      })),
    }).optional().nullable(),
    is_final: z.boolean().default(false),
    condition: z.object({
      field_key: z.string(),
      operator:  z.enum(['eq', 'neq']),
      value:     z.string(),
    }).optional().nullable(),
  }))
})