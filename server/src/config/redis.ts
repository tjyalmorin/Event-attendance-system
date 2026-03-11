import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

const redis = new Redis(redisUrl, {
  // ── Reconnection Strategy ─────────────────────────────
  retryStrategy(times) {
    if (times > 5) {
      console.error('❌ Redis: max retries reached, giving up')
      return null  // stop retrying
    }
    const delay = Math.min(times * 200, 2000)
    console.warn(`⚠️  Redis: retrying in ${delay}ms (attempt ${times})`)
    return delay
  },

  // ── Connection Settings ───────────────────────────────
  maxRetriesPerRequest:   3,
  connectTimeout:         5000,
  commandTimeout:         2000,
  lazyConnect:            true,   // don't connect until first command
  enableReadyCheck:       true,
  keepAlive:              10000,

  // ── Labeling ─────────────────────────────────────────
  connectionName:         'primelog-cache',
})

redis.on('connect',       () => console.log('✅ Redis connected'))
redis.on('ready',         () => console.log('✅ Redis ready'))
redis.on('error',   (err) => console.error('❌ Redis error:', err.message))
redis.on('close',         () => console.warn('⚠️  Redis connection closed'))
redis.on('reconnecting',  () => console.log('🔄 Redis reconnecting...'))

// ── Connect on startup (non-blocking) ────────────────────
redis.connect().catch((err) => {
  console.warn('⚠️  Redis unavailable at startup — caching disabled:', err.message)
})

export default redis