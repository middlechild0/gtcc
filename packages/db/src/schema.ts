/**
 * Optical Clinic Management System — Database Schema
 * Drizzle ORM + PostgreSQL
 *
 * USER HIERARCHY:
 *   superuser (isSuperuser = true on userProfiles)
 *     └── Qualitech Labs developer accounts. Bypass all permission checks.
 *         Can access any clinic, manage system-level config.
 *
 *   isAdmin = true on staff
 *     └── Clinic-level system admin (owner/manager).
 *         Implicitly has all permissions within their clinic.
 *         Can manage staff and their permissions.
 *         Still scoped to their clinic — cannot touch other clinics.
 *
 *   normal staff
 *     └── Permission-based. Source of truth is staffPermissions table.
 *
 * PERMISSION SCOPING:
 *   staffPermissions.branchId = NULL  → permission applies to all branches
 *   staffPermissions.branchId = X     → permission scoped to branch X only
 *
 * PERMISSION GROUPS:
 *   Templates only. Assigning a group copies its permissions to the staff
 *   member's staffPermissions rows. After that, group and staff are independent.
 *   Changing a group later does NOT auto-update staff who were assigned from it.
 *
 * GRANTED FLAG:
 *   granted = true  → permission is active
 *   granted = false → permission is explicitly revoked (even if from a group)
 *   This lets you revoke a single permission from a template without chaos.
 */

import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// USER PROFILES
// Everyone in the system: staff, patients, superusers.
// Auth is in Supabase auth.users; user_id should match auth.users(id).
// ─────────────────────────────────────────────────────────────────────────────

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),

  /** Must match auth.users(id). One profile per auth user. */
  userId: uuid("user_id").notNull().unique(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  isSuperuser: boolean("is_superuser").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// BRANCHES
// Physical clinic locations. Permissions can be scoped per branch.
// ─────────────────────────────────────────────────────────────────────────────

export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),           // e.g. "Great Batian - Nyeri Town"
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS MASTER LIST
// Seeded once at deployment. Never created at runtime by users.
// Keys follow the format: module:action
// e.g. "patients:create", "billing:void_invoice", "inventory:manage_orders"
// ─────────────────────────────────────────────────────────────────────────────

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),  // e.g. "billing:create_invoice"
  module: text("module").notNull(),         // e.g. "billing"
  label: text("label").notNull(),          // Human-readable: "Create Invoice"
  description: text("description"),             // Tooltip/help text in the UI
  isActive: boolean("is_active").default(true).notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION GROUPS (Templates)
// Named presets like "Doctor Template", "Cashier Template".
// Assigning a group to a staff member is a one-time copy operation.
// The group and the staff member's permissions are independent after that.
// ─────────────────────────────────────────────────────────────────────────────

export const permissionGroups = pgTable("permission_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Doctor Template"
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Permissions that belong to a group/template
export const permissionGroupItems = pgTable("permission_group_items", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => permissionGroups.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => ({
  unq: unique().on(t.groupId, t.permissionId),
}));

// ─────────────────────────────────────────────────────────────────────────────
// STAFF
// A userProfile tagged as a staff member.
// isAdmin = true grants all permissions within the clinic implicitly.
// primaryBranchId is their home branch but does not restrict their access —
// access is controlled by staffPermissions.
// ─────────────────────────────────────────────────────────────────────────────

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  primaryBranchId: integer("primary_branch_id")
    .references(() => branches.id, { onDelete: "set null" }),
  jobTitle: text("job_title"),

  // Clinic-level system admin. Implicitly has all permissions.
  isAdmin: boolean("is_admin").default(false).notNull(),

  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// STAFF PERMISSIONS  ← SOURCE OF TRUTH FOR ACCESS CONTROL
//
// One row per (staff, permission, branch scope) combination.
//
// branchId = NULL  → applies to all branches
// branchId = X     → scoped to branch X only
//
// granted = true   → permission active
// granted = false  → explicitly revoked (overrides group inheritance)
//
// appliedFromGroupId → which template this was copied from (metadata only)
//                      NULL means it was granted manually
//
// ─────────────────────────────────────────────────────────────────────────────

export const staffPermissions = pgTable("staff_permissions", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),

  // NULL = all branches. A specific branchId scopes it to that branch only.
  branchId: integer("branch_id")
    .references(() => branches.id, { onDelete: "cascade" }),

  // false = explicitly revoked. Useful for removing one permission from a template.
  granted: boolean("granted").default(true).notNull(),

  // Which template was this copied from? NULL = manually granted.
  appliedFromGroupId: integer("applied_from_group_id")
    .references(() => permissionGroups.id, { onDelete: "set null" }),

  // Who granted or revoked this?
  grantedById: uuid("granted_by_id")
    .references(() => userProfiles.userId, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  // A staff member can only have one row per permission per branch scope.
  // PostgreSQL 15+ supports NULLS NOT DISTINCT which treats multiple NULL branchIds as violating the unique constraint.
  unq: unique().on(t.staffId, t.permissionId, t.branchId).nullsNotDistinct(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// Tracks all meaningful actions in the system.
// action format: "module:event" e.g. "billing:invoice_created", "staff:permission_granted"
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => userProfiles.userId, { onDelete: "set null" }),
  branchId: integer("branch_id")
    .references(() => branches.id, { onDelete: "set null" }),
  action: text("action").notNull(),      // e.g. "staff:permission_granted"
  entityType: text("entity_type"),           // e.g. "invoice", "patient", "staff"
  entityId: text("entity_id"),             // The ID of the affected record
  details: jsonb("details"),              // Snapshot of before/after or extra context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  staff: one(staff, { fields: [userProfiles.userId], references: [staff.userId] }),
  auditLogs: many(auditLogs),
}));

export const branchesRelations = relations(branches, ({ many }) => ({
  staff: many(staff),
  staffPermissions: many(staffPermissions),
  auditLogs: many(auditLogs),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  groupItems: many(permissionGroupItems),
  staffPermissions: many(staffPermissions),
}));

export const permissionGroupsRelations = relations(permissionGroups, ({ many }) => ({
  items: many(permissionGroupItems),
  staffPermissions: many(staffPermissions),
}));

export const permissionGroupItemsRelations = relations(permissionGroupItems, ({ one }) => ({
  group: one(permissionGroups, { fields: [permissionGroupItems.groupId], references: [permissionGroups.id] }),
  permission: one(permissions, { fields: [permissionGroupItems.permissionId], references: [permissions.id] }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(userProfiles, { fields: [staff.userId], references: [userProfiles.userId] }),
  primaryBranch: one(branches, { fields: [staff.primaryBranchId], references: [branches.id] }),
  permissions: many(staffPermissions),
}));

export const staffPermissionsRelations = relations(staffPermissions, ({ one }) => ({
  staff: one(staff, { fields: [staffPermissions.staffId], references: [staff.id] }),
  permission: one(permissions, { fields: [staffPermissions.permissionId], references: [permissions.id] }),
  branch: one(branches, { fields: [staffPermissions.branchId], references: [branches.id] }),
  appliedFromGroup: one(permissionGroups, { fields: [staffPermissions.appliedFromGroupId], references: [permissionGroups.id] }),
  grantedBy: one(userProfiles, { fields: [staffPermissions.grantedById], references: [userProfiles.userId] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(userProfiles, { fields: [auditLogs.userId], references: [userProfiles.userId] }),
  branch: one(branches, { fields: [auditLogs.branchId], references: [branches.id] }),
}));