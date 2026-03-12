import { setDefaultResultOrder } from 'dns'
setDefaultResultOrder('ipv4first')

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { v2 as cloudinary } from 'cloudinary'

const require = createRequire(import.meta.url)
require('dotenv').config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ── Cloudinary Config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Settings ──────────────────────────────────────────────────────────────────
const presetsDir = path.join(__dirname, '../../uploads/presets')

const UPLOAD_OPTIONS = {
  overwrite:     true,
  resource_type: 'image',
  transformation: [
    {
      width:        1200,
      crop:         'limit',
      quality:      85,
      fetch_format: 'auto',
    }
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Main ──────────────────────────────────────────────────────────────────────
const run = async () => {
  console.log('')
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║   PrimeLog — Upload Preset Posters to Cloudinary     ║')
  console.log('╠══════════════════════════════════════════════════════╣')
  console.log('║   Folder: primelog/presets                           ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log('')

  // ── Check folder exists ───────────────────────────────────────────────
  if (!fs.existsSync(presetsDir)) {
    console.log(`❌ Presets folder not found: ${presetsDir}`)
    console.log('')
    console.log('  Expected location: server/uploads/presets/')
    console.log('')
    return
  }

  // ── Get all valid image files ─────────────────────────────────────────
  const allFiles = fs.readdirSync(presetsDir)
  const imageFiles = allFiles.filter(f =>
    ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
  )

  if (imageFiles.length === 0) {
    console.log('❌ No image files found in uploads/presets/')
    console.log('   Supported formats: .jpg, .jpeg, .png, .webp')
    return
  }

  console.log(`  📁 Found ${imageFiles.length} preset(s) in uploads/presets/`)
  console.log('')
  console.log('─'.repeat(56))
  console.log('')

  // ── Track results ─────────────────────────────────────────────────────
  let uploaded = 0
  let failed   = 0
  let totalOriginalBytes = 0
  let totalUploadedBytes = 0

  // ── This will collect the PRESET_IMAGES array to paste into CreateEvent.tsx
  const presetEntries = []

  for (const file of imageFiles) {
    const ext      = path.extname(file).toLowerCase()
    const name     = path.basename(file, ext)   // e.g. "01", "02", ...
    const filePath = path.join(presetsDir, file)
    const fileSize = fs.statSync(filePath).size
    totalOriginalBytes += fileSize

    process.stdout.write(`  🖼️  ${file} (${formatBytes(fileSize)}) → `)

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        ...UPLOAD_OPTIONS,
        public_id: `primelog/presets/${name}`,
      })

      const uploadedBytes = result.bytes || 0
      totalUploadedBytes += uploadedBytes
      const savings = fileSize > 0
        ? Math.round((1 - uploadedBytes / fileSize) * 100)
        : 0

      console.log(`✅ Uploaded`)
      console.log(`     📉 Size : ${formatBytes(fileSize)} → ${formatBytes(uploadedBytes)} (${savings}% smaller)`)
      console.log(`     🔗 URL  : ${result.secure_url}`)
      console.log('')

      presetEntries.push({ id: name, url: result.secure_url })
      uploaded++

    } catch (err) {
      console.log(`❌ Failed`)
      console.log(`     Error: ${err.message}`)
      console.log('')
      failed++
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const totalSavings = totalOriginalBytes > 0
    ? Math.round((1 - totalUploadedBytes / totalOriginalBytes) * 100)
    : 0

  console.log('─'.repeat(56))
  console.log('')
  console.log('  📊 Upload Summary')
  console.log(`     ✅ Uploaded : ${uploaded}`)
  console.log(`     ❌ Failed   : ${failed}`)
  console.log('')
  console.log('  💾 Storage Savings')
  console.log(`     Original total : ${formatBytes(totalOriginalBytes)}`)
  console.log(`     Uploaded total : ${formatBytes(totalUploadedBytes)}`)
  console.log(`     Total saved    : ${totalSavings}% smaller`)
  console.log('')

  if (presetEntries.length > 0) {
    console.log('─'.repeat(56))
    console.log('')
    console.log('  ✅ Copy this into CreateEvent.tsx (replace PRESET_IMAGES):')
    console.log('')
    console.log('  const PRESET_IMAGES = [')
    for (const entry of presetEntries) {
      console.log(`    { id: '${entry.id}', url: '${entry.url}' },`)
    }
    console.log('  ];')
    console.log('')
  }
}

run().catch(err => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
