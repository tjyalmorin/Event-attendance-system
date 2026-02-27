import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import { v2 as cloudinary } from 'cloudinary'
import pg from 'pg'

const require = createRequire(import.meta.url)
require('dotenv').config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const { Pool } = pg
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'primelog_local',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
})

const photosDir = path.join(__dirname, '../../uploads/agents')

const run = async () => {
  if (!fs.existsSync(photosDir)) {
    console.log(`❌ Photos folder not found: ${photosDir}`)
    console.log('Create the folder and add agent photos first.')
    await pool.end()
    return
  }

  const files = fs.readdirSync(photosDir).filter(f =>
    ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase())
  )

  if (files.length === 0) {
    console.log('❌ No image files found in the photos folder.')
    await pool.end()
    return
  }

  console.log(`Found ${files.length} photo(s). Uploading to Cloudinary...\n`)

  let matched = 0
  let unmatched = 0
  let failed = 0

  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const agentCode = path.basename(file, ext)
    const filePath = path.join(photosDir, file)

    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        public_id: `agents/${agentCode}`,
        overwrite: true,
        resource_type: 'image',
      })

      const photo_url = uploadResult.secure_url

      const result = await pool.query(
        `UPDATE participants SET photo_url = $1, updated_at = NOW()
         WHERE agent_code = $2 RETURNING participant_id, full_name`,
        [photo_url, agentCode]
      )

      if (result.rowCount && result.rowCount > 0) {
        console.log(`✅ ${file} → ${result.rows[0].full_name} (${agentCode})`)
        console.log(`   URL: ${photo_url}`)
        matched++
      } else {
        console.log(`⚠️  Uploaded but no DB match for agent_code: ${agentCode}`)
        unmatched++
      }
    } catch (err) {
      console.log(`❌ Failed: ${file} — ${err.message}`)
      failed++
    }
  }

  console.log(`\n────────────────────────────────────`)
  console.log(`✅ Matched & uploaded: ${matched}`)
  console.log(`⚠️  Uploaded, no DB match: ${unmatched}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`────────────────────────────────────`)

  await pool.end()
}

run().catch(console.error)
