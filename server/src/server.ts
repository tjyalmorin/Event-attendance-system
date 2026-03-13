import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import router from './routes/index.js'
import { globalLimiter } from './middlewares/rateLimiters.js'
import errorHandler from './middlewares/errorHandler.js'
import redis from './config/redis.js'
import pool from './config/database.js'

dotenv.config()

// ── Prevent server crash on unhandled DB connection errors ────────────────────
// Without these, a single "Connection terminated unexpectedly" from pg under
// high load will kill the entire Node.js process (as seen in stress test logs).
process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️  Unhandled Rejection (server stays alive):', reason?.message || reason)
})

process.on('uncaughtException', (err: Error) => {
  console.error('⚠️  Uncaught Exception (server stays alive):', err.message)
  if (err.message?.includes('EADDRINUSE')) process.exit(1)
})

const app = express()

app.set('trust proxy', 1)

app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// ── JSON body parser with size limit ──────────────────────────
app.use(express.json({ limit: '10kb' }))

// ── JSON parse error handler (must be 4-param error middleware) ──
// Catches malformed JSON bodies BEFORE they reach route handlers (fixes test #22)
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, error: 'Invalid JSON body' })
    return
  }
  next(err)
})

app.use('/uploads', express.static('uploads'))

app.use(globalLimiter)

app.use('/api', router)

app.get('/api/health', async (_req, res) => {
  const dbOk = await pool.query('SELECT 1').then(() => true).catch(() => false)
  const redisOk = redis.status === 'ready'

  res.status(dbOk ? 200 : 503).json({
    status:    dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status:    dbOk ? 'connected' : 'disconnected',
        pool: {
          total:   pool.totalCount,
          idle:    pool.idleCount,
          waiting: pool.waitingCount,
        }
      },
      cache: {
        status: redisOk ? 'connected' : 'unavailable',
        note:   redisOk ? undefined : 'System runs without cache — DB handles all reads',
      }
    }
  })
})

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})