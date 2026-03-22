import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import router from './routes/index.js'
import { globalLimiter } from './middlewares/rateLimiters.js'
import errorHandler from './middlewares/errorHandler.js'
import redis from './config/redis.js'
import pool from './config/database.js'

dotenv.config()

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️  Unhandled Rejection (server stays alive):', reason?.message || reason)
})

process.on('uncaughtException', (err: Error) => {
  console.error('⚠️  Uncaught Exception (server stays alive):', err.message)
  if (err.message?.includes('EADDRINUSE')) process.exit(1)
})

const app = express()
const httpServer = createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  }
})

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id)

  socket.on('join:event', (event_id: number) => {
    socket.join('event:' + event_id)
    console.log('📡 Socket', socket.id, 'joined event:', event_id)
  })

  socket.on('leave:event', (event_id: number) => {
    socket.leave('event:' + event_id)
  })

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id)
  })
})

// ── Express middleware ─────────────────────────────────────────────────────────
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10kb' }))
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
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: dbOk ? 'connected' : 'disconnected', pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount } },
      cache: { status: redisOk ? 'connected' : 'unavailable', note: redisOk ? undefined : 'System runs without cache — DB handles all reads' }
    }
  })
})

app.use((_req, res) => { res.status(404).json({ error: 'Route not found' }) })
app.use(errorHandler)

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT)
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development')
  console.log('⚡ Socket.io ready')
})