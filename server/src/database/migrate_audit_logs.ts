import dotenv from 'dotenv'
dotenv.config()
import pool from '../config/database.js'

const run = async () => {
  console.log('🚀 Running account_audit_logs migration...')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS account_audit_logs (
      log_id        SERIAL        PRIMARY KEY,
      actor_id      UUID          REFERENCES users(user_id) ON DELETE SET NULL,
      actor_name    VARCHAR(255)  NOT NULL,
      actor_role    VARCHAR(50)   NOT NULL,
      action        VARCHAR(50)   NOT NULL,
      target_id     UUID          REFERENCES users(user_id) ON DELETE SET NULL,
      target_name   VARCHAR(255)  NOT NULL,
      target_role   VARCHAR(50)   NOT NULL,
      details       TEXT,
      created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON account_audit_logs(created_at DESC);
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
      ON account_audit_logs(actor_id);
  `)

  console.log('✅ account_audit_logs table created!')
  process.exit(0)
}

run().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})