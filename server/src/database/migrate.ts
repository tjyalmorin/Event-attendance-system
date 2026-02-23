import pool from '../config/database.js';

const migrate = async (): Promise<void> => {
  try {
    console.log('🚀 Running database migration...');

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
        deleted_at          TIMESTAMPTZ
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

    // ── scan_logs ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_logs (
        scan_id         SERIAL          PRIMARY KEY,
        participant_id  INT             NOT NULL REFERENCES participants(participant_id),
        event_id        INT             NOT NULL REFERENCES events(event_id),
        scanned_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        qr_token        VARCHAR(500)    NOT NULL,
        scan_type       VARCHAR(50)     NOT NULL,
        denial_reason   TEXT,
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
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
      CREATE INDEX IF NOT EXISTS idx_participants_event_id         ON participants(event_id);
      CREATE INDEX IF NOT EXISTS idx_participants_agent_code       ON participants(agent_code);
      CREATE INDEX IF NOT EXISTS idx_participants_reg_status       ON participants(registration_status);
      CREATE INDEX IF NOT EXISTS idx_participants_deleted_at       ON participants(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_attendance_participant_id     ON attendance_sessions(participant_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_event_id           ON attendance_sessions(event_id);
      CREATE INDEX IF NOT EXISTS idx_scan_logs_participant_id      ON scan_logs(participant_id);
      CREATE INDEX IF NOT EXISTS idx_scan_logs_event_id            ON scan_logs(event_id);
      CREATE INDEX IF NOT EXISTS idx_scan_logs_scanned_at          ON scan_logs(scanned_at);
    `);

    // ── Auto-update updated_at trigger ────────────────────
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

    console.log('✅ Migration complete! All tables and indexes created.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
