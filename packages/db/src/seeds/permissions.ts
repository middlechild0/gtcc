/**
 * Optical Clinic Management System — Seeds
 * *
 * Seeds:
 *   1. permissions     — master list of all system permissions
 *   2. permissionGroups + permissionGroupItems — starter templates
 */

import { db } from "../client";
import { permissionGroupItems, permissionGroups, permissions } from "../schema";

// ─────────────────────────────────────────────────────────────────────────────
// 1. PERMISSIONS MASTER LIST
// ─────────────────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  // Auth & User Management
  {
    key: "auth:manage_staff",
    module: "auth",
    label: "Manage Staff",
    description: "Create, edit, deactivate staff accounts",
  },
  {
    key: "auth:manage_permissions",
    module: "auth",
    label: "Manage Permissions",
    description: "Grant or revoke permissions for staff members",
  },
  {
    key: "auth:view_audit_logs",
    module: "auth",
    label: "View Audit Logs",
    description: "Read system audit trail and user activity logs",
  },
  {
    key: "auth:manage_permission_groups",
    module: "auth",
    label: "Manage Permission Groups",
    description: "Create and edit permission group templates",
  },

  // Branches
  {
    key: "branches:view",
    module: "branches",
    label: "View Branches",
    description: "View branch information and details",
  },
  {
    key: "branches:manage",
    module: "branches",
    label: "Manage Branches",
    description: "Create and edit branch records",
  },

  // Patients & Clinical
  {
    key: "patients:view",
    module: "patients",
    label: "View Patients",
    description: "Search and view patient profiles and visit history",
  },
  {
    key: "patients:create",
    module: "patients",
    label: "Register Patients",
    description: "Create new patient records",
  },
  {
    key: "patients:edit",
    module: "patients",
    label: "Edit Patient Records",
    description: "Update patient contact info, insurance, and details",
  },
  {
    key: "patients:delete",
    module: "patients",
    label: "Delete Patients",
    description: "Permanently remove patient records (use with caution)",
  },
  {
    key: "clinical:create_consultation",
    module: "clinical",
    label: "Create Consultation",
    description: "Record consultation notes and doctor observations",
  },
  {
    key: "clinical:view_consultations",
    module: "clinical",
    label: "View Consultations",
    description: "Read clinical notes and consultation history",
  },
  {
    key: "clinical:create_prescription",
    module: "clinical",
    label: "Create Prescription",
    description: "Write and save optical prescriptions (OD, OS, axis, PD)",
  },
  {
    key: "clinical:view_prescriptions",
    module: "clinical",
    label: "View Prescriptions",
    description: "Read patient prescriptions",
  },
  {
    key: "clinical:manage_attachments",
    module: "clinical",
    label: "Manage Clinical Attachments",
    description: "Upload and manage files attached to patient records",
  },

  // Queue Management
  {
    key: "queue:view",
    module: "queue",
    label: "View Clinical Queue",
    description: "View the patient queue for different departments",
  },
  {
    key: "queue:manage",
    module: "queue",
    label: "Progress Queue",
    description: "Start visits, call patients, and advance the workflow",
  },
  {
    key: "queue:transfer",
    module: "queue",
    label: "Transfer Patients",
    description: "Manually bypass the standard clinical workflow by transferring patients to other departments",
  },
  {
    key: "queue:cancel",
    module: "queue",
    label: "Cancel Visits",
    description: "Cancel active visits and void associated empty invoices",
  },

  // Billing, Payments & Insurance
  {
    key: "billing:create_invoice",
    module: "billing",
    label: "Create Invoice",
    description:
      "Generate invoices for consultations, frames, lenses, services",
  },
  {
    key: "billing:view_invoices",
    module: "billing",
    label: "View Invoices",
    description: "View invoices and billing history",
  },
  {
    key: "billing:edit_invoice",
    module: "billing",
    label: "Edit Invoice",
    description: "Modify line items on an existing unpaid invoice",
  },
  {
    key: "billing:void_invoice",
    module: "billing",
    label: "Void Invoice",
    description: "Cancel an issued invoice",
  },
  {
    key: "billing:record_payment",
    module: "billing",
    label: "Record Payment",
    description: "Mark invoices as paid and record payment method",
  },
  {
    key: "billing:issue_receipt",
    module: "billing",
    label: "Issue Receipt",
    description: "Print or email payment receipts",
  },
  {
    key: "billing:apply_discount",
    module: "billing",
    label: "Apply Discount",
    description: "Apply discounts or adjustments to invoices",
  },
  {
    key: "billing:manage_insurance_providers",
    module: "billing",
    label: "Manage Insurance Providers",
    description: "Add and configure insurance companies",
  },
  {
    key: "billing:create_insurance_claim",
    module: "billing",
    label: "Create Insurance Claim",
    description: "Submit claims to insurance providers",
  },
  {
    key: "billing:view_insurance_claims",
    module: "billing",
    label: "View Insurance Claims",
    description: "View claim status and history",
  },
  {
    key: "billing:update_claim_status",
    module: "billing",
    label: "Update Claim Status",
    description: "Mark claims as approved, rejected, or paid",
  },
  {
    key: "billing:view_aging_reports",
    module: "billing",
    label: "View Aging Reports",
    description: "View outstanding receivables and insurance claim aging",
  },

  // Inventory
  {
    key: "inventory:view",
    module: "inventory",
    label: "View Inventory",
    description: "View product catalog and current stock levels",
  },
  {
    key: "inventory:manage_products",
    module: "inventory",
    label: "Manage Products",
    description: "Create and edit products (frames, lenses, equipment)",
  },
  {
    key: "inventory:record_stock_movement",
    module: "inventory",
    label: "Record Stock Movement",
    description: "Record sales deductions, transfers, and manual adjustments",
  },
  {
    key: "inventory:manage_purchase_orders",
    module: "inventory",
    label: "Manage Purchase Orders",
    description: "Create and receive purchase orders from suppliers",
  },
  {
    key: "inventory:manage_suppliers",
    module: "inventory",
    label: "Manage Suppliers",
    description: "Add and edit supplier records",
  },
  {
    key: "inventory:view_valuation",
    module: "inventory",
    label: "View Inventory Valuation",
    description: "See total inventory value and stock reports",
  },

  // Accounting & Reporting
  {
    key: "accounting:view_dashboard",
    module: "accounting",
    label: "View Financial Dashboard",
    description: "View real-time financial summary and KPIs",
  },
  {
    key: "accounting:view_reports",
    module: "accounting",
    label: "View Financial Reports",
    description: "Access P&L, cashflow, daily sales, and receivables reports",
  },
  {
    key: "accounting:export_reports",
    module: "accounting",
    label: "Export Reports",
    description: "Download financial reports as PDF or Excel",
  },
  {
    key: "accounting:view_ledger",
    module: "accounting",
    label: "View General Ledger",
    description: "Read ledger entries and chart of accounts",
  },
  {
    key: "accounting:manage_ledger",
    module: "accounting",
    label: "Manage General Ledger",
    description: "Create and edit ledger entries and chart of accounts",
  },
  {
    key: "accounting:view_accounts_receivable",
    module: "accounting",
    label: "View Accounts Receivable",
    description: "View what patients and insurers owe the clinic",
  },
  {
    key: "accounting:view_accounts_payable",
    module: "accounting",
    label: "View Accounts Payable",
    description: "View what the clinic owes suppliers",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. PERMISSION GROUP TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

type PermissionKey = (typeof PERMISSIONS)[number]["key"];

const PERMISSION_GROUPS: {
  name: string;
  description: string;
  permissions: PermissionKey[];
}[] = [
    {
      name: "Doctor",
      description:
        "Clinical staff who perform consultations and write prescriptions.",
      permissions: [
        "patients:view",
        "patients:create",
        "patients:edit",
        "queue:view",
        "queue:manage",
        "clinical:create_consultation",
        "clinical:view_consultations",
        "clinical:create_prescription",
        "clinical:view_prescriptions",
        "clinical:manage_attachments",
        "inventory:view",
      ],
    },
    {
      name: "Receptionist",
      description:
        "Front-desk staff who register patients. No billing or clinical write access.",
      permissions: [
        "patients:view",
        "patients:create",
        "patients:edit",
        "queue:view",
        "queue:manage",
        "queue:transfer",
        "queue:cancel",
        "clinical:view_consultations",
        "clinical:view_prescriptions",
        "branches:view",
      ],
    },
    {
      name: "Cashier",
      description: "Handles invoicing, payment collection, and receipt issuance.",
      permissions: [
        "patients:view",
        "queue:view",
        "queue:manage",
        "billing:create_invoice",
        "billing:view_invoices",
        "billing:record_payment",
        "billing:issue_receipt",
        "billing:apply_discount",
        "billing:view_insurance_claims",
        "billing:create_insurance_claim",
        "inventory:view",
      ],
    },
    {
      name: "Insurance Officer",
      description:
        "Manages insurance claims, provider setup, and aging follow-ups.",
      permissions: [
        "patients:view",
        "billing:view_invoices",
        "billing:manage_insurance_providers",
        "billing:create_insurance_claim",
        "billing:view_insurance_claims",
        "billing:update_claim_status",
        "billing:view_aging_reports",
      ],
    },
    {
      name: "Storekeeper",
      description:
        "Manages product catalog, stock levels, purchase orders, and suppliers.",
      permissions: [
        "inventory:view",
        "inventory:manage_products",
        "inventory:record_stock_movement",
        "inventory:manage_purchase_orders",
        "inventory:manage_suppliers",
        "inventory:view_valuation",
      ],
    },
    {
      name: "Accountant",
      description:
        "Full accounting access: ledger, reports, receivables, payables, and exports.",
      permissions: [
        "accounting:view_dashboard",
        "accounting:view_reports",
        "accounting:export_reports",
        "accounting:view_ledger",
        "accounting:manage_ledger",
        "accounting:view_accounts_receivable",
        "accounting:view_accounts_payable",
        "billing:view_invoices",
        "billing:view_insurance_claims",
        "billing:view_aging_reports",
        "inventory:view_valuation",
      ],
    },
    {
      name: "Branch Manager",
      description:
        "Oversight role. Read access across all modules, limited write access.",
      permissions: [
        "patients:view",
        "clinical:view_consultations",
        "clinical:view_prescriptions",
        "billing:view_invoices",
        "billing:view_insurance_claims",
        "billing:view_aging_reports",
        "billing:apply_discount",
        "inventory:view",
        "inventory:view_valuation",
        "accounting:view_dashboard",
        "accounting:view_reports",
        "accounting:export_reports",
        "accounting:view_accounts_receivable",
        "accounting:view_accounts_payable",
        "branches:view",
      ],
    },
  ];

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export async function seed() {
  console.log("Seeding permissions...");

  const insertedPermissions = await db
    .insert(permissions)
    .values(PERMISSIONS.map((p) => ({ ...p, isActive: true })))
    .onConflictDoUpdate({
      target: permissions.key,
      set: {
        label: permissions.label,
        description: permissions.description,
        module: permissions.module,
        isActive: permissions.isActive,
      },
    })
    .returning();

  const permKeyToId = Object.fromEntries(
    insertedPermissions.map((p) => [p.key, p.id]),
  );

  console.log(`${insertedPermissions.length} permissions seeded`);
  console.log("Seeding permission groups...");

  for (const group of PERMISSION_GROUPS) {
    const [insertedGroup] = await db
      .insert(permissionGroups)
      .values({
        name: group.name,
        description: group.description,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: permissionGroups.name,
        set: { description: permissionGroups.description },
      })
      .returning();

    if (!insertedGroup) continue;

    const items = group.permissions
      .map((key) => permKeyToId[key])
      .filter(Boolean)
      .map((permissionId) => ({
        groupId: insertedGroup.id,
        permissionId: permissionId as number,
      }));

    if (items.length > 0) {
      await db.insert(permissionGroupItems).values(items).onConflictDoNothing();
    }

    console.log(`  ✓ "${group.name}" — ${items.length} permissions`);
  }

  console.log("Seeding complete.");
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
