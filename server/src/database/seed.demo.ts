import dotenv from 'dotenv'
dotenv.config()

import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

// ── Helpers ────────────────────────────────────────────────────────────────
const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

const FIRST_NAMES = [
  'Maria', 'Jose', 'Juan', 'Ana', 'Mark', 'Christine', 'Michael', 'Sarah',
  'Patrick', 'Jasmine', 'Carlo', 'Lovely', 'Ralph', 'Kristine', 'Dennis',
  'Maricel', 'Ryan', 'Cecille', 'Ronald', 'Joanne', 'Kevin', 'Maribel',
  'Jerome', 'Lourdes', 'Edgar', 'Rowena', 'Alvin', 'Sheila', 'Rodel',
  'Rachelle', 'Gilbert', 'Irene', 'Arnold', 'Melanie', 'Arnel', 'Carmela',
  'Renato', 'Florencia', 'Eduardo', 'Estrella', 'Ferdinand', 'Virgie',
  'Rommel', 'Nilda', 'Emmanuel', 'Teresita', 'Danilo', 'Corazon', 'Efren',
  'Rosario', 'Nestor', 'Ligaya', 'Domingo', 'Imelda', 'Godofredo', 'Aurora',
  'Benigno', 'Clarita', 'Diosdado', 'Erlinda', 'Felicidad', 'Gerardo',
  'Herminia', 'Isabelo', 'Josefina', 'Kapitan', 'Leonora', 'Macario',
  'Narcisa', 'Onofre', 'Pacita', 'Quirino', 'Remedios', 'Silverio',
  'Tranquilino', 'Urduja', 'Venancio', 'Wenceslao', 'Ximena', 'Yolanda',
]

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores',
  'Villanueva', 'Gonzales', 'Bautista', 'Ramos', 'Aquino', 'Diaz', 'Rivera',
  'Castillo', 'Dela Cruz', 'Fernandez', 'Lopez', 'Perez', 'Ramirez',
  'Soriano', 'Pascual', 'Aguilar', 'Navarro', 'Morales', 'Jimenez',
  'Guevarra', 'Macaraeg', 'Abad', 'Buenaventura', 'Ilustrisimo', 'Panganiban',
  'Silvestre', 'Macapagal', 'Tolentino', 'Dimaculangan', 'Sarmiento',
  'Villafuerte', 'Lacsamana', 'Magbanua', 'Ocampo', 'Delos Reyes', 'Manalo',
  'Chua', 'Tan', 'Lim', 'Go', 'Sy', 'Ong', 'Co', 'Velasco', 'Esguerra',
  'Tiongson', 'Evangelista', 'Mercado', 'Sabino', 'Quiambao', 'Bernardo',
  'Alvarado', 'Concepcion', 'Enriquez', 'Figueroa', 'Hidalgo', 'Ignacio',
]

// Generate unique full names — no duplicates
const generateUniqueNames = (count: number): string[] => {
  const used = new Set<string>()
  const names: string[] = []
  let attempts = 0
  while (names.length < count && attempts < count * 10) {
    attempts++
    const name = `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`
    if (!used.has(name)) {
      used.add(name)
      names.push(name)
    }
  }
  // fallback: append index if pool exhausted
  while (names.length < count) {
    names.push(`Agent ${names.length + 1} Dela Cruz`)
  }
  return names
}

// Generate unique randomized 8-digit numeric agent codes
const generateUniqueAgentCodes = (count: number): string[] => {
  const used = new Set<string>()
  const codes: string[] = []
  while (codes.length < count) {
    // Random 8-digit number: 10000000–99999999
    const code = String(Math.floor(10000000 + Math.random() * 90000000))
    if (!used.has(code)) {
      used.add(code)
      codes.push(code)
    }
  }
  return codes
}

// ── Branch + Team data (mirrors migration) ─────────────────────────────────
const BRANCHES: { name: string; teams: string[] }[] = [
  { name: 'Alexandrite 3',    teams: ['Team Crisan', 'Team Jhainnie', 'Team Shai', 'Team Louis'] },
  { name: 'A3 Axinite',       teams: ['Team Tony'] },
  { name: 'A3 Goldstone',     teams: ['Team Claude', 'Team Jodel', 'Team Rechel', 'Team Roel', 'Team Sendi'] },
  { name: 'A3 Phoenix Stone', teams: ['Team Elvin', 'Team Feti', 'Team Jhen', 'Team Maan', 'Team Mark', 'Team Redge', 'Team Otchie'] },
  { name: 'Alexandrite 1',    teams: ['Team Alou', 'Team Dong', 'Team Henson', 'Team Isa', 'Team Nikki', 'Team Doris'] },
  { name: 'A1 Prime',         teams: ['Team Norj', 'Team Donel', 'Team Paulyn', 'Team Esmael'] },
]

// ── Label config ───────────────────────────────────────────────────────────
const LABELS: { label: string; description: string | null }[] = [
  { label: 'Awardee',  description: 'Top performer — seated at the front row, Row 1.' },
  { label: 'VIP',      description: 'Special guest — please escort to the VIP lounge.' },
  { label: 'Speaker',  description: 'Keynote presenter — direct to the speaker prep room.' },
  { label: 'Sponsor',  description: 'Company sponsor — reserved table near the stage.' },
  { label: 'Staff',    description: 'Event staff — proceed to registration desk.' },
]

const seed = async (): Promise<void> => {
  console.log('')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     PRU Life UK — Demo Seed                     ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')

  try {
    // ── 1. Get admin user ──────────────────────────────────
    const adminRes = await pool.query(
      `SELECT user_id FROM users WHERE role = 'admin' AND deleted_at IS NULL LIMIT 1`
    )
    if (adminRes.rows.length === 0) {
      throw new Error('No admin user found. Run migration first: npm run db:migrate')
    }
    const adminId = adminRes.rows[0].user_id
    console.log(`  ✅ Admin found: ${adminId}`)

    // ── 2. Seed demo staff accounts ───────────────────────
    console.log('\n  👤 Seeding demo staff accounts...')
    const staffAccounts = [
      { full_name: 'Maria Santos',    email: 'maria.santos@primelog.ph',   agent_code: 'STF001', branch_name: 'Alexandrite 1',    team_name: 'Team Alou' },
      { full_name: 'Jose Reyes',      email: 'jose.reyes@primelog.ph',     agent_code: 'STF002', branch_name: 'A3 Goldstone',     team_name: 'Team Claude' },
      { full_name: 'Ana Cruz',        email: 'ana.cruz@primelog.ph',       agent_code: 'STF003', branch_name: 'A3 Phoenix Stone', team_name: 'Team Elvin' },
      { full_name: 'Mark Garcia',     email: 'mark.garcia@primelog.ph',    agent_code: 'STF004', branch_name: 'Alexandrite 3',    team_name: 'Team Crisan' },
      { full_name: 'Christine Torres',email: 'christine.torres@primelog.ph',agent_code: 'STF005', branch_name: 'A1 Prime',        team_name: 'Team Norj' },
    ]
    const password = await bcrypt.hash('Staff@1234', 10)
    for (const s of staffAccounts) {
      await pool.query(`
        INSERT INTO users (agent_code, full_name, email, password_hash, branch_name, team_name, role)
        VALUES ($1, $2, $3, $4, $5, $6, 'staff')
        ON CONFLICT (email) DO NOTHING
      `, [s.agent_code, s.full_name, s.email, password, s.branch_name, s.team_name])
    }
    console.log(`     → ${staffAccounts.length} staff accounts seeded (password: Staff@1234)`)

    // ── 3. Create the demo event ───────────────────────────
    console.log('\n  📅 Creating demo event...')

    // Set event date to next Saturday
    const today = new Date()
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7
    const eventDate = new Date(today)
    eventDate.setDate(today.getDate() + daysUntilSaturday)
    const eventDateStr = eventDate.toISOString().split('T')[0]

    // Registration window: opened 14 days ago, closes 1 day before event
    const regStart = new Date(today)
    regStart.setDate(today.getDate() - 14)
    const regEnd = new Date(eventDate)
    regEnd.setDate(eventDate.getDate() - 1)

    // Check if event already exists
    const existingEvent = await pool.query(
      `SELECT event_id FROM events WHERE title = $1 AND deleted_at IS NULL LIMIT 1`,
      ['PRU Life UK Annual Recognition Night 2025']
    )

    let eventId: number
    if (existingEvent.rows.length > 0) {
      eventId = existingEvent.rows[0].event_id
      console.log(`     → Event already exists (ID: ${eventId}), skipping creation.`)
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
        'PRU Life UK Annual Recognition Night 2025',
        'Our biggest night of the year! Celebrating top performers, sponsors, and the teams that made it all happen. Formal attire required. Dinner and program start at 6:00 PM sharp.',
        eventDateStr,
        '18:00',
        '22:00',
        regStart.toISOString(),
        regEnd.toISOString(),
        'Grand Ballroom, The Manila Hotel, Rizal Park, Manila',
        300,
        'open',
        'A1 Prime',
      ])
      eventId = eventRes.rows[0].event_id
      console.log(`     → Event created (ID: ${eventId}) — ${eventDateStr}`)
    }

    // ── 4. Seed event_branches (all branches + their teams) ─
    console.log('\n  🏢 Seeding event branches...')
    for (const branch of BRANCHES) {
      await pool.query(`
        INSERT INTO event_branches (event_id, branch_name, team_names)
        VALUES ($1, $2, $3)
        ON CONFLICT (event_id, branch_name) DO UPDATE SET team_names = EXCLUDED.team_names
      `, [eventId, branch.name, branch.teams])
    }
    console.log(`     → ${BRANCHES.length} branches linked to event`)

    // ── 5. Assign staff to event ───────────────────────────
    console.log('\n  🔑 Assigning staff to event...')
    const staffUsers = await pool.query(
      `SELECT user_id FROM users WHERE role = 'staff' AND deleted_at IS NULL AND is_active = TRUE`
    )
    for (const s of staffUsers.rows) {
      await pool.query(`
        INSERT INTO event_permissions (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
      `, [s.user_id, eventId])
    }
    console.log(`     → ${staffUsers.rows.length} staff assigned`)

    // ── 6. Seed participants ───────────────────────────────
    console.log('\n  👥 Seeding participants...')

    // Check how many already exist
    const existingCount = await pool.query(
      `SELECT COUNT(*) FROM participants WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    )
    const alreadyExists = parseInt(existingCount.rows[0].count)
    if (alreadyExists > 0) {
      console.log(`     → ${alreadyExists} participants already exist, skipping.`)
    } else {
      // Build participant list: ~8–12 per team spread across all branches
      const participantRows: {
        agent_code: string
        full_name: string
        branch_name: string
        team_name: string
        label: string | null
        label_description: string | null
      }[] = []

      // First pass: collect all slots so we know total count
      const slots: { branch_name: string; team_name: string; label: string | null; label_description: string | null }[] = []

      const labelAssignments = [
        { branch: 'Alexandrite 1',    team: 'Team Alou',    ...LABELS[0] },
        { branch: 'A3 Phoenix Stone', team: 'Team Elvin',   ...LABELS[1] },
        { branch: 'A3 Goldstone',     team: 'Team Claude',  ...LABELS[2] },
        { branch: 'Alexandrite 3',    team: 'Team Crisan',  ...LABELS[3] },
        { branch: 'A1 Prime',         team: 'Team Norj',    ...LABELS[4] },
        { branch: 'Alexandrite 1',    team: 'Team Dong',    ...LABELS[0] },
        { branch: 'A3 Phoenix Stone', team: 'Team Feti',    ...LABELS[1] },
        { branch: 'A3 Goldstone',     team: 'Team Jodel',   ...LABELS[0] },
        { branch: 'Alexandrite 3',    team: 'Team Shai',    ...LABELS[2] },
        { branch: 'A1 Prime',         team: 'Team Donel',   ...LABELS[3] },
      ]

      for (const la of labelAssignments) {
        slots.push({ branch_name: la.branch, team_name: la.team, label: la.label, label_description: la.description })
      }

      for (const branch of BRANCHES) {
        for (const team of branch.teams) {
          const count = 8 + Math.floor(Math.random() * 5)
          for (let i = 0; i < count; i++) {
            slots.push({ branch_name: branch.name, team_name: team, label: null, label_description: null })
          }
        }
      }

      // Generate unique names and agent codes for all slots at once
      const uniqueNames = generateUniqueNames(slots.length)
      const uniqueCodes = generateUniqueAgentCodes(slots.length)

      for (let i = 0; i < slots.length; i++) {
        participantRows.push({
          agent_code: uniqueCodes[i],
          full_name: uniqueNames[i],
          ...slots[i],
        })
      }

      // Insert all
      let inserted = 0
      for (const p of participantRows) {
        await pool.query(`
          INSERT INTO participants (
            event_id, agent_code, full_name, branch_name, team_name,
            registration_status, registered_at, updated_at,
            label, label_description
          ) VALUES ($1, $2, $3, $4, $5, 'confirmed', NOW() - (random() * interval '10 days'), NOW(), $6, $7)
          ON CONFLICT DO NOTHING
        `, [eventId, p.agent_code, p.full_name, p.branch_name, p.team_name, p.label, p.label_description])
        inserted++
      }

      console.log(`     → ${inserted} participants seeded (${labelAssignments.length} with labels)`)
    }

    // ── Summary ────────────────────────────────────────────
    const finalCount = await pool.query(
      `SELECT COUNT(*) FROM participants WHERE event_id = $1 AND deleted_at IS NULL AND registration_status = 'confirmed'`,
      [eventId]
    )
    const labelCount = await pool.query(
      `SELECT COUNT(*) FROM participants WHERE event_id = $1 AND label IS NOT NULL AND deleted_at IS NULL`,
      [eventId]
    )

    console.log('')
    console.log('╔══════════════════════════════════════════════╗')
    console.log('║     Seed Complete! 🎉                        ║')
    console.log('╚══════════════════════════════════════════════╝')
    console.log('')
    console.log('  📅 Event  : PRU Life UK Annual Recognition Night 2025')
    console.log(`  🗓️  Date   : ${eventDateStr} (next Saturday)`)
    console.log('  🕕 Time   : 6:00 PM – 10:00 PM')
    console.log('  📍 Venue  : Grand Ballroom, The Manila Hotel')
    console.log(`  👥 Total Participants : ${finalCount.rows[0].count}`)
    console.log(`  🏷️  Labeled Participants : ${labelCount.rows[0].count}`)
    console.log('')
    console.log('  🔐 Staff Accounts (password: Staff@1234):')
    for (const s of staffAccounts) {
      console.log(`     • ${s.email.padEnd(38)} → ${s.branch_name}`)
    }
    console.log('')
    console.log('  🏷️  Label types seeded:')
    for (const l of LABELS) {
      console.log(`     • ${l.label.padEnd(10)} — ${l.description}`)
    }
    console.log('')
    console.log('  💡 Tip: Run seed again safely — all inserts are idempotent.')
    console.log('')

    process.exit(0)
  } catch (err) {
    console.error('')
    console.error('❌ Seed failed:', err)
    console.error('')
    process.exit(1)
  }
}

seed()