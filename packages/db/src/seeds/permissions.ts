/**
 * Optical Clinic Management System — Seeds
 *
 * Seeds:
 *   1. permissions     — master list of all system permissions (imported from shared source of truth)
 *   2. permissionGroups + permissionGroupItems — starter templates
 *
 * NOTE: This script is for initial bootstrapping of a fresh database only.
 * Ongoing changes to permission groups should be managed via the API
 * (staff.createGroup, staff.updateGroup, staff.deleteGroup).
 */

import { db } from "../client";
import { PERMISSIONS } from "../permissions";
import { permissionGroupItems, permissionGroups, permissions } from "../schema";

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION GROUP TEMPLATES
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
      "billing:view_invoices",
      "billing:add_line_item",
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
      "billing:add_line_item",
      "billing:edit_invoice",
      "billing:record_payment",
      "billing:issue_receipt",
      "billing:apply_discount",
      "billing:view_insurance_claims",
      "billing:create_insurance_claim",
      "inventory:view",
    ],
  },
  {
    name: "Triage / Technician",
    description:
      "Pre-test and triage staff. Can add diagnostic charges to the draft invoice.",
    permissions: [
      "patients:view",
      "queue:view",
      "queue:manage",
      "clinical:view_consultations",
      "clinical:view_prescriptions",
      "billing:view_invoices",
      "billing:add_line_item",
    ],
  },
  {
    name: "Optician",
    description:
      "Dispensing opticians who add frames, lenses, and optical products to invoices.",
    permissions: [
      "patients:view",
      "queue:view",
      "queue:manage",
      "clinical:view_consultations",
      "clinical:view_prescriptions",
      "billing:view_invoices",
      "billing:add_line_item",
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
      "patients:view_kpis",
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
  {
    name: "Clinic Administrator",
    description:
      "Organization-wide configuration: queue workflows, departments, and visit types. Assign queue:configure_workflows with branch_id NULL only.",
    permissions: ["queue:view", "queue:configure_workflows"],
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
