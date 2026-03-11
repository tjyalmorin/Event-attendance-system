import dotenv from 'dotenv'
dotenv.config()

import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

const seed = async (): Promise<void> => {
  console.log('')
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     PRU Life UK — Staff Accounts Seed        ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')

  try {
    const password = await bcrypt.hash('Staff@1234', 10)

    const staffAccounts = [
      { full_name: 'Crisan Dela Cruz',   email: 'crisan@gmail.com',   agent_code: '20000001', branch_name: 'Alexandrite 3',    team_name: 'Team Crisan' },
      { full_name: 'Tony Reyes',         email: 'tony@gmail.com',     agent_code: '20000002', branch_name: 'A3 Axinite',       team_name: 'Team Tony' },
      { full_name: 'Claude Santos',      email: 'claude@gmail.com',   agent_code: '20000003', branch_name: 'A3 Goldstone',     team_name: 'Team Claude' },
      { full_name: 'Elvin Garcia',       email: 'elvin@gmail.com',    agent_code: '20000004', branch_name: 'A3 Phoenix Stone', team_name: 'Team Elvin' },
      { full_name: 'Alou Mendoza',       email: 'alou@gmail.com',     agent_code: '20000005', branch_name: 'Alexandrite 1',    team_name: 'Team Alou' },
      { full_name: 'Norj Bautista',      email: 'norj@gmail.com',     agent_code: '20000006', branch_name: 'A1 Prime',         team_name: 'Team Norj' },
    ]

    console.log('  👤 Seeding staff accounts...\n')

    let seeded = 0
    let skipped = 0

    for (const s of staffAccounts) {
      const res = await pool.query(`
        INSERT INTO users (agent_code, full_name, email, password_hash, branch_name, team_name, role)
        VALUES ($1, $2, $3, $4, $5, $6, 'staff')
        ON CONFLICT DO NOTHING
        RETURNING user_id
      `, [s.agent_code, s.full_name, s.email, password, s.branch_name, s.team_name])

      if (res.rows.length > 0) {
        console.log(`  ✅ ${s.branch_name.padEnd(20)} → ${s.email}`)
        seeded++
      } else {
        console.log(`  ⚠️  ${s.branch_name.padEnd(20)} → already exists, skipped`)
        skipped++
      }
    }

    console.log('')
    console.log('╔══════════════════════════════════════════════╗')
    console.log('║     Seed Complete!                           ║')
    console.log('╚══════════════════════════════════════════════╝')
    console.log('')
    console.log(`  ✅ Seeded  : ${seeded} accounts`)
    console.log(`  ⚠️  Skipped : ${skipped} accounts (already exist)`)
    console.log('')
    console.log('  🔐 Login credentials:')
    console.log('     Password : Staff@1234  (all accounts)')
    console.log('')
    console.log('  📋 Accounts:')
    for (const s of staffAccounts) {
      console.log(`     • ${s.email.padEnd(40)} ${s.branch_name}`)
    }
    console.log('')

    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

seed()