import { db } from "./client";
import { sql } from "drizzle-orm";

const EXPECTED_TABLES = [
  "user_profiles",
  "branches",
  "permissions",
  "permission_groups",
  "permission_group_items",
  "staff",
  "staff_permissions",
  "audit_logs",
] as const;

async function main() {
  console.log("Verifying DB schema...");
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const rows = ((result as unknown) as { rows: { table_name: string }[] }).rows ?? [];
    const found = rows.map((r) => r.table_name);
    const missing = EXPECTED_TABLES.filter((t) => !found.includes(t));

    console.log("Found tables:", found.length, found);
    if (missing.length > 0) {
      console.warn("Missing tables:", missing);
      process.exit(1);
    }
    console.log("All expected tables present.");
  } catch (e) {
    console.error("Error verifying schema:", e);
    process.exit(1);
  }
  process.exit(0);
}

main();
