import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { v2 as cloudinary } from 'cloudinary'
import pg from 'pg'

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

// ── Database Config ───────────────────────────────────────────────────────────
const { Pool } = pg
const pool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'primelog_local',
  password: process.env.DB_PASSWORD,
  port:     parseInt(process.env.DB_PORT || '5432'),
})

// ── Settings ──────────────────────────────────────────────────────────────────
const photosDir = path.join(__dirname, '../../uploads/agents')

//  Resize: max 400×400px (keeps aspect ratio, never stretches)
//  Quality: 80% — sharp and clear, ~60-70% smaller file size
//  Format:  auto — Cloudinary picks the best format (WebP for modern browsers)
const UPLOAD_OPTIONS = {
  overwrite:     true,
  resource_type: 'image',
  transformation: [
    {
      width:        400,
      height:       400,
      crop:         'limit',  // shrinks if larger, never upscales smaller photos
      quality:      80,       // 80% quality = 20% reduction, still very sharp
      fetch_format: 'auto'    // serves WebP to modern browsers automatically
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
  console.log('║     PrimeLog — Bulk Photo Upload to Cloudinary       ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log('')
  console.log('  📐 Resize  : max 400×400px (aspect ratio preserved)')
  console.log('  🗜️  Quality : 80% (sharp, ~60-70% smaller file size)')
  console.log('  📦 Format  : auto (WebP for modern browsers)')
  console.log('')

  // ── Check folder exists ───────────────────────────────────────────────
  if (!fs.existsSync(photosDir)) {
    console.log(`❌ Photos folder not found: ${photosDir}`)
    console.log('')
    console.log('  Create the folder first:')
    console.log('  server/uploads/agents/')
    console.log('')
    console.log('  Then add photos renamed to agent codes:')
    console.log('  12345678.jpg, 87654321.png, etc.')
    await pool.end()
    return
  }

  // ── Get all valid image files ─────────────────────────────────────────
  const allFiles = fs.readdirSync(photosDir)
  const imageFiles = allFiles.filter(f =>
    ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
  )

  if (imageFiles.length === 0) {
    console.log('❌ No image files found in uploads/agents/')
    console.log('   Supported formats: .jpg, .jpeg, .png, .webp')
    await pool.end()
    return
  }

  console.log(`  📁 Found ${imageFiles.length} photo(s) in uploads/agents/`)
  console.log('')
  console.log('─'.repeat(56))
  console.log('')

  // ── Track results ─────────────────────────────────────────────────────
  let matched   = 0
  let unmatched = 0
  let failed    = 0
  let totalOriginalBytes = 0
  let totalUploadedBytes = 0

  for (const file of imageFiles) {
    const ext       = path.extname(file).toLowerCase()
    const agentCode = path.basename(file, ext)
    const filePath  = path.join(photosDir, file)
    const fileSize  = fs.statSync(filePath).size
    totalOriginalBytes += fileSize

    process.stdout.write(`  📸 ${file} (${formatBytes(fileSize)}) → `)

    try {
      // Upload with auto-resize + compression
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        ...UPLOAD_OPTIONS,
        public_id: `agents/${agentCode}`,
      })

      const uploadedBytes = uploadResult.bytes || 0
      totalUploadedBytes += uploadedBytes

      const savings = fileSize > 0
        ? Math.round((1 - uploadedBytes / fileSize) * 100)
        : 0

      const photo_url = uploadResult.secure_url

      // Update ALL participants with this agent code (across all events)
      const result = await pool.query(
        `UPDATE participants
         SET photo_url = $1, updated_at = NOW()
         WHERE agent_code = $2
         RETURNING participant_id, full_name`,
        [photo_url, agentCode]
      )

      if (result.rowCount && result.rowCount > 0) {
        const names = result.rows.map(r => r.full_name).join(', ')
        console.log(`✅ Matched`)
        console.log(`     👤 ${names}`)
        console.log(`     📉 ${formatBytes(fileSize)} → ${formatBytes(uploadedBytes)} (${savings}% smaller)`)
        console.log(`     🔗 ${photo_url}`)
        matched++
      } else {
        console.log(`⚠️  Uploaded but no DB match`)
        console.log(`     agent_code "${agentCode}" not found in participants table`)
        console.log(`     📉 ${formatBytes(fileSize)} → ${formatBytes(uploadedBytes)} (${savings}% smaller)`)
        console.log(`     🔗 ${photo_url}`)
        unmatched++
      }
    } catch (err) {
      console.log(`❌ Failed`)
      console.log(`     Error: ${err.message}`)
      failed++
    }

    console.log('')
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const totalSavings = totalOriginalBytes > 0
    ? Math.round((1 - totalUploadedBytes / totalOriginalBytes) * 100)
    : 0

  console.log('─'.repeat(56))
  console.log('')
  console.log('  📊 Upload Summary')
  console.log(`     ✅ Matched & uploaded   : ${matched}`)
  console.log(`     ⚠️  Uploaded, no DB match: ${unmatched}`)
  console.log(`     ❌ Failed               : ${failed}`)
  console.log('')
  console.log('  💾 Storage Savings')
  console.log(`     Original total : ${formatBytes(totalOriginalBytes)}`)
  console.log(`     Uploaded total : ${formatBytes(totalUploadedBytes)}`)
  console.log(`     Total saved    : ${totalSavings}% smaller`)
  console.log('')

  if (unmatched > 0) {
    console.log('  ⚠️  Unmatched photos were still uploaded to Cloudinary.')
    console.log('     Check that filenames exactly match agent_code in the DB.')
    console.log('     Example: if agent_code is "12345678", file must be "12345678.jpg"')
    console.log('')
  }

  if (matched > 0) {
    console.log('  ✅ Done! Photos are live. No server restart needed.')
    console.log('     They will appear on the scanner verify screen immediately.')
    console.log('')
  }

  await pool.end()
}

run().catch(err => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})