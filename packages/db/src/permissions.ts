// Shared permission definitions for the optical clinic system.
// This is the single source of truth for permission keys across
// backend seeds and frontend type definitions.

export const PERMISSIONS = [
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
    key: "patients:view_kpis",
    module: "patients",
    label: "View Patient KPIs",
    description: "View aggregated patient counts and KPI metrics",
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

  // Queue Operations
  {
    key: "queue:view",
    module: "queue",
    label: "View Queue",
    description: "View active queue waitlists and statuses",
  },
  {
    key: "queue:manage",
    module: "queue",
    label: "Manage Queue",
    description: "Call patients and advance their workflow",
  },
  {
    key: "queue:transfer",
    module: "queue",
    label: "Transfer Patient",
    description: "Transfer a patient between departments manually",
  },
  {
    key: "queue:cancel",
    module: "queue",
    label: "Cancel Visit",
    description: "Cancel an active patient visit",
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];
