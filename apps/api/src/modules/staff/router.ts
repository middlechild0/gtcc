import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import {
  ApplyGroupSchema,
  BulkUpdatePermissionsSchema,
  ChangeStaffPasswordSchema,
  CreatePermissionGroupSchema,
  DeactivateStaffSchema,
  GetPermissionGroupSchema,
  GetStaffSchema,
  GrantPermissionSchema,
  InviteStaffSchema,
  ListPermissionGroupsSchema,
  ListPermissionsSchema,
  ListStaffSchema,
  ReactivateStaffSchema,
  RevokePermissionSchema,
  SendStaffPasswordResetSchema,
  UpdatePermissionGroupSchema,
  UpdateStaffSchema,
} from "./schemas";
import { staffService } from "./service";

export const staffRouter = router({
  // ─────────────────────────────────────────────────────────────────────────────
  // CORE STAFF MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  invite: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .use(withAuditLog("staff:invited", "staff"))
    .input(InviteStaffSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.inviteStaff(input, ctx.authUserId!, ctx.isSuperuser);
    }),

  list: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .input(ListStaffSchema)
    .query(async ({ input }) => {
      return staffService.getStaffList(input);
    }),

  get: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .input(GetStaffSchema)
    .query(async ({ input }) => {
      return staffService.getStaffById(input.id);
    }),

  update: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .use(withAuditLog("staff:updated", "staff"))
    .input(UpdateStaffSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.updateStaffProfile(
        input,
        ctx.isSuperuser,
        ctx.staff?.id,
      );
    }),

  deactivate: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .use(withAuditLog("staff:deactivated", "staff"))
    .input(DeactivateStaffSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.deactivateStaff(input.id, ctx.staff?.id);
    }),

  reactivate: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .use(withAuditLog("staff:reactivated", "staff"))
    .input(ReactivateStaffSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.reactivateStaff(input.id, ctx.staff?.id);
    }),

  changePassword: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .use(withAuditLog("staff:password_changed", "staff"))
    .input(ChangeStaffPasswordSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.changeStaffPassword(
        input,
        ctx.staff?.id,
        ctx.isSuperuser,
      );
    }),

  sendPasswordReset: protectedProcedure
    .use(hasPermission("auth:manage_staff"))
    .use(withAuditLog("staff:password_reset_link_sent", "staff"))
    .input(SendStaffPasswordResetSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.sendStaffPasswordReset(input, ctx.staff?.id);
    }),

  // ─────────────────────────────────────────────────────────────────────────────
  // PERMISSION ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────────────────

  grantPermission: protectedProcedure
    .use(hasPermission("auth:manage_permissions"))
    .use(withAuditLog("staff:permission_granted", "staff_permission"))
    .input(GrantPermissionSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.grantPermission(
        input,
        ctx.authUserId!,
        ctx.staff?.id,
      );
    }),

  revokePermission: protectedProcedure
    .use(hasPermission("auth:manage_permissions"))
    .use(withAuditLog("staff:permission_revoked", "staff_permission"))
    .input(RevokePermissionSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.revokePermission(
        input,
        ctx.authUserId!,
        ctx.staff?.id,
      );
    }),

  applyGroup: protectedProcedure
    .use(hasPermission("auth:manage_permissions"))
    .use(withAuditLog("staff:permission_group_applied", "staff"))
    .input(ApplyGroupSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.applyPermissionGroup(
        input,
        ctx.authUserId!,
        ctx.staff?.id,
      );
    }),

  bulkUpdatePermissions: protectedProcedure
    .use(hasPermission("auth:manage_permissions"))
    .use(withAuditLog("staff:permission_bulk_updated", "staff"))
    .input(BulkUpdatePermissionsSchema)
    .mutation(async ({ input, ctx }) => {
      return staffService.bulkUpdatePermissions(
        input,
        ctx.authUserId!,
        ctx.staff?.id,
      );
    }),

  // ─────────────────────────────────────────────────────────────────────────────
  // PERMISSION GROUP (TEMPLATE) MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  createGroup: protectedProcedure
    .use(hasPermission("auth:manage_permission_groups"))
    .use(withAuditLog("permission_group:created", "permission_group"))
    .input(CreatePermissionGroupSchema)
    .mutation(async ({ input }) => {
      return staffService.createPermissionGroup(input);
    }),

  updateGroup: protectedProcedure
    .use(hasPermission("auth:manage_permission_groups"))
    .use(withAuditLog("permission_group:updated", "permission_group"))
    .input(UpdatePermissionGroupSchema)
    .mutation(async ({ input }) => {
      return staffService.updatePermissionGroup(input);
    }),

  getGroup: protectedProcedure
    .use(hasPermission("auth:manage_permission_groups"))
    .input(GetPermissionGroupSchema)
    .query(async ({ input }) => {
      return staffService.getPermissionGroup(input.id);
    }),

  listGroups: protectedProcedure
    .use(hasPermission("auth:manage_permission_groups"))
    .input(ListPermissionGroupsSchema)
    .query(async ({ input }) => {
      return staffService.listPermissionGroups(input);
    }),

  // ─────────────────────────────────────────────────────────────────────────────
  // RAW PERMISSIONS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  listPermissions: protectedProcedure
    .use(hasPermission("auth:manage_permissions"))
    .input(ListPermissionsSchema)
    .query(async ({ input }) => {
      return staffService.listPermissions(input);
    }),
});
