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

import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  pgSequence,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────
export const genderEnum = pgEnum("gender_enum", ["MALE", "FEMALE", "OTHER"]);
export const maritalStatusEnum = pgEnum("marital_status_enum", [
  "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",
  "SEPARATED",
  "OTHER",
]);
export const bloodGroupEnum = pgEnum("blood_group_enum", [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "UNKNOWN",
]);

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
  code: text("code").notNull().unique(), // e.g. "NYR"
  name: text("name").notNull(), // e.g. "Great Batian - Nyeri Town"
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS
// Core patient records (non-staff). Separate from userProfiles so that
// patients do not need login accounts.
// ─────────────────────────────────────────────────────────────────────────────

export const patientNumberSeq = pgSequence("patient_number_seq", {
  startWith: 1,
  increment: 1,
});

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Unique human-readable id, e.g. PAT-000001 */
  patientNumber: text("patient_number").notNull().unique(),

  // Basic Information
  salutation: text("salutation"),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  maritalStatus: maritalStatusEnum("marital_status"),
  bloodGroup: bloodGroupEnum("blood_group"),

  // Contact & Address
  email: text("email"),
  phone: text("phone"),
  country: text("country").default("Kenya").notNull(),
  address: text("address"),

  // IDs
  passportNumber: text("passport_number"),
  nationalId: text("national_id").unique(),
  nhifNumber: text("nhif_number"),

  // Merge strategy
  mergedIntoId: uuid("merged_into_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT BRANCH PROFILES
// Links a patient to a branch. Solves "registered once but active in specific branches".
// ─────────────────────────────────────────────────────────────────────────────

export const patientBranchProfiles = pgTable(
  "patient_branch_profiles",
  {
    id: serial("id").primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    branchId: integer("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),

    // Indicates if this was the branch where the patient was originally registered
    isRegistrationBranch: boolean("is_registration_branch")
      .default(true)
      .notNull(),

    // Status of the patient within this specific branch context
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    unq: unique().on(t.patientId, t.branchId),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT KIN (Emergency Contact)
// ─────────────────────────────────────────────────────────────────────────────

export const patientKins = pgTable("patient_kins", {
  id: serial("id").primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),

  isPrimary: boolean("is_primary").default(false).notNull(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  relationship: text("relationship"),
  phone: text("phone"),
  email: text("email"),
  nationalId: text("national_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT GUARANTOR (Financial Contact)
// ─────────────────────────────────────────────────────────────────────────────

export const patientGuarantors = pgTable("patient_guarantors", {
  id: serial("id").primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),

  isPrimary: boolean("is_primary").default(false).notNull(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  relationship: text("relationship"),
  phone: text("phone"),
  email: text("email"),
  nationalId: text("national_id"),
  employer: text("employer"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INSURANCE PROVIDERS (Master List)
// ─────────────────────────────────────────────────────────────────────────────

export const insuranceProviders = pgTable("insurance_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT INSURANCES (Patient Policies)
// ─────────────────────────────────────────────────────────────────────────────

export const patientInsurances = pgTable("patient_insurances", {
  id: serial("id").primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  providerId: integer("provider_id")
    .notNull()
    .references(() => insuranceProviders.id, { onDelete: "cascade" }),

  memberNumber: text("member_number").notNull(),
  principalName: text("principal_name"), // If patient is a dependent
  principalRelationship: text("principal_relationship"),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: date("expires_at"),

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
  key: text("key").notNull().unique(), // e.g. "billing:create_invoice"
  module: text("module").notNull(), // e.g. "billing"
  label: text("label").notNull(), // Human-readable: "Create Invoice"
  description: text("description"), // Tooltip/help text in the UI
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
export const permissionGroupItems = pgTable(
  "permission_group_items",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => permissionGroups.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => ({
    unq: unique().on(t.groupId, t.permissionId),
  }),
);

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
  primaryBranchId: integer("primary_branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),
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

export const staffPermissions = pgTable(
  "staff_permissions",
  {
    id: serial("id").primaryKey(),
    staffId: integer("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    // NULL = all branches. A specific branchId scopes it to that branch only.
    branchId: integer("branch_id").references(() => branches.id, {
      onDelete: "cascade",
    }),

    // false = explicitly revoked. Useful for removing one permission from a template.
    granted: boolean("granted").default(true).notNull(),

    // Which template was this copied from? NULL = manually granted.
    appliedFromGroupId: integer("applied_from_group_id").references(
      () => permissionGroups.id,
      { onDelete: "set null" },
    ),

    // Who granted or revoked this?
    grantedById: uuid("granted_by_id").references(() => userProfiles.userId, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // A staff member can only have one row per permission per branch scope.
    // PostgreSQL 15+ supports NULLS NOT DISTINCT which treats multiple NULL branchIds as violating the unique constraint.
    unq: unique().on(t.staffId, t.permissionId, t.branchId).nullsNotDistinct(),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// Tracks all meaningful actions in the system.
// action format: "module:event" e.g. "billing:invoice_created", "staff:permission_granted"
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => userProfiles.userId, {
    onDelete: "set null",
  }),
  branchId: integer("branch_id").references(() => branches.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(), // e.g. "staff:permission_granted"
  entityType: text("entity_type"), // e.g. "invoice", "patient", "staff"
  entityId: text("entity_id"), // The ID of the affected record
  details: jsonb("details"), // Snapshot of before/after or extra context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const userProfilesRelations = relations(
  userProfiles,
  ({ one, many }) => ({
    staff: one(staff, {
      fields: [userProfiles.userId],
      references: [staff.userId],
    }),
    auditLogs: many(auditLogs),
  }),
);

export const branchesRelations = relations(branches, ({ many }) => ({
  staff: many(staff),
  staffPermissions: many(staffPermissions),
  auditLogs: many(auditLogs),
  patientProfiles: many(patientBranchProfiles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  groupItems: many(permissionGroupItems),
  staffPermissions: many(staffPermissions),
}));

export const permissionGroupsRelations = relations(
  permissionGroups,
  ({ many }) => ({
    items: many(permissionGroupItems),
    staffPermissions: many(staffPermissions),
  }),
);

export const permissionGroupItemsRelations = relations(
  permissionGroupItems,
  ({ one }) => ({
    group: one(permissionGroups, {
      fields: [permissionGroupItems.groupId],
      references: [permissionGroups.id],
    }),
    permission: one(permissions, {
      fields: [permissionGroupItems.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const staffRelations = relations(staff, ({ one, many }) => ({
  user: one(userProfiles, {
    fields: [staff.userId],
    references: [userProfiles.userId],
  }),
  primaryBranch: one(branches, {
    fields: [staff.primaryBranchId],
    references: [branches.id],
  }),
  permissions: many(staffPermissions),
}));

export const staffPermissionsRelations = relations(
  staffPermissions,
  ({ one }) => ({
    staff: one(staff, {
      fields: [staffPermissions.staffId],
      references: [staff.id],
    }),
    permission: one(permissions, {
      fields: [staffPermissions.permissionId],
      references: [permissions.id],
    }),
    branch: one(branches, {
      fields: [staffPermissions.branchId],
      references: [branches.id],
    }),
    appliedFromGroup: one(permissionGroups, {
      fields: [staffPermissions.appliedFromGroupId],
      references: [permissionGroups.id],
    }),
    grantedBy: one(userProfiles, {
      fields: [staffPermissions.grantedById],
      references: [userProfiles.userId],
    }),
  }),
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(userProfiles, {
    fields: [auditLogs.userId],
    references: [userProfiles.userId],
  }),
  branch: one(branches, {
    fields: [auditLogs.branchId],
    references: [branches.id],
  }),
}));

export const patientsRelations = relations(patients, ({ many, one }) => ({
  branchProfiles: many(patientBranchProfiles),
  insurances: many(patientInsurances),
  kin: many(patientKins),
  guarantor: many(patientGuarantors),
  mergedInto: one(patients, {
    fields: [patients.mergedIntoId],
    references: [patients.id],
    relationName: "mergedInto",
  }),
  mergedFrom: many(patients, {
    relationName: "mergedInto",
  }),
}));

export const patientBranchProfilesRelations = relations(
  patientBranchProfiles,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientBranchProfiles.patientId],
      references: [patients.id],
    }),
    branch: one(branches, {
      fields: [patientBranchProfiles.branchId],
      references: [branches.id],
    }),
  }),
);

export const patientKinsRelations = relations(patientKins, ({ one }) => ({
  patient: one(patients, {
    fields: [patientKins.patientId],
    references: [patients.id],
  }),
}));

export const patientGuarantorsRelations = relations(
  patientGuarantors,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientGuarantors.patientId],
      references: [patients.id],
    }),
  }),
);

export const insuranceProvidersRelations = relations(
  insuranceProviders,
  ({ many }) => ({
    patientInsurances: many(patientInsurances),
  }),
);

export const patientInsurancesRelations = relations(
  patientInsurances,
  ({ one }) => ({
    patient: one(patients, {
      fields: [patientInsurances.patientId],
      references: [patients.id],
    }),
    provider: one(insuranceProviders, {
      fields: [patientInsurances.providerId],
      references: [insuranceProviders.id],
    }),
  }),
);
