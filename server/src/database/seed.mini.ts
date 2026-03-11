import dotenv from 'dotenv'
dotenv.config()

import pool from '../config/database.js'

const seed = async (): Promise<void> => {
  console.log('')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     PRU Life UK — Mini Seed (5 participants) ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')

  try {
    // ── 1. Get admin ───────────────────────────────────────
    const adminRes = await pool.query(
      `SELECT user_id FROM users WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1`
    )
    if (adminRes.rows.length === 0) throw new Error('No admin found. Run migration first.')
    const adminId = adminRes.rows[0].user_id
    console.log(`  ✅ Admin found: ${adminId}`)

    // ── 2. Create event ────────────────────────────────────
    console.log('\n  📅 Creating event...')

    const today = new Date()
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
    const eventDate = new Date(today)
    eventDate.setDate(today.getDate() + daysUntilSaturday)
    const eventDateStr = eventDate.toISOString().split('T')[0]

    const regStart = new Date(today)
    regStart.setDate(today.getDate() - 7)
    const regEnd = new Date(eventDate)
    regEnd.setDate(eventDate.getDate() - 1)

    const existing = await pool.query(
      `SELECT event_id FROM events WHERE title = $1 AND deleted_at IS NULL LIMIT 1`,
      ['PRU Life UK Mini Event 2025']
    )

    let eventId: number
    if (existing.rows.length > 0) {
      eventId = existing.rows[0].event_id
      console.log(`     → Event already exists (ID: ${eventId}), skipping.`)
    } else {
      const eventRes = await pool.query(`
        INSERT INTO events (
          created_by, title, description, event_date,
          start_time, end_time,
          registration_start, registration_end,
          venue, capacity, status, branch_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING event_id
      `, [
        adminId,
        'PRU Life UK Mini Event 2025',
        'Mini test event for development purposes.',
        eventDateStr,
        '09:00',
        '17:00',
        regStart.toISOString(),
        regEnd.toISOString(),
        'PRU Life UK Office, BGC, Taguig',
        20,
        'open',
        'A1 Prime',
      ])
      eventId = eventRes.rows[0].event_id
      console.log(`     → Event created (ID: ${eventId}) — ${eventDateStr}`)
    }

    // ── 3. Seed event_branches ─────────────────────────────
    const BRANCHES = [
      { name: 'Alexandrite 3',    teams: ['Team Crisan', 'Team Jhainnie', 'Team Shai', 'Team Louis'] },
      { name: 'A3 Axinite',       teams: ['Team Tony'] },
      { name: 'A3 Goldstone',     teams: ['Team Claude', 'Team Jodel', 'Team Rechel', 'Team Roel', 'Team Sendi'] },
      { name: 'A3 Phoenix Stone', teams: ['Team Elvin', 'Team Feti', 'Team Jhen', 'Team Maan', 'Team Mark', 'Team Redge', 'Team Otchie'] },
      { name: 'Alexandrite 1',    teams: ['Team Alou', 'Team Dong', 'Team Henson', 'Team Isa', 'Team Nikki', 'Team Doris'] },
      { name: 'A1 Prime',         teams: ['Team Norj', 'Team Donel', 'Team Paulyn', 'Team Esmael'] },
    ]
    for (const branch of BRANCHES) {
      await pool.query(`
        INSERT INTO event_branches (event_id, branch_name, team_names)
        VALUES ($1, $2, $3)
        ON CONFLICT (event_id, branch_name) DO UPDATE SET team_names = EXCLUDED.team_names
      `, [eventId, branch.name, branch.teams])
    }

    // ── 4. Assign staff matching participant branches only ──
    console.log('\n  🔑 Assigning staff to event...')
    const participantBranches = [
      'A1 Prime', 'Alexandrite 1', 'A3 Goldstone', 'A3 Phoenix Stone', 'Alexandrite 3'
    ]
    const staffUsers = await pool.query(
      `SELECT user_id FROM users
       WHERE role = 'staff'
         AND deleted_at IS NULL
         AND is_active = TRUE
         AND branch_name = ANY($1)`,
      [participantBranches]
    )
    for (const s of staffUsers.rows) {
      await pool.query(`
        INSERT INTO event_permissions (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
      `, [s.user_id, eventId])
    }
    console.log(`     → ${staffUsers.rows.length} staff assigned`)

    // ── 4. Seed 5 participants ─────────────────────────────
    console.log('\n  👥 Seeding 5 participants...')

    const existingCount = await pool.query(
      `SELECT COUNT(*) FROM participants WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    )
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`     → Participants already exist, skipping.`)
    } else {
      const participants = [
        { agent_code: '31457820', full_name: 'Juan dela Cruz',     branch_name: 'A1 Prime',         team_name: 'Team Norj' },
        { agent_code: '58273641', full_name: 'Maria Santos',       branch_name: 'Alexandrite 1',    team_name: 'Team Alou' },
        { agent_code: '74920183', full_name: 'Carlo Reyes',        branch_name: 'A3 Goldstone',     team_name: 'Team Claude' },
        { agent_code: '62819475', full_name: 'Jasmine Villanueva', branch_name: 'A3 Phoenix Stone', team_name: 'Team Elvin' },
        { agent_code: '95031748', full_name: 'Ronald Bautista',    branch_name: 'Alexandrite 3',    team_name: 'Team Crisan' },
      ]

      for (const p of participants) {
        await pool.query(`
          INSERT INTO participants (
            event_id, agent_code, full_name, branch_name, team_name,
            registration_status, registered_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'confirmed', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [eventId, p.agent_code, p.full_name, p.branch_name, p.team_name])
      }

      console.log(`     → 5 participants seeded`)
      console.log('')
      console.log('  👥 Participants:')
      for (const p of participants) {
        console.log(`     • ${p.agent_code}  ${p.full_name.padEnd(22)} ${p.branch_name}`)
      }
    }

    console.log('')
    console.log('  ✅ Mini seed complete!')
    console.log(`  📅 Event : PRU Life UK Mini Event 2025`)
    console.log(`  🗓️  Date  : ${eventDateStr}`)
    console.log('')

    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

seed()