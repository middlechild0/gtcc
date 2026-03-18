import { db } from "@visyx/db/client";
import { invoices } from "@visyx/db/schema";
import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { insuranceRouter } from "./insurance/router";
import { CreateInvoiceSchema } from "./schemas";

export const billingRouter = router({
  // Mount the insurance sub-router under billing
  insurance: insuranceRouter,

  createInvoice: protectedProcedure
    .use(hasPermission("billing:create_invoice"))
    .input(CreateInvoiceSchema)
    .mutation(async ({ input, ctx }) => {
      const _result = await db
        .insert(invoices)
        .values({
          patientId: String(input.patientId),
          amount: String(input.amount),
          paymentType: input.paymentType,
          createdBy: ctx.authUserId,
          createdAt: new Date(),
        })
        .returning();
      return { success: true, message: "Invoice created" };
    }),

  listInvoices: protectedProcedure
    .use(hasPermission("billing:view_invoices"))
    .query(async ({ ctx }) => {
      return [];
    }),
});
