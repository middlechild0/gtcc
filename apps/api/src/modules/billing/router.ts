import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { insuranceRouter } from "./insurance/router";
import {
  CreateInvoiceSchema,
  ExportInvoicesCsvSchema,
  GetInvoiceSchema,
  ListInvoicesSchema,
} from "./schemas";
import { billingService } from "./service";

export const billingRouter = router({
  // Mount the insurance sub-router under billing
  insurance: insuranceRouter,

  createInvoice: protectedProcedure
    .use(hasPermission("billing:create_invoice"))
    .input(CreateInvoiceSchema)
    .mutation(async ({ input, ctx }) => {
      return billingService.createInvoice({
        input,
        authUserId: ctx.authUserId,
      });
    }),

  listInvoices: protectedProcedure
    .use(hasPermission("billing:view_invoices"))
    .input(ListInvoicesSchema)
    .query(async ({ input }) => billingService.listInvoices(input)),

  getInvoiceById: protectedProcedure
    .use(hasPermission("billing:view_invoices"))
    .input(GetInvoiceSchema)
    .query(async ({ input }) => billingService.getInvoiceById(input)),

  exportInvoicesCsv: protectedProcedure
    .use(hasPermission("billing:view_invoices"))
    .input(ExportInvoicesCsvSchema)
    .mutation(async ({ input }) => billingService.exportInvoicesCsv(input)),
});
