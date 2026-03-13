import multer from 'multer'
import path from 'path'
import cloudinary from 'cloudinary'

// ── Configure Cloudinary ──────────────────────────────────
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Memory storage — all files go to Cloudinary ──────────
const memoryStorage = multer.memoryStorage()

// ── Helper: upload buffer to Cloudinary ──────────────────
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) return reject(error)
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

// ── Photo upload (participant photos) ────────────────────
const photoFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG and PNG files are allowed'))
  }
}

export const uploadPhoto = multer({
  storage: memoryStorage,
  fileFilter: photoFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
})

// ── Slideshow/poster upload ───────────────────────────────
const slideshowFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowed.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, or WEBP files are allowed for slideshow images'))
  }
}

export const uploadSlideshow = multer({
  storage: memoryStorage,
  fileFilter: slideshowFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
})

// Keep uploadPoster as alias so events.routes.ts import doesn't break
export const uploadPoster = uploadSlideshow