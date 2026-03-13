import pool from '../../config/database.js'
import { v4 as uuidv4 } from 'uuid'
import { CreateEventPayload, UpdateEventPayload } from '../../types/event.types'

export const createEventService = async (created_by: string, payload: CreateEventPayload) => {
  const registration_link = `${uuidv4().split('-')[0]}-${Date.now()}`

  const result = await pool.query(
    `INSERT INTO events
      (created_by, title, description, event_date, start_time, end_time,
       registration_start, registration_end, venue, checkin_cutoff,
       registration_link, slideshow_urls, preset_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft')
     RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, 0::int as registered_count`,
    [
      created_by, payload.title, payload.description, payload.event_date,
      payload.start_time, payload.end_time, payload.registration_start,
      payload.registration_end, payload.venue,
      payload.checkin_cutoff, registration_link,
      payload.slideshow_urls ?? [],
      payload.preset_url ?? null,
    ]
  )

  const event = result.rows[0]

  // ── Insert event_branches ──────────────────────────────
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

  // ── Assign staff ───────────────────────────────────────
  if (payload.staff_ids && payload.staff_ids.length > 0) {
    for (const uid of payload.staff_ids) {
      await pool.query(
        `INSERT INTO event_permissions (event_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (event_id, user_id) DO NOTHING`,
        [event.event_id, uid]
      )
    }
  }

  return event
}

export const getAllEventsService = async (userId?: string, userRole?: string, _userBranch?: string) => {

  // Single aggregation JOIN — runs once, not once per event row
  const countJoin = `
    LEFT JOIN (
      SELECT event_id, COUNT(*)::int AS registered_count
      FROM participants
      WHERE deleted_at IS NULL
        AND registration_status != 'cancelled'
      GROUP BY event_id
    ) pc ON pc.event_id = e.event_id
  `

  if (userRole === 'admin') {
    const result = await pool.query(
      `SELECT e.*,
              TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
              COALESCE(pc.registered_count, 0) AS registered_count
       FROM events e
       ${countJoin}
       WHERE e.deleted_at IS NULL
         AND e.status != 'archived'
       ORDER BY e.event_date DESC`
    )
    return result.rows
  }

  if (userRole === 'staff' && userId) {
    const result = await pool.query(
      `SELECT DISTINCT e.*,
              TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
              COALESCE(pc.registered_count, 0) AS registered_count
       FROM events e
       ${countJoin}
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

  // Fallback
  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     ${countJoin}
     WHERE e.deleted_at IS NULL
       AND e.status != 'archived'
     ORDER BY e.event_date DESC`
  )
  return result.rows
}

export const getEventByIdService = async (event_id: number) => {
  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
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
  if (!result.rows[0]) throw new Error('Event not found')
  return result.rows[0]
}

const getEventDetailsForStaffService = async (event_id: number) => {
  const event = await getEventByIdService(event_id)

  // ── Attach event_branches ──────────────────────────────
  const branchesResult = await pool.query(
    `SELECT branch_name, team_names FROM event_branches WHERE event_id = $1 ORDER BY branch_name`,
    [event_id]
  )
  event.event_branches = branchesResult.rows

  return event
}

export const updateEventService = async (event_id: number, payload: UpdateEventPayload) => {
  const current = await getEventByIdService(event_id)
  const merged = { ...current, ...payload }

  // ── Compute new slideshow_urls array ───────────────────
  // Start with the existing array from DB
  const existingUrls: string[] = Array.isArray(current.slideshow_urls) ? current.slideshow_urls : []
  // Remove any URLs flagged for removal
  const removedUrls: string[] = payload.remove_slideshow_urls ?? []
  const keptUrls = existingUrls.filter(url => !removedUrls.includes(url))
  // Append new uploads, capped at 5 total
  const newUrls: string[] = payload.new_slideshow_urls ?? []
  const finalUrls = [...keptUrls, ...newUrls].slice(0, 5)

  const result = await pool.query(
    `UPDATE events
     SET title=$1, description=$2, event_date=$3, start_time=$4, end_time=$5,
         venue=$6, status=$7, checkin_cutoff=$8,
         registration_start=$9, registration_end=$10,
         slideshow_urls=$11, preset_url=$12,
         version=version+1, updated_at=NOW()
     WHERE event_id=$13 AND deleted_at IS NULL
     RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date`,
    [
      merged.title, merged.description, merged.event_date, merged.start_time,
      merged.end_time, merged.venue, merged.status,
      merged.checkin_cutoff, merged.registration_start, merged.registration_end,
      finalUrls, merged.preset_url ?? null,
      event_id
    ]
  )

  // ── Update event_branches if provided ──────────────────
  if (payload.event_branches && payload.event_branches.length > 0) {
    await pool.query(`DELETE FROM event_branches WHERE event_id = $1`, [event_id])
    for (const branch of payload.event_branches) {
      await pool.query(
        `INSERT INTO event_branches (event_id, branch_name, team_names)
         VALUES ($1, $2, $3)`,
        [event_id, branch.branch_name, branch.teams]
      )
    }
  }

  // ── Update staff permissions if provided ───────────────
  if (payload.staff_ids !== undefined) {
    await pool.query(`DELETE FROM event_permissions WHERE event_id = $1`, [event_id])
    if (payload.staff_ids && payload.staff_ids.length > 0) {
      for (const uid of payload.staff_ids) {
        await pool.query(
          `INSERT INTO event_permissions (event_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (event_id, user_id) DO NOTHING`,
          [event_id, uid]
        )
      }
    }
  }

  return result.rows[0]
}

export const softDeleteEventService = async (event_id: number) => {
  const result = await pool.query(
    'UPDATE events SET deleted_at = NOW() WHERE event_id = $1 AND deleted_at IS NULL RETURNING event_id',
    [event_id]
  )
  if (!result.rows[0]) throw new Error('Event not found')
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

// ── Staff management ──────────────────────────────────────────────────────────

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
    `DELETE FROM event_permissions
     WHERE event_id = $1 AND user_id = $2
     RETURNING permission_id`,
    [event_id, user_id]
  )
  if (!result.rows[0]) throw new Error('Permission not found')
  return result.rows[0]
}

// ── Feature 3: Trash Bin ──────────────────────────────────────────────────────

export const getTrashedEventsService = async () => {
  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*)::int AS registered_count
       FROM participants
       WHERE deleted_at IS NULL
         AND registration_status != 'cancelled'
       GROUP BY event_id
     ) pc ON pc.event_id = e.event_id
     WHERE e.deleted_at IS NOT NULL
     ORDER BY e.deleted_at DESC`
  )
  return result.rows
}

// ── BUG FIX: Also reset status if it was 'archived' before being trashed.
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
  if (!result.rows[0]) throw new Error('Event not found in trash')
  return result.rows[0]
}

export const permanentDeleteEventService = async (event_id: number) => {
  const check = await pool.query(
    `SELECT event_id FROM events WHERE event_id = $1 AND deleted_at IS NOT NULL`,
    [event_id]
  )
  if (!check.rows[0]) throw new Error('Event not found in trash')

  await pool.query('DELETE FROM scan_logs WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM attendance_sessions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM participants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM event_permissions WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM admin_grants WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM event_branches WHERE event_id = $1', [event_id])
  await pool.query('DELETE FROM events WHERE event_id = $1', [event_id])
}

// ── Feature 4: Archive ────────────────────────────────────────────────────────

export const getArchivedEventsService = async () => {
  const result = await pool.query(
    `SELECT e.*,
            TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date,
            COALESCE(pc.registered_count, 0) AS registered_count
     FROM events e
     LEFT JOIN (
       SELECT event_id, COUNT(*)::int AS registered_count
       FROM participants
       WHERE deleted_at IS NULL
         AND registration_status != 'cancelled'
       GROUP BY event_id
     ) pc ON pc.event_id = e.event_id
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
  if (!result.rows[0]) throw new Error('Archived event not found')
  return result.rows[0]
}

// ── Feature 5: Copy Event ─────────────────────────────────────────────────────

export const copyEventService = async (event_id: number, created_by: string) => {
  // 1. Fetch the original event
  const original = await getEventByIdService(event_id)

  // 2. Fetch its branches
  const branchesResult = await pool.query(
    `SELECT branch_name, team_names FROM event_branches WHERE event_id = $1`,
    [event_id]
  )

  // 3. Create the new event as draft with modified title
  const registration_link = `${uuidv4().split('-')[0]}-${Date.now()}`

  const result = await pool.query(
    `INSERT INTO events
      (created_by, title, description, event_date, start_time, end_time,
       registration_start, registration_end, venue, checkin_cutoff,
       registration_link, poster_url, preset_url, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'draft')
     RETURNING *, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, 0::int as registered_count`,
    [
      created_by,
      `Copy of ${original.title}`,
      original.description,
      original.event_date,
      original.start_time,
      original.end_time,
      null, // registration window intentionally reset
      null,
      original.venue,
      original.checkin_cutoff,
      registration_link,
      original.poster_url ?? null,
      original.preset_url ?? null,
    ]
  )

  const newEvent = result.rows[0]

  // 4. Copy event_branches (staff permissions are NOT copied — fresh draft)
  for (const branch of branchesResult.rows) {
    await pool.query(
      `INSERT INTO event_branches (event_id, branch_name, team_names)
       VALUES ($1, $2, $3)`,
      [newEvent.event_id, branch.branch_name, branch.team_names]
    )
  }

  return newEvent
}