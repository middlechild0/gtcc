import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Required: set DATABASE_SESSION_POOLER in your .env.
 * For Supabase: use the connection pooler URL from Project Settings → Database.
 * Example: postgresql://postgres.[ref]:[password]@[region].pooler.supabase.com:5432/postgres
 */
const connectionString = process.env.DATABASE_SESSION_POOLER;
if (!connectionString) {
  throw new Error(
    "DATABASE_SESSION_POOLER is required. Set it in .env).",
  );
}

const pool = new Pool({
  connectionString,
  max: isDevelopment ? 8 : 12,
  idleTimeoutMillis: isDevelopment ? 5000 : 60000,
  connectionTimeoutMillis: 5000,
  maxUses: isDevelopment ? 100 : 0,
  allowExitOnIdle: true,
  ssl: isDevelopment ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});

/** Alias for db (for code that previously used primaryDb) */
export const primaryDb = db;

export const connectDb = async () => db;

export type Database = typeof db;

export type TransactionClient = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

/** Use in query functions that work both standalone and inside a transaction */
export type DatabaseOrTransaction = Database | TransactionClient;
