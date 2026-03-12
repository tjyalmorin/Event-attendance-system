import { z } from 'zod'

// Helper: treats empty string same as null/undefined (multipart sends "" for empty fields)
const emptyToNull = z.preprocess(val => (val === '' ? null : val), z.string().nullable().optional())

const timeField = z.preprocess(
  val => (val === '' ? null : val),
  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional()
)

const urlField = z.preprocess(
  val => (val === '' ? null : val),
  z.string().url().nullable().optional()
)

// event_branches and staff_ids can arrive as JSON strings (multipart) or arrays (JSON body)
const jsonArrayField = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.preprocess(val => {
    if (typeof val === 'string') {
      try { return JSON.parse(val) } catch { return val }
    }
    return val
  }, z.array(itemSchema).optional().nullable())

export const createEventSchema = z.object({
  title:              z.string().min(1).max(255),
  description:        emptyToNull,
  event_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time:         timeField,
  end_time:           timeField,
  venue:              z.preprocess(val => val === '' ? null : val, z.string().max(255).nullable().optional()),
  capacity:           z.preprocess(val => val === '' ? null : val, z.coerce.number().int().positive().nullable().optional()),
  checkin_cutoff:     timeField,
  registration_start: emptyToNull,
  registration_end:   emptyToNull,
  event_branches:     jsonArrayField(z.object({
                        branch_name: z.string().min(1),
                        teams: z.array(z.string())
                      })),
  staff_ids:          jsonArrayField(z.string()),
  poster_url:         urlField,
  preset_url:         urlField,
})

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['draft', 'open', 'closed', 'completed', 'archived']).optional()
})