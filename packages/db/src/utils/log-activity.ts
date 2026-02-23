import type { DatabaseOrTransaction } from "../client";
import { auditLogs } from "../schema";

export type ActivityType =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "system"
  | "security";

interface LogActivityOptions {
  db: DatabaseOrTransaction;
  teamId?: string; // Optional or unused in new schema, keeping for compatibility
  userId?: string;
  type: ActivityType;
  metadata: Record<string, any>;
  priority?: number;
  source?: "user" | "system";
}

export function logActivity(options: LogActivityOptions) {
  try {
    options.db.insert(auditLogs).values({
      userId: options.userId,
      action: options.type,
      details: options.metadata,
      // ipAddress: options.ipAddress // If we had it
    }).catch((error: unknown) => {
      console.warn("Audit logging failed", {
        error,
        action: options.type,
      });
    });
  } catch {
    // Even if the call itself throws, ignore it
  }
}
