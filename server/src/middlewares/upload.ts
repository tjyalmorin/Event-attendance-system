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

// ── Slideshow images — disk storage ──────────────────────────
const SLIDESHOW_DIR = path.resolve('uploads/slideshow')
if (!fs.existsSync(SLIDESHOW_DIR)) fs.mkdirSync(SLIDESHOW_DIR, { recursive: true })

const slideshowStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SLIDESHOW_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = `slide-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`
    cb(null, name)
  },
})

const slideshowFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, or WEBP files are allowed for slideshow images'))
  }
}

// uploadSlideshow handles both single poster (legacy) and multiple slideshow_images
export const uploadSlideshow = multer({
  storage: slideshowStorage,
  fileFilter: slideshowFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
})

// Keep uploadPoster as alias so events.routes.ts import doesn't break
// — it now points to the same multer instance
export const uploadPoster = uploadSlideshow