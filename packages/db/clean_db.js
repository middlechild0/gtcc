const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '../../apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_SESSION_POOLER
});

async function run() {
    try {
        await client.connect();

        console.log('Dropping application tables to allow clean drizzle migration...');
        const tables = [
            'audit_logs',
            'permission_group_items',
            'permission_groups',
            'permissions',
            'staff_permissions',
            'staff',
            'patient_kins',
            'patient_guarantors',
            'patient_insurances',
            'insurance_providers',
            'patient_branch_profiles',
            'patients',
            'branches',
            'user_profiles',
            '__drizzle_migrations'
        ];

        for (const table of tables) {
            await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
            console.log(`Dropped ${table}`);
        }

        // Drop any associated enums to prevent conflicts
        await client.query(`DROP TYPE IF EXISTS gender_enum CASCADE;`);
        await client.query(`DROP TYPE IF EXISTS marital_status_enum CASCADE;`);
        await client.query(`DROP TYPE IF EXISTS blood_group_enum CASCADE;`);

        // Drop sequences
        await client.query(`DROP SEQUENCE IF EXISTS patient_number_seq CASCADE;`);

        console.log('Cleanup complete. Ready for db:migrate.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
