// Run once: tsx src/database/migrate_branches.ts
import dotenv from 'dotenv'
dotenv.config()
import pool from '../config/database.js'

const run = async () => {
  console.log('🚀 Running branches & teams migration...')

  // ── branches ───────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS branches (
      branch_id   SERIAL        PRIMARY KEY,
      name        VARCHAR(255)  NOT NULL UNIQUE,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `)

  // ── teams ──────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      team_id     SERIAL        PRIMARY KEY,
      branch_id   INT           NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
      name        VARCHAR(255)  NOT NULL,
      created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      UNIQUE(branch_id, name)
    );
  `)

  // ── indexes ────────────────────────────────────────────
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_teams_branch_id ON teams(branch_id);
  `)

  // ── updated_at triggers ────────────────────────────────
  for (const table of ['branches', 'teams']) {
    await pool.query(`
      DROP TRIGGER IF EXISTS set_updated_at_${table} ON ${table};
      CREATE TRIGGER set_updated_at_${table}
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    `)
  }

  // ── Seed from existing hardcoded data ──────────────────
  const seed = [
    { name: 'Alexandrite 3',    teams: ['Team Crisan', 'Team Jhainnie', 'Team Shai', 'Team Louis'] },
    { name: 'A3 Axinite',       teams: ['Team Tony'] },
    { name: 'A3 Goldstone',     teams: ['Team Claude', 'Team Jodel', 'Team Rechel', 'Team Roel', 'Team Sendi'] },
    { name: 'A3 Phoenix Stone', teams: ['Team Elvin', 'Team Feti', 'Team Jhen', 'Team Maan', 'Team Mark', 'Team Redge', 'Team Otchie'] },
    { name: 'Alexandrite 1',    teams: ['Team Alou', 'Team Dong', 'Team Henson', 'Team Isa', 'Team Nikki', 'Team Doris'] },
    { name: 'A1 Prime',         teams: ['Team Norj', 'Team Donel', 'Team Paulyn', 'Team Esmael'] },
  ]

  for (const branch of seed) {
    const res = await pool.query(
      `INSERT INTO branches (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING branch_id`,
      [branch.name]
    )
    const branchId = res.rows[0].branch_id
    for (const team of branch.teams) {
      await pool.query(
        `INSERT INTO teams (branch_id, name) VALUES ($1, $2) ON CONFLICT (branch_id, name) DO NOTHING`,
        [branchId, team]
      )
    }
    console.log(`  ✅ ${branch.name} (${branch.teams.length} teams)`)
  }

  console.log('\n✅ branches & teams migration complete!')
  process.exit(0)
}

run().catch(err => { console.error('❌ Migration failed:', err); process.exit(1) })