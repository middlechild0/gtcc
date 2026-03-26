import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { permissions, staff, staffPermissions } from "@visyx/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { t } from "../init";

/**
 * Like {@link hasPermission}, but requires the permission to be granted **globally**
 * (`staff_permissions.branch_id IS NULL`). Branch-scoped grants do not count.
 *
 * Use for APIs that mutate org-wide data (e.g. workflow configuration) so a user
 * granted a permission only for one branch cannot change global routing for all branches.
 */
export const hasGlobalPermission = (requiredPermission: string) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.authUserId || !ctx.profile) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    if (ctx.isSuperuser || ctx.isStaffAdmin) {
      return next({ ctx });
    }

    if (!ctx.staff) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Staff profile required for this action",
      });
    }

    const [row] = await db
      .select({ id: staffPermissions.id })
      .from(staffPermissions)
      .innerJoin(staff, eq(staffPermissions.staffId, staff.id))
      .innerJoin(permissions, eq(staffPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(staffPermissions.staffId, ctx.staff.id),
          eq(staffPermissions.granted, true),
          isNull(staffPermissions.branchId),
          eq(staff.isActive, true),
          eq(permissions.isActive, true),
          eq(permissions.key, requiredPermission),
        ),
      )
      .limit(1);

    if (!row) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Missing required global permission: ${requiredPermission}`,
      });
    }

    return next({ ctx });
  });
};

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
