import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import router from './routes/index.js'
import { globalLimiter } from './middlewares/rateLimiters.js'
import errorHandler from './middlewares/errorHandler.js'
import redis from './config/redis.js'
import pool from './config/database.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10kb' }))

app.use(globalLimiter)

app.use('/api', router)

// Replace existing /health route with:
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