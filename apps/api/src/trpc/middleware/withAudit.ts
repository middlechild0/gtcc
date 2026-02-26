import { t } from "../init";
import { db } from "@visyx/db/client";
import { auditLogs } from "@visyx/db/schema";

/**
 * Creates a middleware that automatically logs a successful mutation to the audit_logs table.
 *
 * @param action The action being performed, e.g. "billing:invoice_created"
 * @param entityType (Optional) the type of entity being touched, e.g. "invoice"
 * @param getEntityId (Optional) a function to extract the entity ID from the input/result
 */
export const withAuditLog = (
    action: string,
    entityType?: string,
    getEntityId?: (input: any, result: any) => string | undefined,
) => {
    return t.middleware(async ({ ctx, input, next, path }) => {
        const result = await next({ ctx });

        // Only log if the mutation was successful
        if (result.ok) {
            // Fire-and-forget DB insert. IMPORTANT: use .catch to avoid unhandled rejections
            const entityId = getEntityId ? getEntityId(input, result.data) : undefined;

            const details = {
                input,
                path,
                // We do not save large output data to avoid bloated logs, but input is very useful
            };

            void db
                .insert(auditLogs)
                .values({
                    action,
                    userId: ctx.authUserId,
                    branchId: ctx.branchId,
                    entityType,
                    entityId,
                    details,
                    // Extract basic IP/UA if available in the Hono request headers
                    ipAddress: ctx.req.headers.get("x-forwarded-for"),
                    userAgent: ctx.req.headers.get("user-agent"),
                })
                .execute()
                .catch((error) => {
                    // Log to Pino but don't disrupt the user's request
                    console.error(`[Audit Log Failed] Action: ${action}`, error);
                });
        }

        return result;
    });
};
