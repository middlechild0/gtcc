const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '../../apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_SESSION_POOLER
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\';');
        console.log("Tables in public schema:", res.rows.map(r => r.tablename));
        const migs = await client.query('SELECT * FROM __drizzle_migrations;');
        console.log("Migrations applied:", migs.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
