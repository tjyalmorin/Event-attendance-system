import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

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

    // ── users ──────────────────────────────────────────────────────
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

    // ── agents ─────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        agent_code   VARCHAR(50)   PRIMARY KEY,
        photo_url    VARCHAR(500),
        created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // ── agent_types ────────────────────────────────────────────────
    // Dynamic agent types — replaces hardcoded enum in registration form
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_types (
        agent_type_id   SERIAL        PRIMARY KEY,
        name            VARCHAR(100)  NOT NULL UNIQUE,
        display_order   INT           NOT NULL DEFAULT 0,
        is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // ── events ─────────────────────────────────────────────────────
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
        branch_name         VARCHAR(255),
        version             INT             NOT NULL DEFAULT 1,
        created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        deleted_at          TIMESTAMPTZ
      );
    `);

    // ── allowed_agent_types (added later for per-event restriction)
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS allowed_agent_types JSONB DEFAULT '[]'::jsonb;
    `);

    // ── event_permissions ──────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_permissions (
        permission_id   SERIAL          PRIMARY KEY,
        user_id         UUID            NOT NULL REFERENCES users(user_id),
        event_id        INT             NOT NULL REFERENCES events(event_id),
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, event_id)
      );
    `);

    // ── admin_grants ───────────────────────────────────────────────
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

    // ── participants ───────────────────────────────────────────────
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

    // ── attendance_sessions ────────────────────────────────────────
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

    // ── override_logs ──────────────────────────────────────────────
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

    // ── scan_logs ──────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scan_logs (
        scan_id         SERIAL          PRIMARY KEY,
        participant_id  INT             REFERENCES participants(participant_id),
        event_id        INT             REFERENCES events(event_id),
        scan_type       VARCHAR(50),
        scanned_by      UUID            REFERENCES users(user_id),
        scanned_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        result          VARCHAR(50),
        notes           TEXT
      );
    `);

    // ── branches ───────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        branch_id   SERIAL        PRIMARY KEY,
        name        VARCHAR(255)  NOT NULL UNIQUE,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // ── teams ──────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        team_id     SERIAL        PRIMARY KEY,
        branch_id   INT           NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
        name        VARCHAR(255)  NOT NULL,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE(branch_id, name)
      );
    `);

    // ── event_branches ─────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_branches (
        id          SERIAL        PRIMARY KEY,
        event_id    INT           NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
        branch_name VARCHAR(255)  NOT NULL,
        team_names  TEXT[]        NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE(event_id, branch_name)
      );
    `);

    // ── account_audit_logs ─────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_audit_logs (
        log_id      SERIAL        PRIMARY KEY,
        actor_id    UUID          REFERENCES users(user_id),
        actor_name  VARCHAR(255),
        actor_role  VARCHAR(50),
        target_id   UUID          REFERENCES users(user_id),
        target_name VARCHAR(255),
        target_role VARCHAR(50),
        action      VARCHAR(100)  NOT NULL,
        details     TEXT,
        created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // ── event_custom_fields ────────────────────────────────────────
    // Defines custom questions per event
    // applicable_agent_types: empty array = show to all agent types
    // field_type: text | textarea | number | dropdown | radio | checkbox
    // options: JSON array of strings — used for dropdown and radio types
    // is_locked: becomes true once any participant has answered this field
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_custom_fields (
        field_id                SERIAL          PRIMARY KEY,
        event_id                INT             NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
        label                   VARCHAR(500)    NOT NULL,
        field_type              VARCHAR(50)     NOT NULL DEFAULT 'text',
        options                 JSONB,
        is_required             BOOLEAN         NOT NULL DEFAULT FALSE,
        display_order           INT             NOT NULL DEFAULT 0,
        applicable_agent_types  TEXT[]          NOT NULL DEFAULT '{}',
        is_locked               BOOLEAN         NOT NULL DEFAULT FALSE,
        created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // ── participant_field_answers ──────────────────────────────────
    // Stores each participant's answers to custom fields
    // answer: always stored as text — frontend/backend casts as needed
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participant_field_answers (
        answer_id       SERIAL          PRIMARY KEY,
        participant_id  INT             NOT NULL REFERENCES participants(participant_id) ON DELETE CASCADE,
        field_id        INT             NOT NULL REFERENCES event_custom_fields(field_id) ON DELETE CASCADE,
        answer          TEXT,
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
        UNIQUE (participant_id, field_id)
      );
    `);

    // ── bulk_import_logs ───────────────────────────────────────────
    // Tracks every bulk import attempt for audit purposes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_import_logs (
        import_id       SERIAL          PRIMARY KEY,
        event_id        INT             NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
        imported_by     UUID            NOT NULL REFERENCES users(user_id),
        file_name       VARCHAR(500),
        total_rows      INT             NOT NULL DEFAULT 0,
        success_count   INT             NOT NULL DEFAULT 0,
        error_count     INT             NOT NULL DEFAULT 0,
        errors          JSONB,
        status          VARCHAR(50)     NOT NULL DEFAULT 'pending',
        created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
      );
    `);

    // ── Safe column additions for existing tables ──────────────────
    await pool.query(`
      ALTER TABLE participants
        ADD COLUMN IF NOT EXISTS agent_type VARCHAR(100);
    `);

    await pool.query(`
      ALTER TABLE participants
        ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
    `);

    await pool.query(`
      ALTER TABLE participants
        DROP COLUMN IF EXISTS label,
        DROP COLUMN IF EXISTS label_description;
    `);

    await pool.query(`
      ALTER TABLE participants
        ADD COLUMN IF NOT EXISTS label              VARCHAR(100),
        ADD COLUMN IF NOT EXISTS label_description  TEXT;
    `);

    await pool.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);
    `);

    await pool.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS poster_url VARCHAR(500);
    `);

    await pool.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS preset_url VARCHAR(500);
    `);

    await pool.query(`
      ALTER TABLE events
        ADD COLUMN IF NOT EXISTS slideshow_urls TEXT[] NOT NULL DEFAULT '{}';
    `);

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS otp_code     VARCHAR(6),
        ADD COLUMN IF NOT EXISTS otp_expires  TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT FALSE;
    `);

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    `);

    // ── account_audit_logs safe column additions ───────────────────
    await pool.query(`
      ALTER TABLE account_audit_logs
        ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS actor_role VARCHAR(50),
        ADD COLUMN IF NOT EXISTS target_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS target_role VARCHAR(50);
    `);

    // ── Indexes ────────────────────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_agent_code              ON users(agent_code);
      CREATE INDEX IF NOT EXISTS idx_users_deleted_at              ON users(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_users_is_active               ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_events_created_by             ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_events_event_date             ON events(event_date);
      CREATE INDEX IF NOT EXISTS idx_events_status                 ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_deleted_at             ON events(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_events_registration_link      ON events(registration_link);
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
      CREATE INDEX IF NOT EXISTS idx_teams_branch_id               ON teams(branch_id);
      CREATE INDEX IF NOT EXISTS idx_event_branches_event_id       ON event_branches(event_id);
      CREATE INDEX IF NOT EXISTS idx_agents_agent_code             ON agents(agent_code);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at         ON account_audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id           ON account_audit_logs(actor_id);
      CREATE INDEX IF NOT EXISTS idx_agent_types_active            ON agent_types(is_active);
      CREATE INDEX IF NOT EXISTS idx_custom_fields_event_id        ON event_custom_fields(event_id);
      CREATE INDEX IF NOT EXISTS idx_custom_fields_locked          ON event_custom_fields(is_locked);
      CREATE INDEX IF NOT EXISTS idx_field_answers_participant      ON participant_field_answers(participant_id);
      CREATE INDEX IF NOT EXISTS idx_field_answers_field_id        ON participant_field_answers(field_id);
      CREATE INDEX IF NOT EXISTS idx_bulk_import_event_id          ON bulk_import_logs(event_id);
    `);

    // ── Performance indexes ────────────────────────────────────────
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_agent_event
        ON participants(agent_code, event_id)
        WHERE deleted_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_attendance_participant_event
        ON attendance_sessions(participant_id, event_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_scan_logs_event_scanned
        ON scan_logs(event_id, scanned_at DESC);

      CREATE INDEX IF NOT EXISTS idx_override_logs_event_created
        ON override_logs(event_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_events_status_deleted
        ON events(status, deleted_at)
        WHERE deleted_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_admin_grants_valid
        ON admin_grants(granted_to_user_id, event_id, expires_at)
        WHERE revoked_at IS NULL;

      CREATE INDEX IF NOT EXISTS idx_users_email_active
        ON users(email)
        WHERE deleted_at IS NULL AND is_active = TRUE;

      CREATE INDEX IF NOT EXISTS idx_participants_fullname_gin
        ON participants USING gin(to_tsvector('english', full_name));
    `);

    // ── Auto-update updated_at trigger ─────────────────────────────
    await pool.query(`
      CREATE OR REPLACE FUNCTION trigger_set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    const triggerTables = [
      'users', 'events', 'participants', 'attendance_sessions',
      'branches', 'teams', 'agents', 'agent_types',
      'event_custom_fields', 'participant_field_answers'
    ];
    for (const table of triggerTables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS set_updated_at_${table} ON ${table};
        CREATE TRIGGER set_updated_at_${table}
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
      `);
    }

    // ── Seed SuperAdmin ────────────────────────────────────────────
    const bcrypt = await import('bcryptjs');
    const existingSuperAdmin = await pool.query(
      `SELECT user_id FROM users WHERE email = 'kurtrusselgliponeo@gmail.com'`
    );
    if (existingSuperAdmin.rows.length === 0) {
      const hash = await bcrypt.default.hash('Admin@1234', 10);
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role, branch_name)
         VALUES ($1, $2, $3, 'admin', 'A1 Prime')`,
        ['Kurt Russel Gliponeo', 'kurtrusselgliponeo@gmail.com', hash]
      );
      console.log('✅ SuperAdmin seeded!');
    } else {
      console.log('ℹ️  SuperAdmin already exists, skipping.');
    }

    // ── Seed Agent Types ───────────────────────────────────────────
    const defaultAgentTypes = [
      { name: 'District Manager', display_order: 1 },
      { name: 'Area Manager',     display_order: 2 },
      { name: 'Branch Manager',   display_order: 3 },
      { name: 'Unit Manager',     display_order: 4 },
      { name: 'Agent',            display_order: 5 },
    ];
    for (const at of defaultAgentTypes) {
      await pool.query(
        `INSERT INTO agent_types (name, display_order)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [at.name, at.display_order]
      );
    }
    console.log('✅ Agent Types seeded!');

    // ── Seed Branches & Teams ──────────────────────────────────────
    const branchSeed = [
      { name: 'Alexandrite 3',    teams: ['Team Crisan', 'Team Jhainnie', 'Team Shai', 'Team Louis'] },
      { name: 'A3 Axinite',       teams: ['Team Tony'] },
      { name: 'A3 Goldstone',     teams: ['Team Claude', 'Team Jodel', 'Team Rechel', 'Team Roel', 'Team Sendi'] },
      { name: 'A3 Phoenix Stone', teams: ['Team Elvin', 'Team Feti', 'Team Jhen', 'Team Maan', 'Team Mark', 'Team Redge', 'Team Otchie'] },
      { name: 'Alexandrite 1',    teams: ['Team Alou', 'Team Dong', 'Team Henson', 'Team Isa', 'Team Nikki', 'Team Doris'] },
      { name: 'A1 Prime',         teams: ['Team Norj', 'Team Donel', 'Team Paulyn', 'Team Esmael'] },
    ];
    for (const branch of branchSeed) {
      const res = await pool.query(
        `INSERT INTO branches (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING branch_id`,
        [branch.name]
      );
      const branchId = res.rows[0].branch_id;
      for (const team of branch.teams) {
        await pool.query(
          `INSERT INTO teams (branch_id, name) VALUES ($1, $2) ON CONFLICT (branch_id, name) DO NOTHING`,
          [branchId, team]
        );
      }
    }
    console.log('✅ Branches & Teams seeded!');

    // ── Backfill registration_link ─────────────────────────────────
    const { randomBytes } = await import('crypto');
    const allEvents = await pool.query(
      `SELECT event_id FROM events WHERE registration_link IS NULL AND deleted_at IS NULL`
    );
    if (allEvents.rows.length > 0) {
      for (const row of allEvents.rows) {
        const token = randomBytes(28).toString('hex');
        await pool.query(
          `UPDATE events SET registration_link = $1 WHERE event_id = $2`,
          [token, row.event_id]
        );
      }
      console.log(`✅ Backfilled registration_link for ${allEvents.rows.length} event(s).`);
    } else {
      console.log('ℹ️  All events already have a registration_link, skipping backfill.');
    }

    console.log('');
    console.log('✅ Migration complete!');
    console.log('');
    console.log('  📋 Tables created/verified:');
    console.log('     • users');
    console.log('     • agents');
    console.log('     • agent_types            ← NEW: dynamic agent type management');
    console.log('     • events');
    console.log('     • event_permissions');
    console.log('     • admin_grants');
    console.log('     • participants');
    console.log('     • attendance_sessions');
    console.log('     • override_logs');
    console.log('     • scan_logs');
    console.log('     • branches');
    console.log('     • teams');
    console.log('     • event_branches');
    console.log('     • account_audit_logs');
    console.log('     • event_custom_fields     ← NEW: custom questions per event');
    console.log('     • participant_field_answers ← NEW: participant answers');
    console.log('     • bulk_import_logs        ← NEW: bulk import audit trail');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();