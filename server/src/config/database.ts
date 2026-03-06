import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'primelog_local',
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '5432'),

  // ── Connection Pool Tuning ─────────────────────────────
  max:                    10,     // max connections in pool
  min:                    2,      // keep 2 alive at idle
  idleTimeoutMillis:      30000,  // close idle after 30s
  connectionTimeoutMillis:2000,   // fail fast if can't connect in 2s
  allowExitOnIdle:        false,  // keep pool alive in dev

  // ── Query Safety ───────────────────────────────────────
  statement_timeout:      15000,  // kill queries running > 15s
  query_timeout:          15000,  // axios-level timeout mirror
  application_name:       'primelog-api',
});

// ── Pool Event Listeners ────────────────────────────────
pool.on('connect', (client) => {
  console.log('✅ DB client connected — pool size:', pool.totalCount);
  client.query("SET timezone = 'Asia/Manila'");
});

pool.on('acquire', () => {
  if (pool.waitingCount > 0) {
    console.warn(`⚠️  Pool pressure — waiting: ${pool.waitingCount}, idle: ${pool.idleCount}`);
  }
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected pool error:', err.message);
});

pool.on('remove', () => {
  console.log(`🔌 DB client removed — pool size: ${pool.totalCount}`);
});

// ── Health Check Helper ─────────────────────────────────
export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
};

export default pool;