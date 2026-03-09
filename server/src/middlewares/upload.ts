import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Use memory storage — file goes to Cloudinary directly, not disk
const storage = multer.memoryStorage()

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG and PNG files are allowed'))
  }
}

export const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

// ── Poster upload — disk storage ──────────────────────────────
const POSTER_DIR = path.resolve('uploads/posters')
if (!fs.existsSync(POSTER_DIR)) fs.mkdirSync(POSTER_DIR, { recursive: true })

const posterStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, POSTER_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = `poster-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
    cb(null, name)
  },
})

const posterFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, or WEBP files are allowed for posters'))
  }
}

export const uploadPoster = multer({
  storage: posterStorage,
  fileFilter: posterFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
})