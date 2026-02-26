import { z } from "zod";

export const CreateInvoiceSchema = z.object({
    patientId: z.string().uuid(),
    amount: z.number().positive(),
    remarks: z.string().optional(),
});
