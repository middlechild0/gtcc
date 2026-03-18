import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// STAFF MANAGEMENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const InviteStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  primaryBranchId: z.number().int().positive("Primary branch is required"),
  jobTitle: z.string().optional(),
  startingPermissionGroupId: z
    .number()
    .int()
    .positive("Starting permission group is required"),
});

export const UpdateStaffSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  primaryBranchId: z.number().int().positive().optional().nullable(),
  isAdmin: z.boolean().optional(),
});

export const GetStaffSchema = z.object({
  id: z.number().int().positive(),
});

export const ListStaffSchema = z.object({
  branchId: z.number().int().positive().optional(),
  search: z.string().optional(),
  includeInactive: z.boolean().default(false).optional(),
  limit: z.number().int().positive().max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

export const DeactivateStaffSchema = z.object({
  id: z.number().int().positive(),
});

export const ReactivateStaffSchema = z.object({
  id: z.number().int().positive(),
});

export const ChangeStaffPasswordSchema = z.object({
  staffId: z.number().int().positive(),
  newPassword: z.string().min(6, "Use at least 6 characters."),
});

export const SendStaffPasswordResetSchema = z.object({
  staffId: z.number().int().positive(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION ASSIGNMENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const GrantPermissionSchema = z.object({
  staffId: z.number().int().positive(),
  permissionId: z.number().int().positive(),
  branchId: z.number().int().positive().optional().nullable(),
});

export const RevokePermissionSchema = z.object({
  staffId: z.number().int().positive(),
  permissionId: z.number().int().positive(),
  branchId: z.number().int().positive().optional().nullable(),
});

export const ApplyGroupSchema = z.object({
  staffId: z.number().int().positive(),
  groupId: z.number().int().positive(),
  branchId: z.number().int().positive().optional().nullable(),
});

export const BulkUpdatePermissionsSchema = z.object({
  staffId: z.number().int().positive(),
  permissions: z.array(
    z.object({
      permissionId: z.number().int().positive(),
      branchId: z.number().int().positive().optional().nullable(),
      granted: z.boolean(),
    }),
  ),
});

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION GROUP (TEMPLATE) SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const CreatePermissionGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});

export const UpdatePermissionGroupSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
  isActive: z.boolean().optional(),
});

export const GetPermissionGroupSchema = z.object({
  id: z.number().int().positive(),
});

export const DeletePermissionGroupSchema = z.object({
  id: z.number().int().positive(),
});

export const ListPermissionGroupsSchema = z.object({
  includeInactive: z.boolean().default(false).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RAW PERMISSIONS SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const ListPermissionsSchema = z.object({
  includeInactive: z.boolean().default(false).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type InviteStaffInput = z.infer<typeof InviteStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
export type GetStaffInput = z.infer<typeof GetStaffSchema>;
export type ListStaffInput = z.infer<typeof ListStaffSchema>;
export type DeactivateStaffInput = z.infer<typeof DeactivateStaffSchema>;
export type ReactivateStaffInput = z.infer<typeof ReactivateStaffSchema>;
export type ChangeStaffPasswordInput = z.infer<typeof ChangeStaffPasswordSchema>;
export type SendStaffPasswordResetInput = z.infer<
  typeof SendStaffPasswordResetSchema
>;

export type GrantPermissionInput = z.infer<typeof GrantPermissionSchema>;
export type RevokePermissionInput = z.infer<typeof RevokePermissionSchema>;
export type ApplyGroupInput = z.infer<typeof ApplyGroupSchema>;
export type BulkUpdatePermissionsInput = z.infer<
  typeof BulkUpdatePermissionsSchema
>;

export type CreatePermissionGroupInput = z.infer<
  typeof CreatePermissionGroupSchema
>;
export type UpdatePermissionGroupInput = z.infer<
  typeof UpdatePermissionGroupSchema
>;
export type GetPermissionGroupInput = z.infer<typeof GetPermissionGroupSchema>;
export type DeletePermissionGroupInput = z.infer<
  typeof DeletePermissionGroupSchema
>;
export type ListPermissionGroupsInput = z.infer<
  typeof ListPermissionGroupsSchema
>;

export type ListPermissionsInput = z.infer<typeof ListPermissionsSchema>;
