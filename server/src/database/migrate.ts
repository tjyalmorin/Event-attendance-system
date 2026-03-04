import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

const migrate = async (): Promise<void> => {
  try {
    const dbName = process.env.DB_NAME || 'primelog_local';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     PrimeLog — Database Migration            ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log(`  📦 Database : ${dbName}`);
    console.log(`  🌐 Host     : ${dbHost}:${dbPort}`);
    console.log('');
    console.log('🚀 Running database migration...');
    console.log('');
    // Enable UUID support
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // ── users ──────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_code      VARCHAR(50)     UNIQUE,
        full_name       VARCHAR(255)    NOT NULL,
        email           VARCHAR(255)    NOT NULL UNIQUE,
        password_hash   VARCHAR(255)    NOT NULL,
        branch_name     VARCHAR(255),
        team_name       VARCHAR(255),
        role            VARCHAR(50)     NOT NULL,
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        deleted_at      TIMESTAMPTZ
      );
    `);

    // ── events ─────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        event_id            SERIAL          PRIMARY KEY,
        created_by          UUID            NOT NULL REFERENCES users(user_id),
        title               VARCHAR(255)    NOT NULL,
        description         TEXT,
        event_date          DATE            NOT NULL,
        start_time          TIME            NOT NULL,
        end_time            TIME            NOT NULL,
        registration_start  TIMESTAMPTZ,
        registration_end    TIMESTAMPTZ,
        venue               VARCHAR(255),
        capacity            INT,
        checkin_cutoff      TIME,
        registration_link   VARCHAR(500)    UNIQUE,
        status              VARCHAR(50)     NOT NULL DEFAULT 'draft',
        version             INT             NOT NULL DEFAULT 1,
        created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        deleted_at          TIMESTAMPTZ
      );
    `);

    // ── event_permissions ──────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_permissions (
        permission_id   SERIAL          PRIMARY KEY,
        user_id         UUID            NOT NULL REFERENCES users(user_id),
        event_id        INT             NOT NULL REFERENCES events(event_id),
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, event_id)
      );
    `);

    // ── admin_grants ───────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_grants (
        grant_id              SERIAL          PRIMARY KEY,
        granted_to_user_id    UUID            NOT NULL REFERENCES users(user_id),
        granted_by_user_id    UUID            NOT NULL REFERENCES users(user_id),
        event_id              INT             NOT NULL REFERENCES events(event_id),
        is_edit_allowed       BOOLEAN         NOT NULL DEFAULT FALSE,
        expires_at            TIMESTAMPTZ     NOT NULL,
        created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        revoked_at            TIMESTAMPTZ,
        UNIQUE (granted_to_user_id, event_id)
      );
    `);

    // ── participants ───────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        participant_id      SERIAL          PRIMARY KEY,
        event_id            INT             NOT NULL REFERENCES events(event_id),
        agent_code          VARCHAR(50),
        full_name           VARCHAR(255)    NOT NULL,
        branch_name         VARCHAR(255),
        team_name           VARCHAR(255),
        qr_token            VARCHAR(500)    UNIQUE,
        qr_generated_at     TIMESTAMPTZ,
        qr_expires_at       TIMESTAMPTZ,
        registration_status VARCHAR(50)     NOT NULL DEFAULT 'pending',
        registered_at       TIMESTAMPTZ,
        updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        deleted_at          TIMESTAMPTZ,
        photo_url           VARCHAR(500),
        label               VARCHAR(100),
        label_description   TEXT
      );
    `);

    // ── attendance_sessions ────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        session_id              SERIAL          PRIMARY KEY,
        participant_id          INT             NOT NULL REFERENCES participants(participant_id),
        event_id                INT             NOT NULL REFERENCES events(event_id),
        check_in_time           TIMESTAMPTZ,
        check_out_time          TIMESTAMPTZ,
        check_in_method         VARCHAR(50),
        check_out_method        VARCHAR(50),
        early_out_reason        TEXT,
        early_out_recorded_by   UUID            REFERENCES users(user_id),
        created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // ── override_logs ──────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS override_logs (
        override_id             SERIAL          PRIMARY KEY,
        attendance_session_id   INT             REFERENCES attendance_sessions(session_id),
        participant_id          INT             REFERENCES participants(participant_id),
        event_id                INT             REFERENCES events(event_id),
        admin_id                UUID            REFERENCES users(user_id),
        override_type           VARCHAR         NOT NULL,
        reason                  TEXT            NOT NULL,
        original_time           TIMESTAMPTZ,
        adjusted_time           TIMESTAMPTZ,
        early_out_cutoff        TIMESTAMPTZ,
        created_at              TIMESTAMPTZ     DEFAULT NOW()
      );
    `);

    // ── scan_logs ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_logs (
        scan_id         SERIAL          PRIMARY KEY,
        participant_id  INT             REFERENCES participants(participant_id),
        event_id        INT             NOT NULL REFERENCES events(event_id),
        scanned_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        qr_token        VARCHAR(500)    NOT NULL,
        scan_type       VARCHAR(50)     NOT NULL,
        denial_reason   TEXT,
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // ── Safe column additions for existing tables ──────────
    await pool.query(`
      ALTER TABLE participants
        ADD COLUMN IF NOT EXISTS photo_url          VARCHAR(500);
    `);

    // Drop OLD column names if they still exist (renamed to label / label_description)
    await pool.query(`
      ALTER TABLE participants
        DROP COLUMN IF EXISTS is_awardee,
        DROP COLUMN IF EXISTS awardee_description;
    `);

    // Add new column names if not yet present
    await pool.query(`
      ALTER TABLE participants
        ADD COLUMN IF NOT EXISTS label              VARCHAR(100),
        ADD COLUMN IF NOT EXISTS label_description  TEXT;
    `);

    // ── OTP columns for forgot password (admin only) ───────
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS otp_code     VARCHAR(6),
        ADD COLUMN IF NOT EXISTS otp_expires  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;
    `);

    // ── Indexes ────────────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_agent_code              ON users(agent_code);
      CREATE INDEX IF NOT EXISTS idx_users_deleted_at              ON users(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_events_created_by             ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_events_event_date             ON events(event_date);
      CREATE INDEX IF NOT EXISTS idx_events_status                 ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_deleted_at             ON events(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_event_permissions_user_id     ON event_permissions(user_id);
      CREATE INDEX IF NOT EXISTS idx_event_permissions_event_id    ON event_permissions(event_id);
      CREATE INDEX IF NOT EXISTS idx_admin_grants_granted_to       ON admin_grants(granted_to_user_id);
      CREATE INDEX IF NOT EXISTS idx_admin_grants_event_id         ON admin_grants(event_id);
      CREATE INDEX IF NOT EXISTS idx_admin_grants_expires_at       ON admin_grants(expires_at);
      CREATE INDEX IF NOT EXISTS idx_participants_event_id         ON participants(event_id);
      CREATE INDEX IF NOT EXISTS idx_participants_agent_code       ON participants(agent_code);
      CREATE INDEX IF NOT EXISTS idx_participants_reg_status       ON participants(registration_status);
      CREATE INDEX IF NOT EXISTS idx_participants_deleted_at       ON participants(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_attendance_participant_id     ON attendance_sessions(participant_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_event_id           ON attendance_sessions(event_id);
      CREATE INDEX IF NOT EXISTS idx_override_logs_event_id        ON override_logs(event_id);
      CREATE INDEX IF NOT EXISTS idx_override_logs_participant_id  ON override_logs(participant_id);
      CREATE INDEX IF NOT EXISTS idx_scan_logs_participant_id      ON scan_logs(participant_id);
      CREATE INDEX IF NOT EXISTS idx_scan_logs_event_id            ON scan_logs(event_id);
      CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at          ON scan_logs(scanned_at);
    `);

    // ── Auto-update updated_at trigger ─────────────────────
    await pool.query(`
      CREATE OR REPLACE FUNCTION trigger_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const triggerTables = ['users', 'events', 'participants', 'attendance_sessions'];
    for (const table of triggerTables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS set_updated_at_${table} ON ${table};
        CREATE TRIGGER set_updated_at_${table}
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
      `);
    }

    // ── Seed SuperAdmin ────────────────────────────────────
    const bcrypt = await import('bcryptjs')
    const existingSuperAdmin = await pool.query(
      `SELECT user_id FROM users WHERE email = 'kurtrusselgliponeo@gmail.com'`
    )
    if (existingSuperAdmin.rows.length === 0) {
      const hash = await bcrypt.default.hash('Admin@1234', 10)
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, branch_name)
         VALUES ($1, $2, $3, 'admin', 'A1 Prime')`,
        ['Kurt Russel Gliponeo', 'kurtrusselgliponeo@gmail.com', hash]
      )
      console.log('✅ SuperAdmin seeded!')
      console.log('   Email   : kurtrusselgliponeo@gmail.com')
      console.log('   Password: Admin@1234')
    } else {
      console.log('ℹ️  SuperAdmin already exists, skipping.')
    }

    console.log('');
    console.log('✅ Migration complete!');
    console.log('');
    console.log('  📋 Tables created/verified:');
    console.log('     • users');
    console.log('     • events');
    console.log('     • event_permissions');
    console.log('     • admin_grants');
    console.log('     • participants');
    console.log('     • attendance_sessions');
    console.log('     • override_logs');
    console.log('     • scan_logs');
    console.log('');
    console.log('  🔧 Also applied: indexes, triggers, column additions');
    console.log('');
    console.log('  💡 Next: npm run db:seed   (optional — creates test accounts)');
    console.log('          npm run dev         (start the server)');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('');
    console.error('  Common fixes:');
    console.error('  1. Make sure PostgreSQL is running');
    console.error('  2. Check your .env file (copy from .env.example)');
    console.error('  3. Create the database: CREATE DATABASE primelog_local;');
    console.error('');
    console.error('  Error details:', error);
    process.exit(1);
  }
};

migrate();