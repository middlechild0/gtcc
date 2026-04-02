# Visyx — Optical Clinic Management System — Complete Overview

**Status**: Implemented end-to-end (DB → API → Web UI with realtime) but not load/edge-case tested.  
**Stack**: Bun · Hono · tRPC · Next.js App Router · Drizzle ORM · PostgreSQL · Supabase Auth  
**Generated**: April 2, 2026

---

## 1. Routes Available (Web App Navigation)

### 1.1 Main Navigation (Sidebar)

**Dashboard Sidebar** displays these main items (permission-gated):

| Route | Path | Permission Required | Description |
|-------|------|---------------------|-------------|
| Dashboard | `/dashboard` | None | Home page, placeholder for overview/metrics |
| Patients | `/dashboard/patients` | `patients:view` | List all patients, search, view history |
| New Patient | `/dashboard/patients/new` | `patients:create` | Register a new patient |
| Patient Detail | `/dashboard/patients/[id]` | `patients:view` | View/edit patient profile, KPIs |
| Patient Edit | `/dashboard/patients/[id]/edit` | `patients:edit` | Edit patient demographics, insurance, contacts |
| Live Queue | `/dashboard/queue` | `queue:view` | Global overview of all departments + live waitlist |
| Department Queue | `/dashboard/queue/[id]` | `queue:view` | Drill-down into specific department queue |
| Billing | `/dashboard/billing` | `billing:view_invoices` | List issued invoices, record payments |

### 1.2 Settings Pages (Collapsible Menu)

All settings are under `/dashboard/settings/` and shown in top-nav search + settings dropdown:

| Route | Path | Permission Required | Description |
|-------|------|---------------------|-------------|
| My Account | `/dashboard/settings/account` | Authenticated | Change name, email, password |
| User Administration | `/dashboard/settings/user-administration` | `auth:manage_staff` | List, invite, edit staff members |
| Invite User | `/dashboard/settings/user-administration/invite` | `auth:manage_staff` | Send staff invite with email |
| User Detail | `/dashboard/settings/user-administration/[id]` | `auth:manage_staff` | Edit staff job title, branches, permissions |
| Permission Groups | `/dashboard/settings/user-administration/permission-groups` | `auth:manage_permission_groups` | Manage permission templates (Doctor, Cashier, etc.) |
| Branches | `/dashboard/settings/branches` | `branches:view` | List clinic branches |
| New Branch | `/dashboard/settings/branches/new` | `branches:manage` | Create a new clinic location |
| Branch Detail | `/dashboard/settings/branches/[id]` | `branches:view` | View/edit branch info (address, phone, etc.) |
| Workflow Configuration | `/dashboard/settings/workflow` | `queue:configure_workflows` | Manage departments and visit types (workflows) |
| Insurance Providers | `/dashboard/settings/insurance-providers` | `billing:manage_insurance_providers` | Add insurance companies, schemes, copays |
| Tax Rates | `/dashboard/settings/pricing/tax-rates` | `pricing:manage` | Configure VAT rates |
| Price Books & Catalog | `/dashboard/settings/pricing/catalog` | `pricing:manage` | Set prices for services and products |

### 1.3 Authentication Pages (Public)

| Route | Path | Purpose |
|-------|------|---------|
| Sign In | `/auth/sign-in` | Email code (passwordless) or password login |
| Verify Code | `/auth/verify-code` | OTP verification for passwordless auth |
| Forgot Password | `/auth/forgot-password` | Password reset flow |
| Update Password | `/auth/update-password` | Change password after reset |

### 1.4 Page Route Structure

All page routes follow Next.js App Router conventions:

```
apps/web/src/app/
├── page.tsx                                 # Home / redirect likely
├── layout.tsx                               # Root layout
├── auth/
│   ├── sign-in/page.tsx
│   ├── verify-code/page.tsx
│   ├── forgot-password/page.tsx
│   └── update-password/page.tsx
└── (dashboard)/
    ├── layout.tsx                           # Sidebar + Top Nav + Auth Gates
    └── dashboard/
        ├── page.tsx                         # Main dashboard
        ├── queue/page.tsx                   # Global overview
        ├── queue/[id]/page.tsx              # Department-specific queue
        ├── patients/page.tsx                # Patients list
        ├── patients/new/page.tsx            # New patient form
        ├── patients/[id]/page.tsx           # Patient profile
        ├── patients/[id]/edit/page.tsx      # Edit patient
        ├── billing/page.tsx                 # Billing dashboard
        └── settings/
            ├── account/page.tsx
            ├── user-administration/page.tsx
            ├── user-administration/[id]/page.tsx
            ├── user-administration/permission-groups/page.tsx
            ├── branches/ [multiple]
            ├── workflow/page.tsx
            ├── insurance-providers/page.tsx
            ├── pricing/tax-rates/page.tsx
            └── pricing/catalog/page.tsx
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram (Key Tables)

```
userProfiles ←──┐
   ↓            │
  staff         │
   ↓            │
staffPermissions → permissions ← permissionGroupItems ← permissionGroups
                                        ↑
                                        └─ used to template staff perms

patients
   ├── patientBranchProfiles ← branches
   ├── patientKins (emergency contacts)
   ├── patientGuarantors (financial contacts)
   ├── patientInsurances → insuranceProviders → insuranceProviderSchemes
   └── visits (the queue)
        ├── visitTypes
        ├── departments (current location in clinic)
        ├── invoices
        │   ├── invoiceLineItems
        │   │   ├── billableItems (SERVICE or PRODUCT)
        │   │   │   ├── services (CONSULTATION, DIAGNOSTIC, OPTICAL, etc.)
        │   │   │   └── products (FRAME, LENS, CONTACT_LENS, etc.)
        │   │   └── invoiceLineItemOverrides (audit trail)
        │   └── payments
        ├── preTests (JSONB diagnostic data)
        ├── consultations (clinical notes)
        ├── opticalPrescriptions (OD/OS/Axis/PD)
        ├── contactLensFittings
        ├── dispensingOrders (status = PENDING_LAB → READY_FOR_COLLECTION)
        └── repairs

priceBooks (scope: branch, insurance provider, payer type)
   └── priceBookEntries (itemId → price mapping)

auditLogs (tracks all meaningful actions)
```

### 2.2 Core Tables (Simplified)

#### **userProfiles**
- `id` (UUID) — PK
- `userId` (UUID) — FK to Supabase auth.users, unique
- `firstName`, `lastName`, `email`, `phone`
- `isSuperuser` (boolean) — bypass all permissions
- `isActive` (boolean)

#### **staff**
- `id` (serial) — PK
- `userId` (UUID) — FK to userProfiles
- `primaryBranchId` (FK branches) — home branch for context
- `jobTitle` (text)
- `isAdmin` (boolean) — clinic-level sys admin, implicitly has all permissions
- `isActive` (boolean)

#### **staffPermissions** — Source of Truth for Access Control
- `id` (serial) — PK
- `staffId` (serial) — FK staff
- `permissionId` (serial) — FK permissions
- **`branchId` (integer, nullable) — scoping:
  - `NULL` = permission applies to ALL branches
  - `X` = permission scoped to branch X only**
- `granted` (boolean) — `true` = active, `false` = explicitly revoked
- `appliedFromGroupId` (serial, nullable) — which template was this copied from?
- `grantedById` (UUID) — audit trail: who granted it
- _Unique constraint:_ `(staffId, permissionId, branchId)` NULLS NOT DISTINCT

#### **permissions**
- `id` (serial) — PK
- `key` (text, unique) — e.g. `"patients:view"`, `"billing:override_price"`
- `module` (text) — e.g. `"patients"`, `"billing"`
- `label` (text) — e.g. `"View Patients"` (human-readable)
- `description` (text) — tooltip text
- `isActive` (boolean)

#### **permissionGroups**
- `id` (serial) — PK
- `name` (text, unique) — e.g. `"Doctor"`, `"Cashier"`
- `description` (text)
- `isActive` (boolean)

#### **branches**
- `id` (serial) — PK
- `code` (text, unique) — e.g. `"NYR"` (Nyeri branch code)
- `name` (text) — e.g. `"Great Batian - Nyeri Town"`
- `address`, `phone`, `email`
- `isActive` (boolean)

#### **patients**
- `id` (UUID) — PK
- `patientNumber` (text, unique) — human-readable e.g. `"PAT-000001"`
- Demographincs: `salutation`, `firstName`, `middleName`, `lastName`, `dateOfBirth`, `gender`, `maritalStatus`, `bloodGroup`
- Contact: `email`, `phone`, `country` (default: `"Kenya"`)
- IDs: `passportNumber`, `nationalId`, `nhifNumber` (all unique, nullable)
- `mergedIntoId` (UUID, nullable) — for deduplication

#### **patientBranchProfiles**
- `id` (serial) — PK
- `patientId` (UUID) — FK patients
- `branchId` (serial) — FK branches
- `isRegistrationBranch` (boolean) — where patient was first registered
- `isActive` (boolean) — can re-activate/deactivate per branch
- _Unique: (patientId, branchId)_

#### **visits** (The Queue)
- `id` (UUID) — PK
- `patientId` (UUID) — FK patients
- `branchId` (serial) — FK branches
- `visitTypeId` (serial) — FK visitTypes (defines workflow)
- `currentDepartmentId` (serial) — FK departments (current location in clinic)
- `ticketNumber` (text) — e.g. `"Q-001"`, human-facing
- `priority` (enum: `NORMAL`, `URGENT`)
- `status` (enum: `WAITING`, `IN_PROGRESS`, `DONE`, `ON_HOLD`)
- `payerType` (enum: `CASH`, `INSURANCE`, `CORPORATE`)
- `priceBookId` (serial, nullable) — FK priceBooks (pricing context)
- `notes` (text, nullable) — visit notes
- `registeredAt`, `completedAt` (timestamps)

#### **departments**
- `id` (serial) — PK
- `name` (text) — e.g. `"Doctor Room"`
- `code` (text, unique) — e.g. `"DOCTOR"` (used in workflow routing)
- `isActive` (boolean)

#### **visitTypes**
- `id` (serial) — PK
- `name` (text, unique) — e.g. `"Complete Eye Exam"`
- **`workflowSteps` (JSONB array of strings) — e.g. `["RECEPTION", "TRIAGE", "DOCTOR", "OPTICIAN", "CASHIER"]`**
- `defaultServiceId` (serial, FK services, nullable)
- `isActive` (boolean)

#### **invoices**
- `id` (UUID) — PK
- `visitId` (UUID, unique) — FK visits (one invoice per visit)
- `totalAmount`, `amountPaid` (integers in cents)
- `status` (enum: `DRAFT`, `ISSUED`, `PAID`, `VOIDED`)
- `createdAt`, `updatedAt`

#### **invoiceLineItems**
- `id` (serial) — PK
- `invoiceId` (UUID) — FK invoices
- `billableItemId` (serial) — FK billableItems
- `description` (text) — immutable copy (for audit trail)
- `unitPrice`, `quantity`, `subtotal`, `vatAmount`, `total` (integers in cents)
- `isOverridden` (boolean)
- `departmentSource` (text) — human-readable dept name
- `departmentSourceCode` (text) — stable dept code for permission scoping

#### **billableItems** (Polymorphic: SERVICE or PRODUCT)
- `id` (serial) — PK
- `type` (enum: `SERVICE`, `PRODUCT`)
- `serviceId` (serial, FK services, nullable)
- `productId` (serial, FK products, nullable)
- `name` (text, denormalized for speed)
- `isActive` (boolean)
- _CHECK constraint:_ exactly one of serviceId or productId is non-null

#### **services**
- `id` (serial) — PK
- `name` (text) — e.g. `"General Eye Examination"`
- `category` (enum: `CONSULTATION`, `DIAGNOSTIC`, `OPTICAL`, `PROCEDURE`, `OTHER`)
- `description` (text)
- `isActive` (boolean)
- `vatExempt` (boolean) — most medical services are VAT exempt

#### **products**
- `id` (serial) — PK
- `name`, `sku` (sku is unique, nullable)
- `category` (enum: `FRAME`, `LENS`, `CONTACT_LENS`, `ACCESSORY`, `MEDICATION`, `CONSUMABLE`, `OTHER`)
- `stockLevel`, `reorderPoint` (integers)
- `isActive` (boolean)
- `vatExempt` (boolean) — false for most physical products

#### **priceBooks**
- `id` (serial) — PK
- `name` (text) — e.g. `"Standard Cash 2026"`, `"Jubilee Insurance"`
- `type` (enum: `CASH`, `INSURANCE`, `CORPORATE`)
- `branchId` (serial, FK branches, nullable) — scope to branch or all
- `insuranceProviderId`, `insuranceProviderSchemeId` — for insurance price books
- `isActive` (boolean)
- `effectiveFrom`, `effectiveTo` (date, nullable)

#### **priceBookEntries**
- `id` (serial) — PK
- `priceBookId` (serial) — FK priceBooks
- `billableItemId` (serial) — FK billableItems
- `price` (integer, in cents)
- _Unique: (priceBookId, billableItemId)_

#### **Clinical Records** (Children of visits)
- **preTests** — diagnostic data (autoRefActionData, IOP, VA) as JSONB
- **consultations** — chief complaint, clinical notes, diagnosis, assigned doctor
- **opticalPrescriptions** — OD/OS sphere/cylinder/axis, PD
- **contactLensFittings** — base curve, diameter, brand
- **dispensingOrders** — status (PENDING_LAB → READY_FOR_COLLECTION), assigned optician
- **repairs** — issue description, parts replaced, cost estimate

#### **auditLogs**
- `id` (UUID) — PK
- `userId`, `branchId` (nullable, FKs)
- `action` (text) — e.g. `"billing:invoice_created"`, `"staff:permission_granted"`
- `entityType`, `entityId` (text) — what was affected
- `details` (JSONB) — before/after snapshot
- `ipAddress`, `userAgent`
- `createdAt`

### 2.3 Enums

| Enum | Values |
|------|--------|
| `gender_enum` | `MALE`, `FEMALE`, `OTHER` |
| `marital_status_enum` | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED`, `SEPARATED`, `OTHER` |
| `blood_group_enum` | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, `UNKNOWN` |
| `insurance_billing_basis` | `CAPITATION`, `FEE_FOR_SERVICE` |
| `service_category` | `CONSULTATION`, `DIAGNOSTIC`, `OPTICAL`, `PROCEDURE`, `OTHER` |
| `product_category` | `FRAME`, `LENS`, `CONTACT_LENS`, `ACCESSORY`, `MEDICATION`, `CONSUMABLE`, `OTHER` |
| `visit_priority` | `NORMAL`, `URGENT` |
| `visit_status` | `WAITING`, `IN_PROGRESS`, `DONE`, `ON_HOLD` |
| `payment_mode` | `CASH`, `MPESA`, `INSURANCE`, `CARD` |
| `payer_type` | `CASH`, `INSURANCE`, `CORPORATE` |
| `price_book_type` | `CASH`, `INSURANCE`, `CORPORATE` |
| `invoice_status` | `DRAFT`, `ISSUED`, `PAID`, `VOIDED` |
| `order_status` | `PENDING_LAB`, `IN_LAB`, `READY_FOR_COLLECTION`, `DISPATCHED` |
| `override_reason` | `INSURANCE_NEGOTIATED_RATE`, `CORPORATE_AGREEMENT`, `DOCTOR_DISCRETION`, `CORRECTION`, `MANAGEMENT_APPROVAL`, `OTHER` |
| `billable_item_type` | `SERVICE`, `PRODUCT` |

---

## 3. API Endpoints / tRPC Procedures

All procedures live under `/trpc` and are called via the tRPC client. All are `protectedProcedure` (auth required) unless noted.

### 3.1 Routing Module
**Base path:** `trpc.queue.*`

#### Queries
- **`getVisitTypes`** — Returns active visit types ordered by name
  - Input: none
  - Output: `{ id, name, workflowSteps, isActive }`

- **`getDepartmentPool`** — Get WAITING patients for a specific dept today
  - Input: `{ branchId: number, departmentCode: string }`
  - Output: Array of visits in that dept with WAITING status

- **`getGlobalOverview`** — Get non-DONE visits grouped by dept
  - Input: `{ branchId: number }`
  - Output: Array of depts with visit counts

#### Mutations
- **`startVisit`** ⚠️ Requires `queue:manage` permission, audited
  - Input: `{ patientId, branchId, visitTypeId, priority? }`
  - Output: Created visit record
  - Side effect: Auto-creates DRAFT invoice, positions patient in RECEPTION

- **`callPatient`** ⚠️ Requires `queue:manage`, audited
  - Input: `{ visitId }`
  - Output: Visit with status moved to `IN_PROGRESS`

- **`advanceWorkflow`** ⚠️ Requires `queue:manage`, audited
  - Input: `{ visitId }`
  - Output: Visit moved to next department in workflow

- **`saveConsultationNotes`** ⚠️ Requires `queue:manage`, audited
  - Input: `{ visitId, chiefComplaint, clinicalNotes, diagnosis, assignedDoctorId? }`
  - Output: Consultation record upserted

- **`transferPatient`** ⚠️ Requires `queue:transfer`, audited
  - Input: `{ visitId, targetDepartmentId }`
  - Output: Visit repositioned to target dept

- **`markUrgent`** ⚠️ Requires `queue:manage`
  - Input: `{ visitId }`
  - Output: Visit priority set to URGENT

- **`cancelVisit`** ⚠️ Requires `queue:cancel`, audited
  - Input: `{ visitId }`
  - Output: Visit voided, invoice associated cancelled

### 3.2 Patients Module
**Base path:** `trpc.patients.*`

#### Queries
- **`list`** — List patients with pagination/search
  - Requires: `patients:view`
  - Input: `{ branchId, search?, limit?, cursor? }`
  - Output: `{ items, nextCursor, total }`

- **`get`** — Get single patient profile
  - Requires: `patients:view`
  - Input: `{ id }`
  - Output: Full patient record + kins + guarantors + insurances

- **`getVisitHistory`** — Get visit history for patient
  - Requires: `patients:view`
  - Input: `{ patientId, limit?, cursor? }`
  - Output: Array of visits (today-focused or historical)

- **`getKpis`** — Patient count metrics for branch
  - Requires: `patients:view_kpis`
  - Input: `{ branchId }`
  - Output: `{ totalPatients, activeToday, newThisMonth, ... }`

#### Mutations
- **`create`** ⚠️ Requires `patients:create`, audited
  - Input: Full patient form (demographics, contact, IDs)
  - Output: New patient record with auto-generated `patientNumber`

- **`update`** ⚠️ Requires `patients:edit`, audited
  - Input: `{ id, ... updated fields }`
  - Output: Updated patient record

- **`deactivate`** ⚠️ Requires `patients:delete`, audited
  - Input: `{ id }`
  - Output: Patient soft-deleted (isActive = false)

### 3.3 Billing Module
**Base path:** `trpc.billing.*`

#### Queries
- **`getInvoiceForVisit`** — Load draft invoice for a visit
  - Requires: `billing:view_invoices`
  - Input: `{ visitId }`
  - Output: Invoice + line items + payments

- **`listIssuedInvoices`** — Get invoices ready for payment (cashier flow)
  - Requires: `billing:view_invoices`
  - Input: `{ branchId?, limit?, cursor? }`
  - Output: Array of ISSUED invoices

#### Mutations
- **`addLineItem`** ⚠️ Requires `billing:add_line_item`, audited
  - Input: `{ invoiceId, billableItemId, quantity?, departmentSourceCode? }`
  - Resolves price from visit's priceBook
  - Blocks if no price found and user lacks `billing:override_price`
  - Output: Updated invoice with new line item

- **`removeLineItem`** ⚠️ Requires `billing:add_line_item`, audited
  - Allows removal of own dept's lines only (unless has `billing:edit_invoice`)
  - Input: `{ invoiceId, lineItemId }`
  - Output: Updated invoice

- **`issueInvoice`** ⚠️ Requires `billing:edit_invoice`, audited
  - Transitions invoice from DRAFT → ISSUED
  - Input: `{ invoiceId }`
  - Output: Updated invoice

- **`recordPayment`** ⚠️ Requires `billing:record_payment`, audited
  - Records payment against invoice
  - Auto-marks invoice PAID when fully covered
  - Input: `{ invoiceId, amount, paymentMode: "CASH"|"MPESA"|"CARD" }`
  - Output: Updated invoice + payment record

#### Sub-router: **`billing.insurance.*`**
- **`listProviders`** — List insurance companies
- **`createProvider`** — Add new insurance provider
- **`getProviderSchemes`** — Get schemes for a provider
- **`createScheme`** — Add a scheme variant

### 3.4 Staff Module
**Base path:** `trpc.staff.*`

#### Queries
- **`list`** — List staff with filter
  - Requires: `auth:manage_staff`
  - Input: `{ branchId?, limit?, cursor? }`
  - Output: Array of staff + user profiles

- **`get`** — Get staff details
  - Requires: `auth:manage_staff`
  - Input: `{ id }`
  - Output: Staff + permissions

- **`listPermissionGroups`** — List permission templates
  - Requires: `auth:manage_permission_groups`
  - Output: Array of groups

#### Mutations
- **`invite`** ⚠️ Requires `auth:manage_staff`, audited
  - Input: `{ email, firstName, lastName, jobTitle, primaryBranchId }`
  - Output: Supabase invite sent, staff record created

- **`updateStaffProfile`** ⚠️ Requires `auth:manage_staff`, audited
  - Input: `{ id, jobTitle?, primaryBranchId?, isAdmin? }`
  - Output: Updated staff record

- **`updateSelf`** — Update own profile (no permission check)
  - Input: Same as updateStaffProfile but without `id`

- **`deactivate`** ⚠️ Requires `auth:manage_staff`, audited
  - Input: `{ id }`
  - Output: Staff deactivated

- **`reactivate`** ⚠️ Requires `auth:manage_staff`, audited
  - Input: `{ id }`
  - Output: Staff reactivated

- **`grantPermission`** ⚠️ Requires `auth:manage_permissions`, audited
  - Input: `{ staffId, permissionId, branchId? }`
  - Output: New staffPermission row created

- **`revokePermission`** ⚠️ Requires `auth:manage_permissions`, audited
  - Input: `{ staffId, permissionId, branchId? }`
  - Output: staffPermission set to `granted: false`

- **`applyGroup`** ⚠️ Requires `auth:manage_permissions`, audited
  - Copies all perms from a template group to a staff member (one-time)
  - Input: `{ staffId, groupId, branchId? }`
  - Output: Multiple staffPermission rows created

- **`bulkUpdatePermissions`** ⚠️ Bulk grant/revoke
  - Input: Array of `{ staffId, permissionId, branchId?, granted? }`
  - Output: Multiple staffPermission rows upserted

### 3.5 Workflow Module
**Base path:** `trpc.workflow.*`

#### Queries
- **`listDepartments`** — Get all departments
  - Requires: `queue:configure_workflows`
  - Output: Array of depts

- **`listVisitTypes`** — Get all visit types
  - Requires: `queue:configure_workflows`
  - Output: Array of visit types with workflows

#### Mutations
- **`createDepartment`** ⚠️ Requires `queue:configure_workflows`, audited
  - Input: `{ code, name, isActive? }`
  - Output: New department

- **`updateDepartment`** ⚠️ Requires `queue:configure_workflows`, audited
  - Input: `{ id, code?, name?, isActive? }`
  - Output: Updated department

- **`createVisitType`** ⚠️ Requires `queue:configure_workflows`, audited
  - Input: `{ name, workflowSteps: string[] }`
  - Output: New visit type

- **`updateVisitType`** ⚠️ Requires `queue:configure_workflows`, audited
  - Input: `{ id, name?, workflowSteps? }`
  - Output: Updated visit type

### 3.6 Branches Module
**Base path:** `trpc.branches.*`

#### Queries
- **`list`** — List all branches (no permission check for UI branch switcher)
  - Output: Array of branches

- **`get`** — Get branch details
  - Requires: `branches:view`
  - Input: `{ id }`
  - Output: Branch record

#### Mutations
- **`create`** ⚠️ Requires `branches:manage`, audited
  - Input: `{ code, name, address?, phone?, email?, isActive? }`
  - Output: New branch

- **`update`** ⚠️ Requires `branches:manage`, audited
  - Input: `{ id, ... updated fields }`
  - Output: Updated branch

- **`deactivate`** ⚠️ Requires `branches:manage`, audited
  - Input: `{ id }`
  - Output: Branch deactivated

- **`reactivate`** ⚠️ Requires `branches:manage`, audited
  - Input: `{ id }`
  - Output: Branch reactivated

### 3.7 Catalog Module
**Base path:** `trpc.catalog.*`

#### Queries
- **`listServices`** — Search and paginate services
  - Requires: `catalog:view`
  - Input: `{ limit?, cursor?, search? }`
  - Output: `{ items, nextCursor }`

- **`listProducts`** — Search and paginate products
  - Requires: `catalog:view`
  - Input: `{ limit?, cursor?, search? }`
  - Output: `{ items, nextCursor }`

#### Mutations
- **`createService`** ⚠️ Requires `catalog:manage`, audited
  - Input: `{ name, category, description?, vatExempt? }`
  - Output: New service

- **`updateService`** ⚠️ Requires `catalog:manage`, audited
  - Input: `{ id, name?, category?, description?, isActive?, vatExempt? }`
  - Output: Updated service

- **`createProduct`** ⚠️ Requires `catalog:manage`, audited
  - Input: `{ name, sku?, category, description?, vatExempt? }`
  - Output: New product

- **`updateProduct`** ⚠️ Requires `catalog:manage`, audited
  - Input: `{ id, name?, sku?, category?, description?, isActive?, vatExempt? }`
  - Output: Updated product

### 3.8 Pricing Module
**Base path:** `trpc.pricing.*`

#### Queries
- **`listPriceBooks`** — Search price books
  - Requires: `pricing:view`
  - Input: `{ limit?, cursor?, branchId?, type?, isActive? }`
  - Output: `{ items, nextCursor }`

- **`listEntries`** — Get prices in a price book
  - Requires: `pricing:view`
  - Input: `{ priceBookId, limit?, cursor? }`
  - Output: `{ items, nextCursor }`

#### Mutations
- **`createPriceBook`** ⚠️ Requires `pricing:manage`, audited
  - Input: `{ name, type, branchId?, insuranceProviderId?, isActive? }`
  - Output: New price book

- **`updatePriceBook`** ⚠️ Requires `pricing:manage`, audited
  - Input: `{ id, name?, type?, branchId?, isActive? }`
  - Output: Updated price book

- **`upsertEntry`** ⚠️ Requires `pricing:manage`, audited
  - Input: `{ priceBookId, billableItemId, price }`
  - Output: Price book entry (created or updated)

- **`bulkUpsertEntries`** ⚠️ Requires `pricing:manage`, audited
  - Input: `{ priceBookId, entries: [{ billableItemId, price }, ...] }`
  - Output: Multiple entries upserted

### 3.9 Unused / Placeholder Modules

- **`accounting.getDashboard`** — Placeholder (returns `{ revenue: 0, expenses: 0 }`)
- **`inventory.listItems`** — Placeholder (returns empty array)

### 3.10 Auth Module
**Base path:** `trpc.auth.*`

- **`me`** — Get current user context
  - No input
  - Output: `{ profile, staff, permissions: string[] }`
  - Used on every page load to hydrate user state

---

## 4. Authentication System

### 4.1 Architecture

- **Auth Provider**: Supabase (PostgreSQL + JWT)
- **Auth Method**: Supabase.auth.signUp / signIn (email + password OR passwordless/OTP)
- **Session Management**: Supabase session + `useSession()` hook in Next.js
- **Token Format**: JWT (Bearer token sent in `Authorization: Bearer <token>` header)

### 4.2 Auth Flow

1. **User registers via Supabase**: Email + password or passwordless (OTP)
2. **First login triggers staff invite flow**: Admin invites user via tRPC `staff.invite`
   - Creates entry in `userProfiles` table
   - If invited as staff, creates `staff` record
   - If not invited, user has no role (can see nothing)
3. **Permission evaluation on every request**:
   - Token extracted from header
   - User profile + staff record + permissions loaded from DB
   - Middleware checks permission against requested operation
   - If denied: TRPCError("FORBIDDEN")

### 4.3 Permission Check Middleware

```javascript
// Pseudo-code
async function hasPermission(requiredPerm: string) {
  return (opts) => {
    const { ctx } = opts;
    
    // Superusers bypass all checks
    if (ctx.isSuperuser) return true;
    
    // Staff admins bypass all checks (clinic-level)
    if (ctx.isStaffAdmin) return true;
    
    // Check staffPermissions table
    const hasIt = ctx.permissionKeys.includes(requiredPerm);
    if (!hasIt) throw new TRPCError({ code: "FORBIDDEN" });
    
    return true;
  };
}
```

### 4.4 Context Loading (init.ts)

On every request:
1. Extract JWT from `Authorization` header
2. Validate with Supabase (check if token is valid)
3. Load user profile, staff record, and all permissions from DB
4. Resolve `branchId` from request context or staff's primary branch
5. Return context object with:
   - `authUserId`, `profile`, `staff`, `branchId`, `permissionKeys`, `isSuperuser`, `isStaffAdmin`

### 4.5 Role Hierarchy

1. **Superuser** (`userProfiles.isSuperuser = true`)
   - Set by database admin (never via UI)
   - Bypass ALL permission checks
   - Can access any clinic, manage system-level config
   - Typically reserved for Qualitech Labs developers

2. **Clinic Admin** (`staff.isAdmin = true`)
   - Implicitly has ALL permissions **within their clinic**
   - Primary branch set when invited (can work in other branches)
   - Scoped to their clinic only, cannot touch other clinics

3. **Staff with Permissions** (`staff.isAdmin = false`)
   - Permission-based access via `staffPermissions` table
   - Permissions can be branch-scoped (e.g., cashier only in branch 1)
   - Assigned from permission groups (templates) or individually

4. **Non-staff Users** (user in `userProfiles` but not in `staff`)
   - No permissions, cannot see anything
   - Can only change their own password/account settings

---

## 5. User Types / Roles

### 5.1 Permission Groups (Seeded Templates)

| Role | Use Case | Key Permissions |
|------|----------|-----------------|
| **Doctor** | Clinical staff performing consultations | `patients:view/create`, `queue:manage`, `clinical:*`, `billing:view` |
| **Receptionist** | Front-desk registration, patient check-in | `patients:view/create/edit`, `queue:manage/transfer/cancel`, `billing:view` |
| **Cashier** | Invoicing, payment collection | `billing:*` (except some approvals), `patients:view`, `queue:view` |
| **Triage / Technician** | Pre-test diagnostics | `patients:view`, `queue:manage`, `clinical:view`, `billing:add_line_item` |
| **Optician** | Optical products, prescription fulfillment | `patients:view`, `queue:manage`, `clinical:view`, `billing:add_line_item`, `inventory:view` |
| **Insurance Officer** | Insurance claims, provider setup | `patients:view`, `billing:*_insurance_*`, `billing:view_aging_reports` |
| **Storekeeper** | Inventory, stock levels | `inventory:*` |
| **Accountant** | Ledger, reports, receivables/payables | `accounting:*`, `billing:view_invoices`, `billing:view_insurance_claims` |
| **Branch Manager** | Oversight, read across all modules | `patients:view_kpis`, `clinical:view*`, `billing:view*`, `accounting:view*`, `inventory:view` |
| **Clinic Administrator** | Workflow configuration | `queue:configure_workflows` |

### 5.2 Permission Scoping

- **Global permissions**: Branch-scoped to `NULL`
  - Example: `queue:configure_workflows` applies to ALL branches (system-wide config)
  
- **Branch-scoped permissions**: Set to specific `branchId`
  - Example: Cashier at branch 1 can only record payments in branch 1
  - Can have different permissions per branch
  
- **Cross-branch access**: User can have branches in `staffPermissions`
  - Typical: Staff in branch 1 as primary, but also has access to branch 2 as secondary

### 5.3 Permission Key Reference

| Module | Permission Keys |
|--------|-----------------|
| **auth** | `auth:manage_staff`, `auth:manage_permissions`, `auth:view_audit_logs`, `auth:manage_permission_groups` |
| **branches** | `branches:view`, `branches:manage` |
| **patients** | `patients:view`, `patients:view_kpis`, `patients:create`, `patients:edit`, `patients:delete` |
| **clinical** | `clinical:create_consultation`, `clinical:view_consultations`, `clinical:create_prescription`, `clinical:view_prescriptions`, `clinical:manage_attachments` |
| **queue** | `queue:view`, `queue:manage`, `queue:transfer`, `queue:cancel`, `queue:configure_workflows` |
| **billing** | `billing:create_invoice`, `billing:view_invoices`, `billing:add_line_item`, `billing:edit_invoice`, `billing:void_invoice`, `billing:override_price`, `billing:approve_override`, `billing:record_payment`, `billing:issue_receipt`, `billing:apply_discount`, `billing:manage_insurance_providers`, `billing:create_insurance_claim`, `billing:view_insurance_claims`, `billing:update_claim_status`, `billing:view_aging_reports` |
| **inventory** | `inventory:view`, `inventory:manage_products`, `inventory:record_stock_movement`, `inventory:manage_purchase_orders`, `inventory:manage_suppliers`, `inventory:view_valuation` |
| **accounting** | `accounting:view_dashboard`, `accounting:view_reports`, `accounting:export_reports`, `accounting:view_ledger`, `accounting:manage_ledger`, `accounting:view_accounts_receivable`, `accounting:view_accounts_payable` |
| **catalog** | `catalog:view`, `catalog:manage` |
| **pricing** | `pricing:view`, `pricing:manage` |

---

## 6. Current State: What's Implemented vs. TODO

### 6.1 Implemented & Wired End-to-End

✅ **Database (Drizzle + PostgreSQL)**
- All core tables + relationships defined
- Migrations versioned
- Seed data for permissions, departments, visit types

✅ **Queue Management (Live Patient Flow)**
- Start visit (auto-creates DRAFT invoice, positions in RECEPTION)
- Move patient through workflow steps (advanceWorkflow)
- Call patient (IN_PROGRESS), complete visit (DONE)
- Transfer to different dept
- Mark urgent, cancel visit
- Global overview (see all depts at a glance)
- Department pool view (drill-down on specific dept)
- Consultation notes save

✅ **Patient Management**
- Register new patient
- Search + list patients
- Patient profile (KPIs: total, active today, new this month)
- Edit patient demographics, contact, insurance
- Deactivate patient
- Patient visit history

✅ **Billing**
- Auto-create DRAFT invoice on startVisit
- Add line items to invoice (dept-specific)
- Remove line items (with permission checks: own-dept rule)
- Issue invoice (DRAFT → ISSUED)
- Record payment (CASH, MPESA, CARD)
- Auto-mark PAID when fully covered
- List issued invoices (cashier view)
- Price resolution from price book
- VAT calculation (from tax_rates table)
- Invoice line item override with audit trail

❓ **Partially Implemented / ⚠️ Risky**
- Insurance claim submission (schema ready, API endpoints stubbed)
- Accounting reports (placeholder only)
- Inventory management (listing only, no full path)
- Clinical modules (preTests, opticalPrescriptions, dispensingOrders schema exist but UI minimal)
- Realtime queue updates (WebSocket infrastructure in place, but may need testing)
- Multi-branch permission enforcement (tested logic, but not under load)

### 6.2 TODO / Not Yet Started

❌ **Major Features**
1. **Optical prescription management UI** — workstation for doctor to enter OD/OS/Axis/PD
2. **Dispensing orders workflow** — optician assigns frames/lenses, lab status tracking
3. **Contact lens fittings** — record fitting data, assign contact lens parameters
4. **Repairs module** — issue description, parts, cost, status tracking
5. **Pre-test / Diagnostic workstation** — technician enters visual acuity, IOP, autorefraction
6. **Full inventory system** — stock movement, purchase orders, supplier management
7. **Accounting module** — ledger view, P&L reports, trial balance, receivables aging
8. **Insurance claims export** — auto-submit to insurance via clear file format or API
9. **Mobile/PWA support** — currently desktop-only
10. **Realtime notifications** — queue messages, payment confirmations (Supabase Realtime)

❌ **QA / Testing**
- Load testing (100+ concurrency, especially queue)
- Edge case testing (network failures, concurrent edits)
- Permission boundary testing (cross-branch, revoked perms)
- Audit log completeness check
- Database lock/concurrency under stress

❌ **DevOps / Deployment**
- Docker image optimization (currently works but not optimized)
- Database migration safety (blue-green strategy)
- Secrets management (ENV vars need vault)
- Monitoring / Observability (Sentry, logging aggregation)
- Performance profiling (Lighthouse, API response times)

### 6.3 Known Limitations / Warnings

⚠️ **Not Production-Ready Yet**

1. **No realtime queue push** — Patients don't auto-refresh on backend changes
   - Frontend polls every 15 seconds in some views
   - Supabase Realtime is subscribed but not fully tested

2. **No offline mode** — All operations require internet
   - Works in airplane mode for read-only cached data only

3. **Pricing logic is basic** — No tiered pricing, no bulk discounts
   - Single price per item per book
   - Manual overrides only (no discount tiers)

4. **No automatic insurance claim submission** — Requires manual export/import
   - Claim data is recordable but not auto-sent to insurance APIs

5. **No appointment scheduling** — Queue is day-of-arrival only
   - Planned future feature

6. **No multi-currency support** — All prices in Kenyan Shillings (database stores as cents)
   - Symbol not configurable, display format hardcoded

7. **Password reset flow is basic** — Standard email link, no SMS OTP
   - Uses Supabase's default reset flow

---

## 7. Seeded Default Data

### 7.1 Default Departments

| Code | Name | Purpose |
|------|------|---------|
| RECEPTION | Reception | Patient check-in |
| TRIAGE | Triage / Pre-test | Diagnostics (VA, IOP, autorefraction) |
| DOCTOR | Doctor Room | Clinical consultation |
| OPTICIAN | Optician | Optical products, frame/lens sales |
| TECHNICIAN | Technician / Lab | Repairs, lens cutting, frame work |
| CASHIER | Cashier | Payment collection |
| DISPATCH | Dispatch / Collection | Pickup of completed orders |

### 7.2 Default Visit Types

| Name | Workflow |
|------|----------|
| **Complete Eye Exam** | RECEPTION → TRIAGE → DOCTOR → OPTICIAN → CASHIER |
| **Doctor Follow-up** | RECEPTION → TRIAGE → DOCTOR → CASHIER |
| **External Rx Glasses** | RECEPTION → OPTICIAN → CASHIER |
| **Frame Repair** | RECEPTION → TECHNICIAN → CASHIER |
| **Glasses Collection** | RECEPTION → DISPATCH |
| **Contact Lens Fitting** | RECEPTION → DOCTOR → OPTICIAN → CASHIER |
| **Emergency** | RECEPTION → DOCTOR → CASHIER |

---

## 8. Architecture Notes

### 8.1 Key Design Decisions

1. **No standalone queue table** — Queue is the live set of `visits` with `status != DONE`
   - Filtered by branch, dept, and status
   - Ordered by `priority` (URGENT first), then `registeredAt`

2. **One invoice per visit** — Unique constraint on `(visitId)`
   - Invoice auto-created in DRAFT state on startVisit
   - Deleted if visit is cancelled

3. **Brand-neutral pricing** — Prices stored as integers (cents) to avoid floating point
   - All calculations done with integers
   - Conversion to KES currency only at display time

4. **Denormalized `billableItem.name`** — For rapid invoice generation
   - Avoids joins on every line item fetch
   - Trade-off: need to keep synced when service/product name changes

5. **Staff permissions are independent after group copy** — No auto-update
   - Assigning a group is a one-time copy operation
   - Later edits to the group don't change already-assigned staff

6. **Branch-scoped permissions with NULL fallback**
   - `branchId = NULL` → applies to ALL branches
   - Makes it easy to create org-wide roles (e.g., Clinic Admin)

---

## Appendix: Tech Stack Details

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS + custom component library (@visyx/ui) |
| **API** | tRPC + Hono (routes), Drizzle ORM query builder |
| **Backend Runtime** | Bun (TypeScript execution) |
| **Database** | PostgreSQL 15+ with Drizzle ORM |
| **Auth** | Supabase Auth (email/password + JWT) |
| **Real-time** | Supabase Realtime (WebSocket) |
| **Schema Validation** | Zod |
| **HTTP Client** | Fetch API (native, no Axios) |
| **Build Tool** | Turbo (monorepo orchestration) |
| **Linting / Formatting** | ESLint, Prettier, Biome |
| **Package Manager** | Bun (also npm compatible) |

---

**Document generated:** April 2, 2026  
**Workspace path:** `/home/wainaina/Desktop/Jimmy/visyx`
