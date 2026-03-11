import { setDefaultResultOrder } from 'dns'
setDefaultResultOrder('ipv4first')

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
  user:     'postgres.sxuvmzgjpnncekdmrtmj',
  host:     'aws-1-ap-south-1.pooler.supabase.com',
  database: process.env.DB_NAME     || 'primelog',
  password: 'Primeloga1prime',
  port:     6543,
  ssl:      { rejectUnauthorized: false },
})

// ── Settings ──────────────────────────────────────────────────────────────────
const photosDir = path.join(__dirname, '../../uploads/agents')

const UPLOAD_OPTIONS = {
  overwrite:     true,
  resource_type: 'image',
  transformation: [
    {
      width:        400,
      height:       400,
      crop:         'limit',
      quality:      80,
      fetch_format: 'auto'
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
  console.log('╠══════════════════════════════════════════════════════╣')
  console.log('║     Writing photo_url → agents table (Option 2)      ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log('')
  console.log('  📐 Resize  : max 400×400px (aspect ratio preserved)')
  console.log('  🗜️  Quality : 80% (sharp, ~60-70% smaller file size)')
  console.log('  📦 Format  : auto (WebP for modern browsers)')
  console.log('  🗄️  Target  : agents table (independent of events)')
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
  let uploaded  = 0
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
      // ── Upload to Cloudinary ──────────────────────────────
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

      // ── Upsert into agents table (Option 2) ───────────────
      // INSERT if agent_code doesn't exist, UPDATE photo_url if it does.
      // This is completely independent of any event or participant record.
      await pool.query(
        `INSERT INTO agents (agent_code, photo_url, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (agent_code)
         DO UPDATE SET photo_url = EXCLUDED.photo_url, updated_at = NOW()`,
        [agentCode, photo_url]
      )

      console.log(`✅ Uploaded`)
      console.log(`     🔑 agent_code : ${agentCode}`)
      console.log(`     📉 Size       : ${formatBytes(fileSize)} → ${formatBytes(uploadedBytes)} (${savings}% smaller)`)
      console.log(`     🔗 URL        : ${photo_url}`)
      uploaded++

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
  console.log(`     ✅ Uploaded to agents table : ${uploaded}`)
  console.log(`     ❌ Failed                  : ${failed}`)
  console.log('')
  console.log('  💾 Storage Savings')
  console.log(`     Original total : ${formatBytes(totalOriginalBytes)}`)
  console.log(`     Uploaded total : ${formatBytes(totalUploadedBytes)}`)
  console.log(`     Total saved    : ${totalSavings}% smaller`)
  console.log('')

  if (uploaded > 0) {
    console.log('  ✅ Done! Photos stored in agents table.')
    console.log('     They will appear on scanner screen for any event')
    console.log('     the agent registers for — no re-upload needed.')
    console.log('')
    console.log('  💡 How it works:')
    console.log('     • Registration queries agents table by agent_code')
    console.log('     • photo_url is resolved live — no copy into participants')
    console.log('     • Scanner joins agents table to show the photo')
    console.log('')
  }

  await pool.end()
}

run().catch(err => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
