import { router, protectedProcedure } from "../../trpc/init";
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
            // Create invoice logic goes here
            return { success: true, message: "Invoice created" };
        }),

    listInvoices: protectedProcedure
        .use(hasPermission("billing:view_invoices"))
        .query(async ({ ctx }) => {
            return [];
        }),
});
