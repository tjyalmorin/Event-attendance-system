import dotenv from 'dotenv'
dotenv.config()

import pool from '../config/database.js'

const seed = async (): Promise<void> => {
  console.log('')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     A1 Prime — March 2026 Branch Meeting     ║')
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

    const existing = await pool.query(
      `SELECT event_id FROM events WHERE title = $1 AND deleted_at IS NULL LIMIT 1`,
      ['March 2026 Branch Meeting']
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
          venue, capacity, status, branch_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING event_id
      `, [
        adminId,
        'March 2026 Branch Meeting',
        'Monthly branch meeting for A1 Prime. All agents are required to attend.',
        '2026-03-07',
        '13:00',
        '17:00',
        'A1 Prime Branch Office',
        100,
        'open',
        'A1 Prime',
      ])
      eventId = eventRes.rows[0].event_id
      console.log(`     → Event created (ID: ${eventId}) — March 7, 2026 | 1:00 PM – 5:00 PM`)
    }

    // ── 3. Seed event_branches (A1 Prime only) ─────────────
    console.log('\n  🏢 Seeding event branch...')
    await pool.query(`
      INSERT INTO event_branches (event_id, branch_name, team_names)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, branch_name) DO UPDATE SET team_names = EXCLUDED.team_names
    `, [eventId, 'A1 Prime', ['Team Norj', 'Team Donel', 'Team Paulyn', 'Team ES']])
    console.log(`     → A1 Prime linked to event`)

    // ── 4. Assign A1 Prime staff only ─────────────────────
    console.log('\n  🔑 Assigning staff...')
    const staffUsers = await pool.query(
      `SELECT user_id FROM users
       WHERE role = 'staff'
         AND deleted_at IS NULL
         AND is_active = TRUE
         AND branch_name = 'A1 Prime'`
    )
    for (const s of staffUsers.rows) {
      await pool.query(`
        INSERT INTO event_permissions (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
      `, [s.user_id, eventId])
    }
    console.log(`     → ${staffUsers.rows.length} staff assigned`)

    // ── 5. Seed participants ───────────────────────────────
    console.log('\n  👥 Seeding participants...')

    const existingCount = await pool.query(
      `SELECT COUNT(*) FROM participants WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    )
    if (parseInt(existingCount.rows[0].count) > 0) {
      console.log(`     → Participants already exist, skipping.`)
    } else {
      const participants = [
        // ── TEAM NORJ ──
        { agent_code: '70102430', full_name: 'Cruz, Jezel Dyn Alacaba',                team_name: 'Team Norj' },
        { agent_code: '70115623', full_name: 'Seraspi, Jennine Kirsten Mostajo',        team_name: 'Team Norj' },
        { agent_code: '70117217', full_name: 'Tupas, Glyn Christian Carbon',            team_name: 'Team Norj' },
        { agent_code: '70166186', full_name: 'Audea, Neil Ian Cruz',                    team_name: 'Team Norj' },
        { agent_code: '70167200', full_name: 'Dipatuan, Abdul Muhammad Mammingen',      team_name: 'Team Norj' },
        { agent_code: '70171448', full_name: 'Tupas, Christopher Gwyn Carbon',          team_name: 'Team Norj' },
        { agent_code: '70102486', full_name: 'Ragot, John Paul Timonera',               team_name: 'Team Norj' },
        { agent_code: '70107410', full_name: 'Austria, Mary Grace Maalihan',            team_name: 'Team Norj' },
        { agent_code: '70117582', full_name: 'Torralba, Hannie Maalihan',               team_name: 'Team Norj' },
        { agent_code: '70119281', full_name: 'Flores, Gellie Mare Evangelista',         team_name: 'Team Norj' },
        { agent_code: '70131273', full_name: 'Ebreo, Julius Macatangay',                team_name: 'Team Norj' },
        { agent_code: '70131418', full_name: 'Visca, Mary Grace Sanchez',               team_name: 'Team Norj' },
        { agent_code: '70135090', full_name: 'Eria, Lilybeth Landoy',                   team_name: 'Team Norj' },
        { agent_code: '70162521', full_name: 'Leynes, Princess Diane Martin',           team_name: 'Team Norj' },
        { agent_code: '70177836', full_name: 'Cajurao, Bemalyn Balanquit',              team_name: 'Team Norj' },
        { agent_code: '70177850', full_name: 'Dean, Pinky Michelle Sumaoang',           team_name: 'Team Norj' },
        { agent_code: '70179596', full_name: 'Dorado, Daryl Louise Develos',            team_name: 'Team Norj' },
        { agent_code: '70180036', full_name: 'Sedigo, Joshua Rei Santamena',            team_name: 'Team Norj' },
        { agent_code: '70182298', full_name: 'Alcaraz, James Daryl Gabrieles',          team_name: 'Team Norj' },
        // ── TEAM DONEL ──
        { agent_code: '70137804', full_name: 'Pollisco III, Filiberto Tijana',          team_name: 'Team Donel' },
        { agent_code: '70142126', full_name: 'Devera, Maylyn Quillo',                   team_name: 'Team Donel' },
        { agent_code: '70177291', full_name: 'Geranco, Jennefer Genova',                team_name: 'Team Donel' },
        // ── TEAM PAULYN ──
        { agent_code: '70121404', full_name: 'Pamotillo, Marie Mar Salvan',             team_name: 'Team Paulyn' },
        { agent_code: '70126886', full_name: 'De Castro, Jeiya Nicole Barranco',        team_name: 'Team Paulyn' },
        { agent_code: '70128312', full_name: 'Porras, Maria Joecel Magbanua',           team_name: 'Team Paulyn' },
        { agent_code: '70135940', full_name: 'Escanillas, Julie Ann Benjamin',          team_name: 'Team Paulyn' },
        { agent_code: '70137513', full_name: 'Catedrilla, Engel Grace Lasanas',         team_name: 'Team Paulyn' },
        { agent_code: '70151966', full_name: 'Haro, Joycee Lou Marae Pontaoy',          team_name: 'Team Paulyn' },
        { agent_code: '70163513', full_name: 'Syching, Aljanette Helen Cerezo',         team_name: 'Team Paulyn' },
        { agent_code: '70163647', full_name: 'Amador, Lovelyn Bicodo',                  team_name: 'Team Paulyn' },
        { agent_code: '70168910', full_name: 'Tan, Domilou Marie Horneja',              team_name: 'Team Paulyn' },
        { agent_code: '70177357', full_name: 'Balderas, Leizeljoy Basultin',            team_name: 'Team Paulyn' },
        { agent_code: '70177705', full_name: 'Reyes, Glady\'s Gemarino',               team_name: 'Team Paulyn' },
        { agent_code: '70181979', full_name: 'Porras, Stacy Pauline Haro',              team_name: 'Team Paulyn' },
        { agent_code: '70182173', full_name: 'Arbis, Angeline Defensor',                team_name: 'Team Paulyn' },
        // ── TEAM ES ──
        { agent_code: '70127173', full_name: 'Estabillo, Marri Diane Magat',            team_name: 'Team Esmael' },
        { agent_code: '70140826', full_name: 'Artes, Marjorie Ann Merlin',              team_name: 'Team Esmael' },
        { agent_code: '70141388', full_name: 'Lagman, Marilou Santos',                  team_name: 'Team Esmael' },
        { agent_code: '70147437', full_name: 'Sumalinog, Jinky Tancinco',               team_name: 'Team Esmael' },
        { agent_code: '70149190', full_name: 'Mujal, Leonie Contante',                  team_name: 'Team Esmael' },
        { agent_code: '70156820', full_name: 'De Castro, Justin Zach Del Rosario',      team_name: 'Team Esmael' },
        { agent_code: '70157089', full_name: 'Salomon, Jamis Bagumbaran',               team_name: 'Team Esmael' },
        { agent_code: '70160953', full_name: 'Estabillo, Marie Dana Magat',             team_name: 'Team Esmael' },
        { agent_code: '70165079', full_name: 'Ocampo, Christian Chaim De Leon',         team_name: 'Team Esmael' },
        { agent_code: '70165631', full_name: 'Mingi, Dhan Raymund Marciano',            team_name: 'Team Esmael' },
        { agent_code: '70166034', full_name: 'Cuya, Virgilio Diaz',                     team_name: 'Team Esmael' },
        { agent_code: '70166527', full_name: 'Campos, John Leo Bulactin',               team_name: 'Team Esmael' },
        { agent_code: '70169486', full_name: 'Banania, Rosa Barredo',                   team_name: 'Team Esmael' },
        { agent_code: '70172289', full_name: 'Magcawas, Leslie Ann Delos Angeles',      team_name: 'Team Esmael' },
        { agent_code: '70176995', full_name: 'Yap, Jovy Mataya',                        team_name: 'Team Esmael' },
        { agent_code: '70177117', full_name: 'Sansano, Stephanie',                      team_name: 'Team Esmael' },
        { agent_code: '70179978', full_name: 'Buedo, Zedrick Barredo',                  team_name: 'Team Esmael' },
        { agent_code: '70180257', full_name: 'Camilon, Chester Rhyan Del Rosario',      team_name: 'Team Esmael' },
        { agent_code: '70184378', full_name: 'Bellen, Aileen Balbalosa',                team_name: 'Team Esmael' },
        { agent_code: '70185638', full_name: 'Quijano, Laarni Dacir',                   team_name: 'Team Esmael' },
      ]

      let inserted = 0
      for (const p of participants) {
        await pool.query(`
          INSERT INTO participants (
            event_id, agent_code, full_name, branch_name, team_name,
            registration_status, registered_at, updated_at
          ) VALUES ($1, $2, $3, 'A1 Prime', $4, 'confirmed', NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, [eventId, p.agent_code, p.full_name, p.team_name])
        inserted++
      }
      console.log(`     → ${inserted} participants seeded`)
    }

    // ── Summary ────────────────────────────────────────────
    const total = await pool.query(
      `SELECT COUNT(*) FROM participants WHERE event_id = $1 AND deleted_at IS NULL`,
      [eventId]
    )

    console.log('')
    console.log('╔══════════════════════════════════════════════╗')
    console.log('║     Seed Complete! 🎉                        ║')
    console.log('╚══════════════════════════════════════════════╝')
    console.log('')
    console.log('  📅 Event  : March 2026 Branch Meeting')
    console.log('  🗓️  Date   : March 7, 2026 (Saturday)')
    console.log('  🕐 Time   : 1:00 PM – 5:00 PM')
    console.log('  🏢 Branch : A1 Prime')
    console.log(`  👥 Total  : ${total.rows[0].count} participants`)
    console.log('     • Team Norj   — 19')
    console.log('     • Team Donel  — 3')
    console.log('     • Team Paulyn — 14')
    console.log('     • Team Esmael — 20')
    console.log('')

    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

seed()