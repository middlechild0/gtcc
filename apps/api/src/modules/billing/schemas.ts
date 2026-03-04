import { z } from "zod";

export const PaymentTypeEnum = z.enum([
  "credit_card",
  "debit_card",
  "bank_transfer",
  "cash",
  "insurance",
]);

export const CreateInvoiceSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID format"),
  amount: z.number().positive("Amount must be greater than 0"),
  paymentType: PaymentTypeEnum.array().min(
    1,
    "At least one payment type required",
  ),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;

export const ListInvoicesSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type ListInvoicesInput = z.infer<typeof ListInvoicesSchema>;

export const ExportInvoicesCsvSchema = z.object({
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type ExportInvoicesCsvInput = z.infer<typeof ExportInvoicesCsvSchema>;

export const GetInvoiceSchema = z.object({
  id: z.string().uuid("Invalid invoice ID format"),
});

export type GetInvoiceInput = z.infer<typeof GetInvoiceSchema>;
