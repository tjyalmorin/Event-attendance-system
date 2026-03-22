import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  // ── Supabase Database (Transaction Pooler — port 6543) ─────────────────────
  // Port 6543 = Supabase's PgBouncer transaction pooler.
  // This is the correct port for high-concurrency apps — it multiplexes
  // many app connections onto a smaller number of real Postgres connections.
  user:     process.env.DB_USER,
  host:     process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port:     Number(process.env.DB_PORT) || 6543,
  ssl:      { rejectUnauthorized: false },

  // ── Connection Pool Tuning (FIXED for spike load) ──────────────────────────
  //
  // Previous: max: 10 — this was the main bottleneck.
  // With 80 VUs each doing 3 queries, you need enough connections so
  // waiting queues don't stack up and time out.
  //
  // Supabase free tier allows ~60 direct connections.
  // Via the transaction pooler (port 6543), PgBouncer handles the actual
  // Postgres connections — you can safely set max higher here.
  //
  // Rule of thumb: max = (expected peak VUs / 3) + buffer
  // For 80 VUs: 80 / 3 ≈ 27 + 10 buffer = ~35
  max:                     35,   // ← was 10, now 35 for 80-VU spike
  min:                     5,    // keep 5 warm connections always
  idleTimeoutMillis:       20000, // release idle connections faster under spike
  connectionTimeoutMillis: 15000, // ← was 10000, give more time during spike

  allowExitOnIdle:         false,

  // ── Query Safety ───────────────────────────────────────────────────────────
  // Increased slightly to handle slow queries during DB spike
  statement_timeout:       20000, // ← was 15000
  query_timeout:           20000, // ← was 15000
  application_name:        'primelog-api',
});

// ── Pool Event Listeners ───────────────────────────────────────────────────────
pool.on('connect', (client) => {
  console.log('✅ DB client connected — pool size:', pool.totalCount);
  client.query("SET timezone = 'Asia/Manila'");
});

pool.on('acquire', () => {
  if (pool.waitingCount > 0) {
    console.warn(`⚠️  Pool pressure — waiting: ${pool.waitingCount}, idle: ${pool.idleCount}, total: ${pool.totalCount}`);
  }
});

pool.on('error', (err: Error) => {
  console.error('❌ Unexpected pool error:', err.message);
});

pool.on('remove', () => {
  console.log(`🔌 DB client removed — pool size: ${pool.totalCount}`);
});

// ── Health Check Helper ────────────────────────────────────────────────────────
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