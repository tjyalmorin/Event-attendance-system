import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redisUrl = process.env.REDIS_URL

// ── If no Redis URL, export a dummy client ────────────────
// This prevents the server from hanging on startup when Redis is unavailable
if (!redisUrl) {
  console.warn('⚠️  No REDIS_URL set — caching disabled, using DB for all reads')
}

const redis = new Redis(redisUrl || 'redis://localhost:6379', {
  // ── Reconnection Strategy ─────────────────────────────
  retryStrategy(times) {
    if (times > 3) {
      console.error('❌ Redis: max retries reached, giving up')
      return null  // stop retrying — do NOT block server
    }
    const delay = Math.min(times * 200, 1000)
    console.warn(`⚠️  Redis: retrying in ${delay}ms (attempt ${times})`)
    return delay
  },

  // ── Connection Settings ───────────────────────────────
  maxRetriesPerRequest:   null,   // ← don't throw on failed commands
  connectTimeout:         3000,   // ← fail fast (was 5000)
  commandTimeout:         2000,
  lazyConnect:            true,   // don't connect until first command
  enableReadyCheck:       false,  // ← was true, caused blocking
  keepAlive:              10000,

  // ── Labeling ─────────────────────────────────────────
  connectionName:         'primelog-cache',
})

redis.on('connect',       () => console.log('✅ Redis connected'))
redis.on('ready',         () => console.log('✅ Redis ready'))
redis.on('error',   (err) => console.error('❌ Redis error:', err.message))
redis.on('close',         () => console.warn('⚠️  Redis connection closed'))
redis.on('reconnecting',  () => console.log('🔄 Redis reconnecting...'))

// ── Connect on startup (fully non-blocking) ───────────────
if (redisUrl) {
  redis.connect().catch((err) => {
    console.warn('⚠️  Redis unavailable at startup — caching disabled:', err.message)
  })
}

export default redis