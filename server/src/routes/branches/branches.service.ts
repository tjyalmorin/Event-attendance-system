import pool from '../../config/database.js'

// ── Branches ───────────────────────────────────────────────────────────────

export const getAllBranchesService = async () => {
  const branches = await pool.query(
    `SELECT b.branch_id, b.name, b.created_at, b.updated_at,
       json_agg(json_build_object('team_id', t.team_id, 'name', t.name) ORDER BY t.name)
         FILTER (WHERE t.team_id IS NOT NULL) AS teams
     FROM branches b
     LEFT JOIN teams t ON t.branch_id = b.branch_id
     GROUP BY b.branch_id
     ORDER BY b.name`
  )
  return branches.rows.map(r => ({ ...r, teams: r.teams ?? [] }))
}

export const createBranchService = async (name: string) => {
  if (!name?.trim()) throw new Error('Branch name is required')
  if (name.trim().length > 255) throw new Error('Branch name too long')

  const existing = await pool.query(
    `SELECT branch_id FROM branches WHERE LOWER(name) = LOWER($1)`, [name.trim()]
  )
  if (existing.rows.length > 0) throw new Error('A branch with this name already exists')

  const res = await pool.query(
    `INSERT INTO branches (name) VALUES ($1) RETURNING *`, [name.trim()]
  )
  return { ...res.rows[0], teams: [] }
}

export const updateBranchService = async (branch_id: number, name: string) => {
  if (!name?.trim()) throw new Error('Branch name is required')

  const existing = await pool.query(
    `SELECT branch_id FROM branches WHERE LOWER(name) = LOWER($1) AND branch_id != $2`,
    [name.trim(), branch_id]
  )
  if (existing.rows.length > 0) throw new Error('A branch with this name already exists')

  const res = await pool.query(
    `UPDATE branches SET name = $1, updated_at = NOW() WHERE branch_id = $2 RETURNING *`,
    [name.trim(), branch_id]
  )
  if (!res.rows[0]) throw new Error('Branch not found')
  return res.rows[0]
}

export const deleteBranchService = async (branch_id: number) => {
  // Teams cascade-deleted via FK ON DELETE CASCADE
  const res = await pool.query(
    `DELETE FROM branches WHERE branch_id = $1 RETURNING branch_id, name`,
    [branch_id]
  )
  if (!res.rows[0]) throw new Error('Branch not found')
  return res.rows[0]
}

// ── Teams ──────────────────────────────────────────────────────────────────

export const getTeamsByBranchService = async (branch_id: number) => {
  const res = await pool.query(
    `SELECT * FROM teams WHERE branch_id = $1 ORDER BY name`,
    [branch_id]
  )
  return res.rows
}

export const createTeamService = async (branch_id: number, name: string) => {
  if (!name?.trim()) throw new Error('Team name is required')
  if (name.trim().length > 255) throw new Error('Team name too long')

  const branch = await pool.query(
    `SELECT branch_id FROM branches WHERE branch_id = $1`, [branch_id]
  )
  if (!branch.rows[0]) throw new Error('Branch not found')

  const existing = await pool.query(
    `SELECT team_id FROM teams WHERE branch_id = $1 AND LOWER(name) = LOWER($2)`,
    [branch_id, name.trim()]
  )
  if (existing.rows.length > 0) throw new Error('A team with this name already exists in this branch')

  const res = await pool.query(
    `INSERT INTO teams (branch_id, name) VALUES ($1, $2) RETURNING *`,
    [branch_id, name.trim()]
  )
  return res.rows[0]
}

export const updateTeamService = async (team_id: number, name: string) => {
  if (!name?.trim()) throw new Error('Team name is required')

  const team = await pool.query(`SELECT * FROM teams WHERE team_id = $1`, [team_id])
  if (!team.rows[0]) throw new Error('Team not found')

  const existing = await pool.query(
    `SELECT team_id FROM teams WHERE branch_id = $1 AND LOWER(name) = LOWER($2) AND team_id != $3`,
    [team.rows[0].branch_id, name.trim(), team_id]
  )
  if (existing.rows.length > 0) throw new Error('A team with this name already exists in this branch')

  const res = await pool.query(
    `UPDATE teams SET name = $1, updated_at = NOW() WHERE team_id = $2 RETURNING *`,
    [name.trim(), team_id]
  )
  return res.rows[0]
}

export const deleteTeamService = async (team_id: number) => {
  const res = await pool.query(
    `DELETE FROM teams WHERE team_id = $1 RETURNING team_id, name`,
    [team_id]
  )
  if (!res.rows[0]) throw new Error('Team not found')
  return res.rows[0]
}