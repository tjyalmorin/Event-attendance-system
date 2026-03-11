import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const seed = async (): Promise<void> => {
  try {
    console.log('🌱 Running seed...');

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const staffPasswordHash = await bcrypt.hash('staff123', 10);

    // ── Admin Account ──────────────────────────────────────
    const userResult = await pool.query(`
      INSERT INTO users (
        agent_code, full_name, email, password_hash,
        branch_name, team_name, role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING user_id;
    `, [
      'ADMIN-001',
      'Super Admin',
      'admin@pluk.com',
      adminPasswordHash,
      'Head Office',
      'Admin Team',
      'admin'
    ]);

    const adminId = userResult.rows[0].user_id;

    // ── Staff Account ──────────────────────────────────────
    const staffResult = await pool.query(`
      INSERT INTO users (
        agent_code, full_name, email, password_hash,
        branch_name, team_name, role
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING user_id;
    `, [
      'STAFF-001',
      'Sample Staff',
      'staff@pluk.com',
      staffPasswordHash,
      'Head Office',
      'Staff Team',
      'staff'
    ]);

    const staffId = staffResult.rows[0].user_id;

    // ── Sample Event ───────────────────────────────────────
    await pool.query(`
      INSERT INTO events (
        created_by, title, description, event_date,
        start_time, end_time, registration_start, registration_end,
        venue, capacity, checkin_cutoff, registration_link, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (registration_link) DO NOTHING;
    `, [
      adminId,
      'Sample Kickoff Event 2025',
      'This is a sample event created for testing purposes.',
      '2025-06-15',
      '08:00:00',
      '17:00:00',
      '2025-06-01 00:00:00+00',
      '2025-06-14 23:59:59+00',
      'Main Hall, Head Office',
      200,
      '08:30:00',
      'sample-kickoff-event-2025',
      'published'
    ]);

    console.log('✅ Seed complete!');
    console.log('');
    console.log('👤 Admin Account:');
    console.log('   📧 Email    : admin@pluk.com');
    console.log('   🔑 Password : admin123');
    console.log('');
    console.log('👤 Staff Account:');
    console.log('   📧 Email    : staff@pluk.com');
    console.log('   🔑 Password : staff123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();