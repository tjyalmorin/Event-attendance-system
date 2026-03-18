import { z } from 'zod'

const emptyToNull = z.preprocess(val => (val === '' ? null : val), z.string().nullable().optional())

const timeField = z.preprocess(
  val => (val === '' ? null : val),
  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional()
)

const urlField = z.preprocess(
  val => (val === '' ? null : val),
  z.string().url().nullable().optional()
)

const jsonArrayField = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.preprocess(val => {
    if (typeof val === 'string') {
      try { return JSON.parse(val) } catch { return val }
    }
    return val
  }, z.array(itemSchema).optional().nullable())

const jsonStringArrayField = z.preprocess(val => {
  if (!val) return []
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return val
}, z.array(z.string()).optional())

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
  allowed_agent_types:jsonStringArrayField,
  poster_url:         urlField,
  preset_url:         urlField,
})

export const updateEventSchema = createEventSchema.partial().extend({
  status:                z.enum(['draft', 'open', 'closed', 'completed', 'archived']).optional(),
  remove_slideshow_urls: jsonStringArrayField,
  new_slideshow_urls:    jsonArrayField(z.string()),
})