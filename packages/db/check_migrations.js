const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '../../apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_SESSION_POOLER
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM "__drizzle_migrations" ORDER BY id ASC;');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        if (err.code === '42P01') {
            console.log('No __drizzle_migrations table found.');
        } else {
            console.error('Error:', err);
        }
    } finally {
        await client.end();
    }
}

run();
