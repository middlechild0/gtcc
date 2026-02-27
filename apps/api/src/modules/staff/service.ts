import * as React from "react";
import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { sendEmail } from "@visyx/email";
import { InviteEmail } from "@visyx/email/emails/invite";
import { render } from "@visyx/email/render";
import {
  branches,
  permissionGroupItems,
  permissionGroups,
  permissions,
  staff,
  staffPermissions,
  userProfiles,
} from "@visyx/db/schema";
import { createClient } from "@visyx/supabase/job";
import { and, desc, eq, ilike, isNull, or } from "drizzle-orm";
import type {
  ApplyGroupInput,
  BulkUpdatePermissionsInput,
  CreatePermissionGroupInput,
  GrantPermissionInput,
  InviteStaffInput,
  ListPermissionGroupsInput,
  ListStaffInput,
  RevokePermissionInput,
  UpdatePermissionGroupInput,
  UpdateStaffInput,
} from "./schemas";

// Initialize Supabase Admin Client using the shared workspace package
const supabaseAdmin = createClient();

export class StaffService {
  // ─────────────────────────────────────────────────────────────────────────────
  // CORE STAFF MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async inviteStaff(
    input: InviteStaffInput,
    inviterUserId: string,
    isSuperuser: boolean,
  ) {
    const normalizedEmail = input.email.trim().toLowerCase();

    if (!isSuperuser && input.startingPermissionGroupId) {
      // Basic check, though usually `isAdmin` is not set here explicitly.
      // But we enforcing only superuser can create true `isAdmin` is handled later.
    }

    // Prevent duplicate invites / account creation
    const [existingProfile] = await db
      .select({ userId: userProfiles.userId })
      .from(userProfiles)
      .where(eq(userProfiles.email, normalizedEmail))
      .limit(1);

    if (existingProfile) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A user with this email already exists.",
      });
    }

    // 1. Call Supabase Admin Create User API (silent creation)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: authError?.message || "Failed to create user in Supabase",
      });
    }

    const newUserId = authData.user.id;

    // 2. Wrap app-level creation in a DB transaction
    try {
      await db.transaction(async (tx) => {
        // Create user_profiles record
        await tx.insert(userProfiles).values({
          userId: newUserId,
          email: normalizedEmail,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          isActive: true,
          // isSuperuser is always false via invite
        });

        // Create staff record
        const [newStaff] = await tx
          .insert(staff)
          .values({
            userId: newUserId,
            primaryBranchId: input.primaryBranchId ?? null,
            jobTitle: input.jobTitle ?? null,
            isAdmin: false, // Never grant isAdmin on invite unless requested by superuser (future feature)
            isActive: true,
          })
          .returning();

        // Apply initial permission group if provided
        if (input.startingPermissionGroupId) {
          const groupItems = await tx
            .select({ permissionId: permissionGroupItems.permissionId })
            .from(permissionGroupItems)
            .where(
              eq(permissionGroupItems.groupId, input.startingPermissionGroupId),
            );

          if (groupItems.length > 0) {
            const staffPermsToInsert = groupItems.map((item) => ({
              staffId: newStaff!.id,
              permissionId: item.permissionId,
              branchId: input.primaryBranchId ?? null, // Default scope to their primary branch
              granted: true,
              appliedFromGroupId: input.startingPermissionGroupId, // Track origin
              grantedById: inviterUserId,
            }));

            await tx.insert(staffPermissions).values(staffPermsToInsert);
          }
        }
      });
    } catch (err) {
      // If the app-level transaction fails, delete the Supabase auth user we just created,
      // to avoid leaving an orphaned login.
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
      } catch {
        // Swallow rollback errors; original error is more important.
      }
      throw err;
    }

    // 3. Send custom welcome email via locally linked @visyx/email
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://app.visyx.co.ke";
      const loginLink = `${appUrl}/auth/sign-in`;

      const html = await render(
        React.createElement(InviteEmail, {
          invitedByName: "Administrator",
          appName: "Visyx",
          email: normalizedEmail,
          inviteLink: loginLink,
        })
      );

      await sendEmail({
        to: normalizedEmail,
        subject: "Welcome to Visyx - Account Created",
        html,
      });
    } catch (emailErr) {
      // Log but don't fail the request if the email fails (e.g. absent RESEND_API_KEY)
      console.error("Failed to send welcome email:", emailErr);
    }

    return { id: newUserId, email: normalizedEmail };
  }

  async getStaffList(input: ListStaffInput) {
    const query = db
      .select({
        id: staff.id,
        userId: staff.userId,
        jobTitle: staff.jobTitle,
        isAdmin: staff.isAdmin,
        isActive: staff.isActive,
        primaryBranchId: staff.primaryBranchId,
        primaryBranchName: branches.name,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
        phone: userProfiles.phone,
      })
      .from(staff)
      .innerJoin(userProfiles, eq(staff.userId, userProfiles.userId))
      .leftJoin(branches, eq(staff.primaryBranchId, branches.id))
      .orderBy(desc(staff.createdAt));

    const conditions = [];

    if (!input.includeInactive) {
      conditions.push(eq(staff.isActive, true));
    }

    if (input.branchId) {
      conditions.push(eq(staff.primaryBranchId, input.branchId));
    }

    if (input.search) {
      const searchPattern = `%${input.search}%`;
      conditions.push(
        or(
          ilike(userProfiles.firstName, searchPattern),
          ilike(userProfiles.lastName, searchPattern),
          ilike(userProfiles.email, searchPattern),
        ),
      );
    }

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    query.limit(input.limit ?? 50).offset(input.offset ?? 0);

    return await query;
  }

  async getStaffById(id: number) {
    // 1. Fetch Staff Profile
    const [staffData] = await db
      .select({
        id: staff.id,
        userId: staff.userId,
        jobTitle: staff.jobTitle,
        isAdmin: staff.isAdmin,
        isActive: staff.isActive,
        primaryBranchId: staff.primaryBranchId,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
        phone: userProfiles.phone,
      })
      .from(staff)
      .innerJoin(userProfiles, eq(staff.userId, userProfiles.userId))
      .where(eq(staff.id, id))
      .limit(1);

    if (!staffData) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
    }

    // 2. Fetch their explicit permissions
    const permsRows = await db
      .select({
        id: staffPermissions.id,
        permissionId: staffPermissions.permissionId,
        permissionKey: permissions.key,
        permissionLabel: permissions.label,
        module: permissions.module,
        branchId: staffPermissions.branchId,
        branchName: branches.name,
        granted: staffPermissions.granted,
        appliedFromGroupId: staffPermissions.appliedFromGroupId,
        groupName: permissionGroups.name,
      })
      .from(staffPermissions)
      .innerJoin(permissions, eq(staffPermissions.permissionId, permissions.id))
      .leftJoin(branches, eq(staffPermissions.branchId, branches.id))
      .leftJoin(
        permissionGroups,
        eq(staffPermissions.appliedFromGroupId, permissionGroups.id),
      )
      .where(eq(staffPermissions.staffId, id));

    return {
      ...staffData,
      permissions: permsRows,
    };
  }

  async updateStaffProfile(
    input: UpdateStaffInput,
    updaterIsSuperuser: boolean,
    updaterStaffId?: number,
  ) {
    // Enforce: Only superusers can set someone to isAdmin
    // Enforce: Staff cannot modify their own isAdmin status
    if (input.isAdmin !== undefined) {
      if (!updaterIsSuperuser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only superusers can grant or revoke staff Admin rights.",
        });
      }
      if (updaterStaffId === input.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own Admin status.",
        });
      }
    }

    const [updatedStaff] = await db.transaction(async (tx) => {
      // Update staff record
      const [staffRecord] = await tx
        .update(staff)
        .set({
          jobTitle: input.jobTitle,
          primaryBranchId: input.primaryBranchId,
          ...(input.isAdmin !== undefined && { isAdmin: input.isAdmin }),
          updatedAt: new Date(),
        })
        .where(eq(staff.id, input.id))
        .returning();

      if (!staffRecord) return [];

      // Update user_profiles record
      if (
        input.firstName !== undefined ||
        input.lastName !== undefined ||
        input.phone !== undefined
      ) {
        await tx
          .update(userProfiles)
          .set({
            ...(input.firstName !== undefined && {
              firstName: input.firstName,
            }),
            ...(input.lastName !== undefined && { lastName: input.lastName }),
            ...(input.phone !== undefined && { phone: input.phone }),
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, staffRecord.userId));
      }

      return [staffRecord];
    });

    if (!updatedStaff) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
    }

    return updatedStaff;
  }

  async deactivateStaff(id: number, updaterStaffId?: number) {
    if (updaterStaffId === id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot deactivate your own account.",
      });
    }

    const [staffRecord] = await db
      .update(staff)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();

    if (!staffRecord) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
    }

    // Keep user_profiles in sync
    await db
      .update(userProfiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(userProfiles.userId, staffRecord.userId));

    // Disable in Supabase Auth to prevent logins entirely
    await supabaseAdmin.auth.admin.updateUserById(staffRecord.userId, {
      ban_duration: "876000h", // Ban for 100 years essentially to disable
    });

    return staffRecord;
  }

  async reactivateStaff(id: number, updaterStaffId?: number) {
    if (updaterStaffId === id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot reactivate your own account.",
      });
    }

    const [staffRecord] = await db
      .update(staff)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();

    if (!staffRecord) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });
    }

    // Keep user_profiles in sync
    await db
      .update(userProfiles)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(userProfiles.userId, staffRecord.userId));

    // Re-enable in Supabase Auth by removing the ban_duration
    await supabaseAdmin.auth.admin.updateUserById(staffRecord.userId, {
      ban_duration: "none",
    });

    return staffRecord;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PERMISSION ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async grantPermission(
    input: GrantPermissionInput,
    granterUserId: string,
    granterStaffId?: number,
  ) {
    if (granterStaffId === input.staffId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot modify your own permissions.",
      });
    }

    const [result] = await db
      .insert(staffPermissions)
      .values({
        staffId: input.staffId,
        permissionId: input.permissionId,
        branchId: input.branchId ?? null,
        granted: true,
        grantedById: granterUserId,
      })
      .onConflictDoUpdate({
        target: [
          staffPermissions.staffId,
          staffPermissions.permissionId,
          staffPermissions.branchId,
        ],
        set: {
          granted: true,
          grantedById: granterUserId,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result;
  }

  async revokePermission(
    input: RevokePermissionInput,
    revokerUserId: string,
    revokerStaffId?: number,
  ) {
    if (revokerStaffId === input.staffId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot modify your own permissions.",
      });
    }

    const [result] = await db
      .update(staffPermissions)
      .set({
        granted: false, // explicitly revoke
        grantedById: revokerUserId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(staffPermissions.staffId, input.staffId),
          eq(staffPermissions.permissionId, input.permissionId),
          input.branchId
            ? eq(staffPermissions.branchId, input.branchId)
            : isNull(staffPermissions.branchId),
        ),
      )
      .returning();

    // If there was no row, create an explicitly revoked row
    if (!result) {
      const [newRow] = await db
        .insert(staffPermissions)
        .values({
          staffId: input.staffId,
          permissionId: input.permissionId,
          branchId: input.branchId ?? null,
          granted: false, // Explicitly revoked
          grantedById: revokerUserId,
        })
        .returning();
      return newRow;
    }

    return result;
  }

  async applyPermissionGroup(
    input: ApplyGroupInput,
    applierUserId: string,
    applierStaffId?: number,
  ) {
    if (applierStaffId === input.staffId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot assign yourself permission groups.",
      });
    }

    const groupItems = await db
      .select({ permissionId: permissionGroupItems.permissionId })
      .from(permissionGroupItems)
      .where(eq(permissionGroupItems.groupId, input.groupId));

    if (groupItems.length === 0) return [];

    const toInsert = groupItems.map((item) => ({
      staffId: input.staffId,
      permissionId: item.permissionId,
      branchId: input.branchId ?? null,
      granted: true,
      appliedFromGroupId: input.groupId,
      grantedById: applierUserId,
    }));

    return db.transaction(async (tx) => {
      const results = [];
      for (const vals of toInsert) {
        const [row] = await tx
          .insert(staffPermissions)
          .values(vals)
          .onConflictDoUpdate({
            // Since Drizzle handles nullsNotDistinct via an untyped constraint name natively in PG15+,
            // the onConflictDoUpdate may fail if targeting branchId null unless we have a specific constraint name.
            // Using standard constraints target works.
            target: [
              staffPermissions.staffId,
              staffPermissions.permissionId,
              staffPermissions.branchId,
            ],
            set: {
              granted: true,
              appliedFromGroupId: vals.appliedFromGroupId,
              grantedById: vals.grantedById,
              updatedAt: new Date(),
            },
          })
          .returning();
        results.push(row);
      }
      return results;
    });
  }

  async bulkUpdatePermissions(
    input: BulkUpdatePermissionsInput,
    updaterUserId: string,
    updaterStaffId?: number,
  ) {
    if (updaterStaffId === input.staffId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot modify your own permissions.",
      });
    }

    return db.transaction(async (tx) => {
      const results = [];
      for (const p of input.permissions) {
        const [row] = await tx
          .insert(staffPermissions)
          .values({
            staffId: input.staffId,
            permissionId: p.permissionId,
            branchId: p.branchId ?? null,
            granted: p.granted,
            grantedById: updaterUserId,
          })
          .onConflictDoUpdate({
            target: [
              staffPermissions.staffId,
              staffPermissions.permissionId,
              staffPermissions.branchId,
            ],
            set: {
              granted: p.granted,
              grantedById: updaterUserId,
              updatedAt: new Date(),
            },
          })
          .returning();
        results.push(row);
      }
      return results;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PERMISSION GROUP (TEMPLATE) MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async createPermissionGroup(input: CreatePermissionGroupInput) {
    return db.transaction(async (tx) => {
      const [newGroup] = await tx
        .insert(permissionGroups)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning();

      if (input.permissionIds && input.permissionIds.length > 0) {
        const items = input.permissionIds.map((pid) => ({
          groupId: newGroup!.id,
          permissionId: pid,
        }));
        await tx.insert(permissionGroupItems).values(items);
      }

      return newGroup;
    });
  }

  async updatePermissionGroup(input: UpdatePermissionGroupInput) {
    return db.transaction(async (tx) => {
      const [updatedGroup] = await tx
        .update(permissionGroups)
        .set({
          name: input.name,
          description: input.description,
          isActive: input.isActive,
          updatedAt: new Date(),
        })
        .where(eq(permissionGroups.id, input.id))
        .returning();

      if (!updatedGroup) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }

      // If we provided permission IDs, replace the group items
      if (input.permissionIds) {
        await tx
          .delete(permissionGroupItems)
          .where(eq(permissionGroupItems.groupId, input.id));

        if (input.permissionIds.length > 0) {
          const items = input.permissionIds.map((pid) => ({
            groupId: input.id,
            permissionId: pid,
          }));
          await tx.insert(permissionGroupItems).values(items);
        }
      }

      return updatedGroup;
    });
  }

  async getPermissionGroup(id: number) {
    const [group] = await db
      .select()
      .from(permissionGroups)
      .where(eq(permissionGroups.id, id))
      .limit(1);

    if (!group) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
    }

    const items = await db
      .select({
        id: permissionGroupItems.id,
        permissionId: permissionGroupItems.permissionId,
        key: permissions.key,
        module: permissions.module,
        label: permissions.label,
      })
      .from(permissionGroupItems)
      .innerJoin(
        permissions,
        eq(permissionGroupItems.permissionId, permissions.id),
      )
      .where(eq(permissionGroupItems.groupId, id));

    return {
      ...group,
      items,
    };
  }

  async listPermissionGroups(input: ListPermissionGroupsInput) {
    const query = db
      .select()
      .from(permissionGroups)
      .orderBy(desc(permissionGroups.createdAt));

    if (!input.includeInactive) {
      query.where(eq(permissionGroups.isActive, true));
    }

    return await query;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RAW PERMISSIONS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────

  async listPermissions(input: { includeInactive?: boolean }) {
    const query = db
      .select()
      .from(permissions)
      .orderBy(permissions.module, permissions.key);

    if (!input.includeInactive) {
      query.where(eq(permissions.isActive, true));
    }

    return await query;
  }
}

export const staffService = new StaffService();
