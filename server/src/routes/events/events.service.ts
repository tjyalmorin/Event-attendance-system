import pool from '../../config/database.js'
import { randomBytes } from 'crypto'
import { CreateEventPayload, UpdateEventPayload } from '../../types/event.types.js'
import { NotFoundError, ValidationError, AppError } from '../../errors/AppError.js'

const validateEventId = (id: number) => {
  if (!id || isNaN(id) || id < 1) {
    throw new ValidationError('Invalid event ID: must be a positive integer')
  }
}

const registeredCountJoin = `
  LEFT JOIN (
    SELECT event_id, COUNT(*)::int AS registered_count
    FROM participants
    WHERE deleted_at IS NULL
      AND registration_status != 'cancelled'
    GROUP BY event_id
  ) pc ON pc.event_id = e.event_id
`

export const createEventService = async (created_by: string, payload: CreateEventPayload) => {
  const registration_link = randomBytes(28).toString('hex') // 12-char hex e.g. "a3f8c2d1e4b7"

  const result = await pool.query(
    `INSERT INTO events
      (created_by, title, description, event_date, start_time, end_time,
       registration_start, registration_end, venue, checkin_cutoff,
       registration_link, slideshow_urls, preset_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::text[],$13,'draft')
     RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, 0::int as registered_count`,
    [
      created_by, payload.title, payload.description, payload.event_date,
      payload.start_time, payload.end_time, payload.registration_start,
      payload.registration_end, payload.venue,
      payload.checkin_cutoff, registration_link,
      payload.slideshow_urls ?? [],
      payload.preset_url ?? null
    ]
  )

  const event = result.rows[0]

  if (payload.event_branches && payload.event_branches.length > 0) {
    for (const b of payload.event_branches) {
      await pool.query(
        `INSERT INTO event_branches (event_id, branch_name, team_names)
         VALUES ($1, $2, $3)
         ON CONFLICT (event_id, branch_name) DO UPDATE SET team_names = EXCLUDED.team_names`,
        [event.event_id, b.branch_name, b.teams]
      )
    }
  }

  if (payload.staff_ids && payload.staff_ids.length > 0) {
    const staffValues = payload.staff_ids
      .map((_, i) => `($1, $${i + 2})`)
      .join(',')
    await pool.query(
      `INSERT INTO event_permissions (event_id, user_id) VALUES ${staffValues}
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [event.event_id, ...payload.staff_ids]
    )
  }

  return event
}

export const getAllEventsService = async (userId?: string, userRole?: string, _userBranch?: string) => {
  if (userRole === 'admin') {
    const result = await pool.query(
      `SELECT e.*,
              e.event_date::text AS event_date,
              COALESCE(pc.registered_count, 0) AS registered_count
       FROM events e
       ${registeredCountJoin}
       WHERE e.deleted_at IS NULL
         AND e.status != 'archived'
       ORDER BY e.event_date DESC`
    )
    return result.rows
  }

  if (userRole === 'staff' && userId) {
    const result = await pool.query(
      `SELECT DISTINCT e.*,
              e.event_date::text AS event_date,
              COALESCE(pc.registered_count, 0) AS registered_count
       FROM events e
       ${registeredCountJoin}
       INNER JOIN event_permissions ep
         ON ep.event_id = e.event_id
         AND ep.user_id = $1
       WHERE e.deleted_at IS NULL
         AND e.status != 'archived'
       ORDER BY e.event_date DESC`,
      [userId]
    )
    return result.rows
  }

  throw new AppError('Invalid user role', 403)
}

export const getEventByIdService = async (event_id: number, isPublic = false) => {
  validateEventId(event_id)

  const result = await pool.query(
    `SELECT e.*,
            e.event_date::text AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count,
            COALESCE(e.slideshow_urls, '{}') AS slideshow_urls,
            COALESCE(
              (SELECT json_agg(json_build_object('branch_name', branch_name, 'team_names', team_names))
               FROM event_branches WHERE event_id = $1),
              '[]'
            ) AS event_branches
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*)::int AS registered_count
       FROM participants
       WHERE deleted_at IS NULL AND registration_status != 'cancelled' AND event_id = $1
       GROUP BY event_id
     ) pc ON pc.event_id = e.event_id
     WHERE e.event_id = $1 AND e.deleted_at IS NULL`,
    [event_id]
  )

  if (!result.rows[0]) throw new NotFoundError('Event not found')

  const event = result.rows[0]

  if (isPublic) {
    const {
      created_by,
      version,
      registration_link,
      created_at,
      updated_at,
      deleted_at,
      ...publicEvent
    } = event
    return publicEvent
  }

  return event
}

// ── Public: fetch event by registration_link token ─────────────────────────
// Used by the registration page (/register/:token).
// Always returns public-safe fields — sensitive columns are stripped.
export const getEventByTokenService = async (token: string) => {
  if (!token || typeof token !== 'string' || token.length > 100) {
    throw new ValidationError('Invalid registration token')
  }

  const result = await pool.query(
    `SELECT e.*,
            e.event_date::text AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count,
            COALESCE(e.slideshow_urls, '{}') AS slideshow_urls,
            COALESCE(
              (SELECT json_agg(json_build_object('branch_name', branch_name, 'team_names', team_names))
               FROM event_branches WHERE event_id = e.event_id),
              '[]'
            ) AS event_branches,
            COALESCE(
              (SELECT json_agg(
                json_build_object(
                  'field_id',        ff.field_id,
                  'field_key',       ff.field_key,
                  'label',           ff.label,
                  'field_type',      ff.field_type,
                  'options',         ff.options,
                  'is_required',     ff.is_required,
                  'sort_order',      ff.sort_order,
                  'page_number',     ff.page_number,
                  'page_title',      ff.page_title,
                  'page_description',ff.page_description,
                  'page_condition',  ff.page_condition,
                  'page_conditions', ff.page_conditions,
                  'is_final',        ff.is_final,
                  'condition',       ff.condition,
                  'section_key',        ff.section_key,
                  'section_label',      ff.section_label,
                  'section_conditions', ff.section_conditions
                ) ORDER BY ff.page_number, ff.sort_order
              )
               FROM event_form_fields ff WHERE ff.event_id = e.event_id),
              '[]'
            ) AS form_fields
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*)::int AS registered_count
       FROM participants
       WHERE deleted_at IS NULL AND registration_status != 'cancelled'
       GROUP BY event_id
     ) pc ON pc.event_id = e.event_id
     WHERE e.registration_link = $1 AND e.deleted_at IS NULL`,
    [token]
  )

  if (!result.rows[0]) throw new NotFoundError('Event not found')

  // Strip sensitive fields — this route is always public
  const {
    created_by,
    version,
    registration_link,
    created_at,
    updated_at,
    deleted_at,
    ...publicEvent
  } = result.rows[0]

  return publicEvent
}

export const updateEventService = async (event_id: number, payload: UpdateEventPayload) => {
  validateEventId(event_id)
  const current = await getEventByIdService(event_id)
  const merged = { ...current, ...payload }

  const existingUrls: string[] = Array.isArray(current.slideshow_urls)
    ? current.slideshow_urls
    : []

  const removedUrls: string[] = Array.isArray(payload.remove_slideshow_urls)
    ? payload.remove_slideshow_urls
    : []

  const newUrls: string[] = Array.isArray(payload.new_slideshow_urls)
    ? payload.new_slideshow_urls
    : []

  const keptUrls = existingUrls.filter(url => !removedUrls.includes(url))
  const finalUrls = [...keptUrls, ...newUrls].slice(0, 5)

  // ── preset_url: only overwrite when explicitly present in the payload ──────
  // 'preset_url' in payload = controller explicitly sent it (admin touched it)
  // 'preset_url' not in payload = controller omitted it (admin didn't touch it)
  // This prevents silently wiping the preset on every save.
  const finalPresetUrl = 'preset_url' in payload
    ? (payload.preset_url ?? null)
    : (current.preset_url ?? null)

  const result = await pool.query(
    `UPDATE events
     SET title=$1, description=$2, event_date=$3, start_time=$4, end_time=$5,
         venue=$6, status=$7, checkin_cutoff=$8,
         registration_start=$9, registration_end=$10,
         slideshow_urls=$11, preset_url=$12,
         version=version+1, updated_at=NOW()
     WHERE event_id=$13 AND deleted_at IS NULL
     RETURNING *, event_date::text AS event_date`,
    [
      merged.title, merged.description, merged.event_date, merged.start_time,
      merged.end_time, merged.venue, merged.status,
      merged.checkin_cutoff, merged.registration_start, merged.registration_end,
      finalUrls, finalPresetUrl,
      event_id
    ]
  )

  // ── Update branches ───────────────────────────────────────────────────────
  if (payload.event_branches && payload.event_branches.length > 0) {
    await pool.query(`DELETE FROM event_branches WHERE event_id = $1`, [event_id])
    for (const branch of payload.event_branches) {
      await pool.query(
        `INSERT INTO event_branches (event_id, branch_name, team_names) VALUES ($1, $2, $3)`,
        [event_id, branch.branch_name, branch.teams]
      )
    }
  }

  // ── Staff: only update when staff_ids was explicitly sent by the client ────
  // undefined = omitted from FormData = modal was still loading = skip update
  // [] = explicitly sent empty = admin removed all staff = clear all
  // [...] = explicitly sent list = update to this list
  if (payload.staff_ids !== undefined && payload.staff_ids !== null) {
    await pool.query(`DELETE FROM event_permissions WHERE event_id = $1`, [event_id])
    if (payload.staff_ids.length > 0) {
      const staffValues = payload.staff_ids
        .map((_, i) => `($1, $${i + 2})`)
        .join(',')
      await pool.query(
        `INSERT INTO event_permissions (event_id, user_id) VALUES ${staffValues}
         ON CONFLICT (event_id, user_id) DO NOTHING`,
        [event_id, ...payload.staff_ids]
      )
    }
  }

  return result.rows[0]
}

export const softDeleteEventService = async (event_id: number) => {
  validateEventId(event_id)
  const result = await pool.query(
    'UPDATE events SET deleted_at = NOW() WHERE event_id = $1 AND deleted_at IS NULL RETURNING event_id',
    [event_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Event not found')
}

export const assignPermissionService = async (event_id: number, user_id: string) => {
  const result = await pool.query(
    `INSERT INTO event_permissions (user_id, event_id, created_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, event_id) DO NOTHING
     RETURNING *`,
    [user_id, event_id]
  )
  return result.rows[0]
}

export const getEventStaffService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT u.user_id, u.full_name, u.agent_code, u.branch_name, u.email,
            ep.created_at as assigned_at
     FROM event_permissions ep
     INNER JOIN users u ON u.user_id = ep.user_id
     WHERE ep.event_id = $1
       AND u.deleted_at IS NULL
     ORDER BY ep.created_at ASC`,
    [event_id]
  )
  return result.rows
}

export const removeEventStaffService = async (event_id: number, user_id: string) => {
  const result = await pool.query(
    `DELETE FROM event_permissions WHERE event_id = $1 AND user_id = $2 RETURNING permission_id`,
    [event_id, user_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Permission not found')
  return result.rows[0]
}

export const getTrashedEventsService = async () => {
  const result = await pool.query(
    `SELECT e.*,
            e.event_date::text AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     ${registeredCountJoin}
     WHERE e.deleted_at IS NOT NULL
     ORDER BY e.deleted_at DESC`
  )
  return result.rows
}

export const restoreEventService = async (event_id: number) => {
  const result = await pool.query(
    `UPDATE events
     SET deleted_at = NULL,
         status = CASE WHEN status = 'archived' THEN 'closed' ELSE status END,
         updated_at = NOW()
     WHERE event_id = $1 AND deleted_at IS NOT NULL
     RETURNING event_id, title`,
    [event_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Event not found in trash')
  return result.rows[0]
}

export const permanentDeleteEventService = async (event_id: number) => {
  validateEventId(event_id)

  const eventCheck = await pool.query(
    `SELECT event_id, deleted_at FROM events WHERE event_id = $1`,
    [event_id]
  )
  if (!eventCheck.rows[0]) throw new NotFoundError('Event not found')

  if (!eventCheck.rows[0].deleted_at) {
    throw new AppError('Event must be soft-deleted before permanent deletion', 400)
  }

  await pool.query('DELETE FROM scan_logs WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM attendance_sessions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM participants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM event_permissions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM admin_grants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM event_branches WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM events WHERE event_id = $1', [event_id])
}

export const getArchivedEventsService = async () => {
  const result = await pool.query(
    `SELECT e.*,
            e.event_date::text AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     ${registeredCountJoin}
     WHERE e.deleted_at IS NULL
       AND e.status = 'archived'
     ORDER BY e.updated_at DESC`
  )
  return result.rows
}

export const restoreArchivedEventService = async (event_id: number) => {
  const result = await pool.query(
    `UPDATE events SET status = 'closed', updated_at = NOW()
     WHERE event_id = $1 AND deleted_at IS NULL AND status = 'archived'
     RETURNING event_id, title`,
    [event_id]
  )
  if (!result.rows[0]) throw new NotFoundError('Archived event not found')
  return result.rows[0]
}

export const copyEventService = async (event_id: number, created_by: string) => {
  const original = await getEventByIdService(event_id)

  const branchesResult = await pool.query(
    `SELECT branch_name, team_names FROM event_branches WHERE event_id = $1`,
    [event_id]
  )

  const registration_link = randomBytes(28).toString('hex') // 12-char hex e.g. "a3f8c2d1e4b7"

  const result = await pool.query(
    `INSERT INTO events
      (created_by, title, description, event_date, start_time, end_time,
       registration_start, registration_end, venue, checkin_cutoff,
       registration_link, poster_url, preset_url, slideshow_urls, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::text[],'draft')
     RETURNING *, event_date::text AS event_date, 0::int as registered_count`,
    [
      created_by,
      `Copy of ${original.title}`,
      original.description,
      original.event_date,
      original.start_time,
      original.end_time,
      null,
      null,
      original.venue,
      original.checkin_cutoff,
      registration_link,
      original.poster_url ?? null,
      original.preset_url ?? null,
      original.slideshow_urls ?? [],
    ]
  )

  const newEvent = result.rows[0]

  for (const branch of branchesResult.rows) {
    await pool.query(
      `INSERT INTO event_branches (event_id, branch_name, team_names)
       VALUES ($1, $2, $3)`,
      [newEvent.event_id, branch.branch_name, branch.team_names]
    )
  }

  return newEvent
}