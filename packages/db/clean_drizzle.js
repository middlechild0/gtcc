const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '../../apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_SESSION_POOLER
});

async function run() {
    try {
        await client.connect();
        // Drop the Drizzle migrations schema entirely so it runs 0000 to 0004
        await client.query('DROP SCHEMA IF EXISTS "drizzle" CASCADE;');
        console.log('Dropped drizzle schema, forcing a full replay next db:migrate.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
