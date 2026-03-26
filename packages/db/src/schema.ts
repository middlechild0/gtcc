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

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  uniqueIndex,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
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
  passportNumber: text("passport_number").unique(),
  nationalId: text("national_id").unique(),
  nhifNumber: text("nhif_number").unique(),

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
// CATALOG (Services & Products)
// ─────────────────────────────────────────────────────────────────────────────

export const serviceCategoryEnum = pgEnum("service_category", [
  "CONSULTATION",
  "DIAGNOSTIC",
  "OPTICAL",
  "PROCEDURE",
  "OTHER",
]);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "General Eye Examination"
  category: serviceCategoryEnum("category").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  vatExempt: boolean("vat_exempt").default(true).notNull(), // Most medical services are VAT exempt
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productCategoryEnum = pgEnum("product_category", [
  "FRAME",
  "LENS",
  "CONTACT_LENS",
  "ACCESSORY",
  "MEDICATION",
  "CONSUMABLE",
  "OTHER",
]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Ray-Ban Aviator RB3025"
  sku: text("sku").unique(),
  category: productCategoryEnum("category").notNull(),
  description: text("description"),

  // Basic Inventory Tracking (to be expanded later)
  stockLevel: integer("stock_level").default(0).notNull(),
  reorderPoint: integer("reorder_point").default(0).notNull(),
  // supplierId: integer("supplier_id").references(() => suppliers.id), // Future relation

  isActive: boolean("is_active").default(true).notNull(),
  vatExempt: boolean("vat_exempt").default(false).notNull(), // Most physical products are VAT applicable
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billableItemTypeEnum = pgEnum("billable_item_type", [
  "SERVICE",
  "PRODUCT",
]);

export const billableItems = pgTable(
  "billable_items",
  {
    id: serial("id").primaryKey(),
    type: billableItemTypeEnum("type").notNull(),
    serviceId: integer("service_id").references(() => services.id, {
      onDelete: "cascade",
    }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),

    // Denormalized for rapid invoice display/search
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // Enforce exclusive arc (polymorphism constraint)
    // A billable item must be EXACTLY ONE of either a Service or a Product
    validType: check(
      "valid_billable_item",
      sql`num_nonnulls(${t.serviceId}, ${t.productId}) = 1`,
    ),
  }),
);

// ─────────────────────────────────────────────────────────────────────────────
// PRICING (Price Books & Entries)
// ─────────────────────────────────────────────────────────────────────────────

export const priceBookTypeEnum = pgEnum("price_book_type", [
  "CASH",
  "INSURANCE",
  "CORPORATE",
]);

export const priceBooks = pgTable("price_books", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Standard Cash 2026", "Jubilee Insurance"
  type: priceBookTypeEnum("type").notNull(),

  // Scoping
  branchId: integer("branch_id").references(() => branches.id, {
    onDelete: "cascade",
  }),
  insuranceProviderId: integer("insurance_provider_id").references(
    () => insuranceProviders.id,
    { onDelete: "cascade" },
  ),

  isActive: boolean("is_active").default(true).notNull(),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceBookEntries = pgTable(
  "price_book_entries",
  {
    id: serial("id").primaryKey(),
    priceBookId: integer("price_book_id")
      .notNull()
      .references(() => priceBooks.id, { onDelete: "cascade" }),
    billableItemId: integer("billable_item_id")
      .notNull()
      .references(() => billableItems.id, { onDelete: "cascade" }),

    price: integer("price").notNull(), // Exact price for this item in this book

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    // An item can only have one explicit price per book
    unq: unique().on(t.priceBookId, t.billableItemId),
  }),
);

export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Standard VAT (16%)"
  rate: integer("rate").notNull(), // e.g. 16 for 16% to avoid floating point issues
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// QUEUE & VISIT TYPES (Dynamic Routing Configurations)
// ─────────────────────────────────────────────────────────────────────────────

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Reception", "Triage", "Doctor"
  code: text("code").notNull().unique(), // e.g., "RECEPTION", "DOCTOR", "OPTICIAN"
  isActive: boolean("is_active").default(true).notNull(),
});

export const visitTypes = pgTable("visit_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Complete Eye Exam", "Frame Repair"
  workflowSteps: jsonb("workflow_steps").notNull(), // e.g. ["RECEPTION", "TRIAGE", "DOCTOR", "OPTICIAN", "CASHIER"]
  defaultServiceId: integer("default_service_id").references(() => services.id), // Used for auto-billing
  isActive: boolean("is_active").default(true).notNull(),
},
(t) => ({
  nameNormalizedUnq: uniqueIndex("visit_types_name_normalized_unq").on(
    sql`lower(trim(${t.name}))`,
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// VISITS (The Queue)
// ─────────────────────────────────────────────────────────────────────────────

export const visitPriorityEnum = pgEnum("visit_priority", ["NORMAL", "URGENT"]);
export const visitStatusEnum = pgEnum("visit_status", [
  "WAITING",
  "IN_PROGRESS",
  "DONE",
  "ON_HOLD",
]);
export const paymentModeEnum = pgEnum("payment_mode", [
  "CASH",
  "MPESA",
  "INSURANCE",
  "CARD",
]);
export const payerTypeEnum = pgEnum("payer_type", [
  "CASH",
  "INSURANCE",
  "CORPORATE",
]);

export const visits = pgTable("visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patients.id, { onDelete: "cascade" }),
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id, { onDelete: "cascade" }),
  visitTypeId: integer("visit_type_id")
    .notNull()
    .references(() => visitTypes.id),

  // Pricing & Payer Info (Set at startVisit)
  payerType: payerTypeEnum("payer_type").default("CASH").notNull(),
  priceBookId: integer("price_book_id").references(() => priceBooks.id),

  ticketNumber: text("ticket_number").notNull(),
  priority: visitPriorityEnum("priority").default("NORMAL").notNull(),

  // Current Location in the clinic
  currentDepartmentId: integer("current_department_id")
    .notNull()
    .references(() => departments.id),
  status: visitStatusEnum("status").default("WAITING").notNull(),

  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL RECORDS (Invoices & Payments)
// ─────────────────────────────────────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "ISSUED",
  "PAID",
  "VOIDED",
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  totalAmount: integer("total_amount").default(0).notNull(),
  amountPaid: integer("amount_paid").default(0).notNull(),
  status: invoiceStatusEnum("status").default("DRAFT").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),

  // The catalog item being billed
  billableItemId: integer("billable_item_id")
    .notNull()
    .references(() => billableItems.id),
  description: text("description").notNull(), // Copied at time of billing for immutable records

  // Financial breakdown
  unitPrice: integer("unit_price").notNull(), // From price book explicitly
  quantity: integer("quantity").default(1).notNull(),
  subtotal: integer("subtotal").notNull(), // unitPrice * quantity
  vatAmount: integer("vat_amount").default(0).notNull(), // Calculated based on exact tax rate at time of billing
  total: integer("total").notNull(), // subtotal + vatAmount

  isOverridden: boolean("is_overridden").default(false).notNull(),
  departmentSource: text("department_source"), // Internal reference for reporting where the charge came from

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const overrideReasonEnum = pgEnum("override_reason", [
  "INSURANCE_NEGOTIATED_RATE",
  "CORPORATE_AGREEMENT",
  "DOCTOR_DISCRETION",
  "CORRECTION",
  "MANAGEMENT_APPROVAL",
  "OTHER",
]);

export const invoiceLineItemOverrides = pgTable("invoice_line_item_overrides", {
  id: uuid("id").defaultRandom().primaryKey(),
  lineItemId: integer("line_item_id")
    .notNull()
    .references(() => invoiceLineItems.id, { onDelete: "cascade" }),

  originalPrice: integer("original_price").notNull(),
  newPrice: integer("new_price").notNull(),

  reason: overrideReasonEnum("reason").notNull(),
  note: text("note"),

  // Audit Trail
  changedById: uuid("changed_by_id")
    .notNull()
    .references(() => userProfiles.userId),
  approvedById: uuid("approved_by_id").references(() => userProfiles.userId), // For high-value overrides requiring a manager

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paymentMode: paymentModeEnum("payment_mode").notNull(),
  receiptNumber: text("receipt_number"), // e.g. Mpesa Transaction ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL RECORDS (Children of Visits)
// ─────────────────────────────────────────────────────────────────────────────

export const preTests = pgTable("pre_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .unique()
    .references(() => visits.id, { onDelete: "cascade" }),
  // Using uuid referencing userProfiles instead of staff id for easier auth access
  // if standard technicians are doing triage
  performedById: uuid("performed_by_id").references(() => userProfiles.userId),
  autoRefractionData: jsonb("auto_refraction_data"),
  intraOcularPressure: jsonb("intra_ocular_pressure"),
  visualAcuity: jsonb("visual_acuity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Note: `assigned_doctor_id` is linked here so it accurately states which
 * doctor saw the patient in the consultation room.
 */
export const consultations = pgTable("consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .unique()
    .references(() => visits.id, { onDelete: "cascade" }),
  assignedDoctorId: uuid("assigned_doctor_id").references(
    () => userProfiles.userId,
  ),
  chiefComplaint: text("chief_complaint"),
  clinicalNotes: text("clinical_notes"),
  diagnosis: text("diagnosis"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const opticalPrescriptions = pgTable("optical_prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  // Right Eye
  odSphere: text("od_sphere"),
  odCylinder: text("od_cylinder"),
  odAxis: text("od_axis"),
  // Left Eye
  osSphere: text("os_sphere"),
  osCylinder: text("os_cylinder"),
  osAxis: text("os_axis"),
  pupillaryDistance: text("pupillary_distance"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contactLensFittings = pgTable("contact_lens_fittings", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  baseCurve: text("base_curve"),
  diameter: text("diameter"),
  brand: text("brand"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING_LAB",
  "IN_LAB",
  "READY_FOR_COLLECTION",
  "DISPATCHED",
]);

export const dispensingOrders = pgTable("dispensing_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .unique()
    .references(() => visits.id, { onDelete: "cascade" }),
  assignedOpticianId: uuid("assigned_optician_id").references(
    () => userProfiles.userId,
  ),
  lensType: text("lens_type"),
  frameModel: text("frame_model"),
  isExternalRx: boolean("is_external_rx").default(false).notNull(),
  status: orderStatusEnum("status").default("PENDING_LAB").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const repairs = pgTable("repairs", {
  id: uuid("id").defaultRandom().primaryKey(),
  visitId: uuid("visit_id")
    .notNull()
    .unique()
    .references(() => visits.id, { onDelete: "cascade" }),
  issueDescription: text("issue_description"),
  partsReplaced: text("parts_replaced"),
  costEstimate: integer("cost_estimate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const departmentsRelations = relations(departments, ({ many }) => ({
  visits: many(visits),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  billableItem: one(billableItems, {
    fields: [services.id],
    references: [billableItems.serviceId],
  }),
  visitTypes: many(visitTypes),
}));

export const productsRelations = relations(products, ({ one }) => ({
  billableItem: one(billableItems, {
    fields: [products.id],
    references: [billableItems.productId],
  }),
}));

export const billableItemsRelations = relations(
  billableItems,
  ({ one, many }) => ({
    service: one(services, {
      fields: [billableItems.serviceId],
      references: [services.id],
    }),
    product: one(products, {
      fields: [billableItems.productId],
      references: [products.id],
    }),
    priceBookEntries: many(priceBookEntries),
  }),
);

export const priceBooksRelations = relations(priceBooks, ({ one, many }) => ({
  branch: one(branches, {
    fields: [priceBooks.branchId],
    references: [branches.id],
  }),
  insuranceProvider: one(insuranceProviders, {
    fields: [priceBooks.insuranceProviderId],
    references: [insuranceProviders.id],
  }),
  entries: many(priceBookEntries),
}));

export const priceBookEntriesRelations = relations(
  priceBookEntries,
  ({ one }) => ({
    priceBook: one(priceBooks, {
      fields: [priceBookEntries.priceBookId],
      references: [priceBooks.id],
    }),
    billableItem: one(billableItems, {
      fields: [priceBookEntries.billableItemId],
      references: [billableItems.id],
    }),
  }),
);

export const visitTypesRelations = relations(visitTypes, ({ one, many }) => ({
  visits: many(visits),
  defaultService: one(services, {
    fields: [visitTypes.defaultServiceId],
    references: [services.id],
  }),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  branch: one(branches, {
    fields: [visits.branchId],
    references: [branches.id],
  }),
  visitType: one(visitTypes, {
    fields: [visits.visitTypeId],
    references: [visitTypes.id],
  }),
  currentDepartment: one(departments, {
    fields: [visits.currentDepartmentId],
    references: [departments.id],
  }),
  invoice: one(invoices, {
    fields: [visits.id],
    references: [invoices.visitId],
  }),
  priceBook: one(priceBooks, {
    fields: [visits.priceBookId],
    references: [priceBooks.id],
  }),
  preTest: one(preTests, {
    fields: [visits.id],
    references: [preTests.visitId],
  }),
  consultation: one(consultations, {
    fields: [visits.id],
    references: [consultations.visitId],
  }),
  opticalPrescriptions: many(opticalPrescriptions),
  contactLensFittings: many(contactLensFittings),
  dispensingOrder: one(dispensingOrders, {
    fields: [visits.id],
    references: [dispensingOrders.visitId],
  }),
  repair: one(repairs, {
    fields: [visits.id],
    references: [repairs.visitId],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  visit: one(visits, {
    fields: [invoices.visitId],
    references: [visits.id],
  }),
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one, many }) => ({
    invoice: one(invoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [invoices.id],
    }),
    billableItem: one(billableItems, {
      fields: [invoiceLineItems.billableItemId],
      references: [billableItems.id],
    }),
    overrides: many(invoiceLineItemOverrides),
  }),
);

export const invoiceLineItemOverridesRelations = relations(
  invoiceLineItemOverrides,
  ({ one }) => ({
    lineItem: one(invoiceLineItems, {
      fields: [invoiceLineItemOverrides.lineItemId],
      references: [invoiceLineItems.id],
    }),
    changedBy: one(userProfiles, {
      fields: [invoiceLineItemOverrides.changedById],
      references: [userProfiles.userId],
    }),
    approvedBy: one(userProfiles, {
      fields: [invoiceLineItemOverrides.approvedById],
      references: [userProfiles.userId],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const preTestsRelations = relations(preTests, ({ one }) => ({
  visit: one(visits, {
    fields: [preTests.visitId],
    references: [visits.id],
  }),
  performedBy: one(userProfiles, {
    fields: [preTests.performedById],
    references: [userProfiles.userId],
  }),
}));

export const consultationsRelations = relations(consultations, ({ one }) => ({
  visit: one(visits, {
    fields: [consultations.visitId],
    references: [visits.id],
  }),
  assignedDoctor: one(userProfiles, {
    fields: [consultations.assignedDoctorId],
    references: [userProfiles.userId],
  }),
}));

export const opticalPrescriptionsRelations = relations(
  opticalPrescriptions,
  ({ one }) => ({
    visit: one(visits, {
      fields: [opticalPrescriptions.visitId],
      references: [visits.id],
    }),
  }),
);

export const contactLensFittingsRelations = relations(
  contactLensFittings,
  ({ one }) => ({
    visit: one(visits, {
      fields: [contactLensFittings.visitId],
      references: [visits.id],
    }),
  }),
);

export const dispensingOrdersRelations = relations(
  dispensingOrders,
  ({ one }) => ({
    visit: one(visits, {
      fields: [dispensingOrders.visitId],
      references: [visits.id],
    }),
    assignedOptician: one(userProfiles, {
      fields: [dispensingOrders.assignedOpticianId],
      references: [userProfiles.userId],
    }),
  }),
);

export const repairsRelations = relations(repairs, ({ one }) => ({
  visit: one(visits, {
    fields: [repairs.visitId],
    references: [visits.id],
  }),
}));

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
  visits: many(visits),
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
