const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: '../../apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_SESSION_POOLER
});

async function run() {
    try {
        await client.connect();

        // 1. Create the migrations table
        await client.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        "id" SERIAL PRIMARY KEY,
        "hash" text NOT NULL,
        "created_at" bigint
      );
    `);

        // 2. Read the journal
        const journalPath = path.join(__dirname, 'migrations', 'meta', '_journal.json');
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));

        // 3. For each entry, hash the file and insert
        for (const entry of journal.entries) {
            const sqlPath = path.join(__dirname, 'migrations', `${entry.tag}.sql`);
            if (fs.existsSync(sqlPath)) {
                const content = fs.readFileSync(sqlPath, 'utf-8');
                const hash = crypto.createHash('sha256').update(content).digest('hex');

                // Insert if it does not exist (by id)
                await client.query(`
          INSERT INTO "__drizzle_migrations" (id, hash, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (id) DO NOTHING;
        `, [entry.idx + 1, hash, entry.when]);

                console.log(`Marked ${entry.tag} as applied (Hash: ${hash.substring(0, 8)}...)`);
            }
        }

        console.log('Successfully aligned database with migration history!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
