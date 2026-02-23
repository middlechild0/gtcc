import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Database } from "./client";
import * as schema from "./schema";

const isDevelopment = process.env.NODE_ENV === "development";

let workerPool: Pool | null = null;
let workerDb: ReturnType<typeof drizzle> | null = null;

function getWorkerConnectionString(): string {
  const url =
    process.env.DATABASE_PRIMARY_POOLER_URL ?? process.env.DATABASE_SESSION_POOLER;
  if (!url) {
    throw new Error("DATABASE_SESSION_POOLER or DATABASE_PRIMARY_POOLER_URL must be set");
  }
  return url;
}

/**
 * Worker database client with connection pool optimized for BullMQ concurrent jobs.
 * Pool is created on first call. Requires DATABASE_SESSION_POOLER or DATABASE_PRIMARY_POOLER_URL.
 */
export const getWorkerDb = (): Database => {
  if (!workerDb) {
    const connectionString = getWorkerConnectionString();
    workerPool = new Pool({
      connectionString,
      max: 100,
      idleTimeoutMillis: isDevelopment ? 5000 : 60000,
      connectionTimeoutMillis: 15000,
      maxUses: 0,
      allowExitOnIdle: true,
    });
    workerDb = drizzle(workerPool, {
      schema,
      casing: "snake_case",
    });
  }
  return workerDb as Database;
};

/**
 * Cleanup function to close database connections gracefully.
 * Should be called on worker shutdown.
 */
export const closeWorkerDb = async (): Promise<void> => {
  if (workerPool) {
    await workerPool.end();
    workerPool = null;
    workerDb = null;
  }
};
