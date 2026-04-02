import { z } from "zod";

// ─── Existing (kept for backwards compat) ────────────────────────────────────
export const CreateInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  amount: z.number().positive(),
  remarks: z.string().optional(),
});

// ─── Get invoice for a visit ──────────────────────────────────────────────────
export const GetInvoiceForVisitSchema = z.object({
  visitId: z.string().uuid(),
});

// ─── Add a line item to a draft invoice ──────────────────────────────────────
export const AddLineItemSchema = z.object({
  visitId: z.string().uuid(),
  billableItemId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  /** Code of the department adding this charge (e.g. "DOCTOR"). Used for own-line permission scoping. */
  departmentCode: z.string().min(1),
});

// ─── Remove a line item from a draft invoice ─────────────────────────────────
export const RemoveLineItemSchema = z.object({
  lineItemId: z.number().int().positive(),
  /** The actor's current department code — used to enforce own-line rule. */
  departmentCode: z.string().min(1),
});

// ─── Issue invoice (DRAFT → ISSUED) ──────────────────────────────────────────
export const IssueInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});

// ─── List issued invoices for cashier queue ─────────────────────────────────
export const ListIssuedInvoicesSchema = z.object({});

// ─── Record a payment ────────────────────────────────────────────────────────
export const RecordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().int().positive(),
  paymentMode: z.enum(["CASH", "MPESA", "CARD", "INSURANCE"]),
  /** Optional reference number (e.g. Mpesa transaction ID) */
  receiptNumber: z.string().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type GetInvoiceForVisitInput = z.infer<typeof GetInvoiceForVisitSchema>;
export type AddLineItemInput = z.infer<typeof AddLineItemSchema>;
export type RemoveLineItemInput = z.infer<typeof RemoveLineItemSchema>;
export type IssueInvoiceInput = z.infer<typeof IssueInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type ListIssuedInvoicesInput = z.infer<typeof ListIssuedInvoicesSchema>;
