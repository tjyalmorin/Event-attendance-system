import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import router from './routes/index.js'

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.use('/api', router)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})