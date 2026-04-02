# 🏥 VISYX - Complete System Overview

**Status**: Feature-complete, ready for testing  
**Stack**: Bun · Hono · tRPC · Next.js · Drizzle ORM · PostgreSQL · Supabase Auth  
**Target**: Patient → Doctor → Billing workflow (end-to-end)

---

## 🎮 Quick Start - What You Can Access Now

### **Account You Just Created**
```
Email:    admin_1775133484_9yacoe@gtcc.local
Password: 52rDmgjDsp#dNn3L
Role:     SUPERADMIN (full system access)
```

**Before logging in**, run this SQL in your Supabase console to activate the profile:
```sql
INSERT INTO user_profiles (
  user_id, email, first_name, last_name, is_superuser, is_active
) VALUES (
  '8d541ad1-94de-4a02-83c0-85fce66c3698',
  'admin_1775133484_9yacoe@gtcc.local',
  'System', 'Superadmin', true, true
) ON CONFLICT (email) DO NOTHING;
```

Then login at: **http://localhost:3000**

---

## 🗺️ Dashboard & Navigation

Once logged in as **Superadmin**, you'll see a full left sidebar with access to:

### **Core Workflow**
- 🏥 **Patients** - Patient registration, records, histories
  - `/dashboard/patients` — Browse all patients
  - `/dashboard/patients/new` — Register new patient
  - `/dashboard/patients/[id]` — View patient detail + start visit + consultation notes
  - `/dashboard/patients/[id]/edit` — Edit patient info

- 🚶 **Live Queue** - Real-time patient flow through departments
  - `/dashboard/queue` — Current queue (Consultation → Billing)
  - `/dashboard/queue/[id]` — Patient in queue, doctor can call, save notes, advance

- 💰 **Billing** - Cashier dashboard for pending payments
  - `/dashboard/billing` — List ISSUED invoices, record payments
  - Auto-refetch every 15 seconds
  - Supports: Cash, M-Pesa, Card payments

### **Admin Panels** (Superadmin only)
- 👥 **User Admin** `/dashboard/admin/users`
  - Create staff members
  - Assign permissions per user or permission group
  - Active/inactive toggle
  - See audit log of all changes

- 🔐 **Permissions** `/dashboard/admin/permissions`
  - Define custom permission groups
  - Assign to staff members
  - Examples: `visits:read`, `visits:write`, `billing:confirm_payment`, `queue:manage`

- 🏢 **Branches** `/dashboard/admin/branches`
  - Manage clinic locations
  - Multi-branch support with scoped permissions
  - Each branch can have its own staff, departments, pricing

- 📋 **Workflow Config** `/dashboard/admin/workflow`
  - Define department sequence (e.g., Consultation → Billing → Exit)
  - Create visit types with workflow steps
  - Reorder departments per branch

- 🏥 **Insurance Providers** `/dashboard/admin/insurance`
  - Add insurance companies
  - Define schemes (coverage %, pre-auth requirements)
  - Link to patients

- 💵 **Pricing & Tax** `/dashboard/admin/pricing`
  - Price books (e.g., "Cash Standard", "Insurance Standard")
  - Line items: Services, Products, Tax rates
  - Dynamic pricing per payer type (cash vs. insurance)

### **Optional Modules** (Partially implemented)
- 👓 **Optical Prescriptions** - Prescription capture (schema ready, UI pending)
- 🧪 **Pre-Tests** - Lab/pre-procedure tests (schema ready, UI pending)
- 📦 **Inventory** - Stock management (API stubbed, needs UI)
- 📊 **Accounting** - Financial reports (placeholder)

---

## 📊 What's in the Database

### **Patient Data**
```
Patients
├── Demographics (name, DOB, gender, phone, address)
├── Insurance (linked insurances + schemes)
├── Visits (history of all visits to clinic)
│   └── Consultations (notes, findings, test results)
│   └── Invoices (automatically generated, linked to visit)
│   └── Prescriptions (optical rx, medications)
└── KPI metrics (visit count, total spend, last visit date)
```

### **Clinic Structure**
```
Branches (e.g., "Nairobi HQ")
├── Departments (Consultation, Billing, Triage, etc.)
├── Staff (doctors, cashiers, receptionists with permissions)
├── Workflows (visiting logic: Consultation → Billing → Exit)
├── Price Books (pricing per payer type)
└── Permissions (staff roles and what they can do)
```

### **Billing**
```
Invoice
├── Line Items (services rendered, products dispensed)
├── Tax Calculations (auto-computed)
├── Total Amount (sum of line items + tax)
├── Status: DRAFT → ISSUED → PAID → VOID
└── Payments (record of cash/card/M-Pesa payments)
```

---

## 🔌 API Endpoints (tRPC Procedures)

All endpoints require **Supabase JWT** authentication. Call from frontend via:

```typescript
trpc.module.procedure.query/mutation({...})
```

### **Queue Management** (`queue.*`)
```
queue.startVisit(patientId, visitTypeId, payerType, insuranceId?)
  → Creates new patient visit + auto-generates DRAFT invoice

queue.callPatient(visitId)
  → Moves patient from WAITING to IN_PROGRESS in current department
  → Enables console notes editing

queue.advanceWorkflow(visitId)
  → Moves patient to next department in workflow
  → If advancing to Billing: auto-issues invoice (DRAFT → ISSUED)

queue.transferPatient(visitId, targetDepartmentId)
  → Skip ahead to specific department

queue.cancelPatient(visitId)
  → Mark visit as CANCELLED + void any associated invoices

queue.saveConsultationNotes(visitId, notes)
  → Save clinical notes during consultation
  → Only callable when visit status = IN_PROGRESS
```

### **Billing** (`billing.*`)
```
billing.addLineItem(invoiceId, serviceId|productId, quantity, overridePrice?)
  → Add service/product to invoice
  → Auto-compute tax if batch doesn't have all items

billing.removeLineItem(invoiceId, itemId)
  → Remove line item from invoice

billing.issueInvoice(invoiceId)
  → Change status DRAFT → ISSUED (now patient must pay)

billing.listIssuedInvoices()
  → Cashier view: all ISSUED invoices waiting for payment

billing.recordPayment(invoiceId, amount, method: CASH|CARD|MPESA)
  → Record payment received
  → If total payments >= invoice total: mark PAID + auto-close visit
```

### **Patients** (`patients.*`)
```
patients.create(firstname, lastname, dob, gender, phone, insuranceId?)
  → Register new patient

patients.getVisitHistory(patientId)
  → All past visits with notes, invoices, prescriptions

patients.getKPIs(patientId)
  → Visit count, total spent, days since last visit, avg visit value
```

### **Staff** (`staff.*`)
```
staff.createMember(email, firstName, lastName, role, permissionGroupId?)
  → Create new staff member (auth user + profile)
  → Send invite link via Resend email

staff.updatePermissions(staffId, permissionGroupId)
  → Change what staff member can do

staff.listMembers()
  → All staff in active branch (filtered by branch scope)
```

### **Auth** (`auth.*`)
```
auth.me()
  → Get current logged-in user + permissions + branch scope
  → Used to initialize dashboard
```

---

## 🔐 Permissions System

Superadmin has **all** permissions. Regular staff are scoped by:

### **Permission Types**
```
visits:read      - View patient visits
visits:write     - Create/edit visits
queue:manage     - Call/advance patients
billing:read     - View invoices
billing:confirm_payment - Record payments
users:manage     - Create/edit staff
permissions:manage - Define permission groups
```

### **Branch Scoping**
- Org-wide permissions: Staff can access ALL branches
- Branch-specific: Staff only see patients/data in assigned branch(es)
- Permission groups: Bundle permissions for easy assignment (e.g., "Doctor", "Cashier")

---

## 🧪 Testing the Full Workflow

Follow this checklist to verify everything works:

### **1. Data Setup** ✓
- ✅ Branches exist (run seed SQL if needed)
- ✅ Departments exist (Consultation, Billing)
- ✅ Visit types defined (General Consultation)
- ✅ Price books created (Cash Standard)

### **2. Patient Registration**
```
1. Go to /dashboard/patients
2. Click "New Patient"
3. Fill: Name, DOB, Gender, Phone
4. Click "Register"
5. ✅ Patient appears in list and you can click to open detail
```

### **3. Start Visit**
```
1. Open patient detail (/dashboard/patients/[id])
2. Scroll to "Active Visit" section
3. Click "Start Visit"
4. Select visit type: "General Consultation"
5. Select payer type: "Cash"
6. Click "Start"
7. ✅ Visit created, status=WAITING, invoice auto-created (DRAFT)
```

### **4. Queue (Call Patient)**
```
1. Go to /dashboard/queue
2. Find patient in "Consultation" department
3. Click "Call"
4. ✅ Patient status changes to IN_PROGRESS
5. You can now edit "Consultation Notes"
```

### **5. Save Notes**
```
1. In queue detail (/dashboard/queue/[visitId])
2. Scroll to "Consultation Notes"
3. Type clinical observations
4. Click "Save Notes"
5. ✅ Notes saved to database (visits.notes column)
```

### **6. Advance to Billing**
```
1. While in queue detail, click "Advance to Next Department"
2. ✅ Patient moves to Billing department
3. Invoice status changes: DRAFT → ISSUED
```

### **7. Record Payment (Cashier)**
```
1. Go to /dashboard/billing
2. See patient invoice with amount
3. Select payment method (Cash/M-Pesa/Card)
4. Click "Confirm Payment"
5. ✅ Payment recorded, invoice marked PAID, visit marked DONE
```

### **8. Verify Visit Closed**
```
1. Return to patient detail
2. Find visit in "Visit History"
3. Status = DONE, completion date = now
```

---

## 🚀 Features You Have Now

### ✅ Implemented
- [x] Multi-branch clinic support
- [x] Patient registration + demographics
- [x] Queue management (call → advance → transfer → cancel)
- [x] Doctor consultation notes (auto-save to database)
- [x] Invoice auto-generation on visit start
- [x] Line item management (add/remove services from invoice)
- [x] Multi-method payments (Cash, M-Pesa, Card)
- [x] Auto-close visits when payment complete
- [x] Staff permissions (granular per user or via groups)
- [x] Audit logging (who did what, when)
- [x] Real-time queue updates (Supabase Realtime ready)
- [x] Email invites for new staff (Resend API integrated)

### 🟡 Partially Done
- [x] Optical prescriptions (schema + capture UI ready, display pending)
- [x] Pre-tests/lab orders (schema ready, UI pending)
- [x] Insurance scheme linking (schema ready, workflow pending)
- [x] Inventory system (schema ready, API stubbed, UI pending)

### 📝 TODO / Not Yet
- [ ] Insurance claims export (schema ready, export format pending)
- [ ] Financial reports + accounting (placeholder)
- [ ] SMS notifications (schema ready, provider pending)
- [ ] Appointment scheduling (schema ready, UI pending)
- [ ] Load testing + performance optimization
- [ ] Mobile app (out of scope for now)

---

## 📝 Code Structure

```
visyx/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── queue/      # Patient workflow
│   │   │   │   ├── billing/    # Invoicing + payments
│   │   │   │   ├── patients/   # Patient CRUD
│   │   │   │   ├── staff/      # User management
│   │   │   │   ├── workflow/   # Department config
│   │   │   │   └── ...
│   │   │   ├── trpc/
│   │   │   │   └── routers/_app.ts  # All procedures
│   │   │   └── index.ts             # Hono server
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── patients/       # Patient pages
│       │   │   │   │   ├── queue/          # Queue pages
│       │   │   │   │   ├── billing/        # Cashier
│       │   │   │   │   └── admin/          # Admin panels
│       │   │   │   └── layout.tsx          # Sidebar nav
│       │   │   └── auth/                    # Login/signup
│       │   ├── trpc/
│       │   │   └── client.ts               # tRPC client
│       │   └── components/
│       └── package.json
│
├── packages/
│   ├── db/
│   │   ├── src/
│   │   │   ├── schema.ts        # Database tables
│   │   │   ├── client.ts        # DB connection
│   │   │   ├── seeds/           # Seed scripts
│   │   │   └── migrations/      # Drizzle migrations
│   │   └── drizzle.config.ts
│   │
│   └── (other: ui, utils, encryption, logger, etc.)
│
└── scripts/
    ├── create-superadmin.ts     # Create superadmin user
    └── create-user.ts           # Create regular staff
```

---

## 🎯 Next Steps

1. **Log in** with superadmin credentials above
2. **Create a test patient** (Patients → New Patient)
3. **Start a visit** (patient detail → Start Visit)
4. **Call from queue** (Live Queue → Call)
5. **Save consultation notes** (Queue detail → Consultation Notes)
6. **Advance to billing** (Queue detail → Advance)
7. **Record payment** (Billing → Confirm Payment)
8. **Verify completion** (Patient detail → Visit History)

---

## 📧 Need More Users?

Create additional staff members:

```bash
# Create a regular staff member
bun scripts/create-user.ts "Dr" "Smith"
```

Will generate:
- Random email + password
- Output SQL to add to database

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Login fails" | Ensure user_profiles entry created in database (run SQL above) |
| "Can't see patients list" | Check user has `visits:read` permission |
| "Can't start visit" | Ensure branch + visit types + price books seeded |
| "Invoice not visible" | Visit must be advanced to Billing dept first |
| "No queue patients" | Patients must have `status=IN_PROGRESS` to appear |

---

**Version**: 1.0.0  
**Last Updated**: April 2, 2026  
**Status**: ✅ Ready for Testing
