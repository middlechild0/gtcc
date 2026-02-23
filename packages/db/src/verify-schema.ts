
import { db } from "./client";
import { sql } from "drizzle-orm";
// I'll use a direct query to check tables

async function main() {
    console.log("Verifying DB Schema...");
    try {
        const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_profiles');
    `);
        console.log("Found tables:", result.rows);
    } catch (e) {
        console.error("Error verifying DB:", e);
    }
    process.exit(0);
}

main();
