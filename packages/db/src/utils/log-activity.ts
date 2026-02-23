import type { DatabaseOrTransaction } from "../client";
import { auditLogs } from "../schema";

/** Action format: "module:event" e.g. "auth:login", "staff:permission_granted" */
export type ActivityType =
  | "auth:login"
  | "auth:logout"
  | "create"
  | "update"
  | "delete"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "system"
  | "security";

export interface LogActivityOptions {
  db: DatabaseOrTransaction;
  userId?: string;
  branchId?: number;
  type: ActivityType;
  metadata: Record<string, unknown>;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export function logActivity(options: LogActivityOptions) {
  try {
    void options.db
      .insert(auditLogs)
      .values({
        userId: options.userId ?? null,
        branchId: options.branchId ?? null,
        action: options.type,
        entityType: options.entityType ?? null,
        entityId: options.entityId ?? null,
        details: options.metadata,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
      })
      .catch((error: unknown) => {
        console.warn("Audit logging failed", {
          error,
          action: options.type,
        });
      });
  } catch {
    // Ignore sync errors
  }
}
