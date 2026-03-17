import multer from 'multer'
import cloudinary from '../config/cloudinary.js'

// ── Memory storage — all files go to Cloudinary ──────────
const memoryStorage = multer.memoryStorage()

// ── Helper: upload buffer to Cloudinary ──────────────────
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
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

// ── Shared mimetype validation ────────────────────────────
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp']

const photoFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, or WEBP images are allowed'))
  }
}

const slideshowFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, or WEBP images are allowed for slideshow images'))
  }
}

// ── Photo upload (participant/agent photos) ───────────────
export const uploadPhoto = multer({
  storage: memoryStorage,
  fileFilter: photoFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// ── Slideshow/poster upload ───────────────────────────────
export const uploadSlideshow = multer({
  storage: memoryStorage,
  fileFilter: slideshowFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
})

export const uploadPoster = uploadSlideshow