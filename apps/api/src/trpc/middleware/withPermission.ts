import { TRPCError } from "@trpc/server";
import { t } from "../init";

/**
 * Creates a middleware that checks if the current user has a specific permission.
 * Assumes the user is already authenticated (should be used after protectedProcedure).
 *
 * @param requiredPermission The permission key to check (e.g. "patients:view")
 */
export const hasPermission = (requiredPermission: string) => {
    return t.middleware(({ ctx, next }) => {
        // 1. Must be authenticated
        if (!ctx.authUserId || !ctx.profile) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Not authenticated",
            });
        }

        // 2. Superusers and Admins bypass all explicit permission checks
        if (ctx.isSuperuser || ctx.isStaffAdmin) {
            return next({ ctx });
        }

        // 3. Normal staff - check if they have the specific key for the resolved branch
        if (!ctx.permissionKeys.includes(requiredPermission)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: `Missing required permission: ${requiredPermission}`,
            });
        }

        return next({ ctx });
    });
};
