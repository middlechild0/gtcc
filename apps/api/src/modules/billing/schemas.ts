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
