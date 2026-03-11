import fs from 'fs';
import path from 'path';
import pool from '../config/database';
const uploadDir = path.join(__dirname, '../../uploads/agents');
const run = async () => {
    const files = fs.readdirSync(uploadDir);
    let matched = 0;
    let unmatched = 0;
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png'].includes(ext))
            continue;
        const agentCode = path.basename(file, ext); // e.g. "12345678"
        const result = await pool.query(`UPDATE participants SET photo_url = $1, updated_at = NOW()
       WHERE agent_code = $2 RETURNING participant_id`, [`/uploads/agents/${file}`, agentCode]);
        if (result.rowCount && result.rowCount > 0) {
            console.log(`✅ Matched: ${file} → agent_code ${agentCode}`);
            matched++;
        }
        else {
            console.log(`❌ No match: ${file} (agent_code ${agentCode} not found in DB)`);
            unmatched++;
        }
    }
    console.log(`\nDone. Matched: ${matched}, Unmatched: ${unmatched}`);
    await pool.end();
};
run().catch(console.error);
