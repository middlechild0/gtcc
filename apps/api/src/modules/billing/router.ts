import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { insuranceRouter } from "./insurance/router";
import {
  AddLineItemSchema,
  GetInvoiceForVisitSchema,
  IssueInvoiceSchema,
  RecordPaymentSchema,
  RemoveLineItemSchema,
} from "./schemas";
import { billingService } from "./service";

export const billingRouter = router({
  // Mount the insurance sub-router
  insurance: insuranceRouter,

  /**
   * Get the full enriched invoice (with line items) for a visit.
   * Used by all department workstation UIs to render the billing panel.
   */
  getInvoiceForVisit: protectedProcedure
    .use(hasPermission("billing:view_invoices"))
    .input(GetInvoiceForVisitSchema)
    .query(async ({ input }) => {
      return billingService.getInvoiceForVisit(input);
    }),

  /**
   * Add a billable item to a DRAFT invoice from a department workstation.
   * Resolves price from the visit's price book automatically.
   * Blocks if item has no price and actor lacks billing:override_price.
   */
  addLineItem: protectedProcedure
    .use(hasPermission("billing:add_line_item"))
    .use(withAuditLog("billing:add_line_item", "invoice_line_item"))
    .input(AddLineItemSchema)
    .mutation(async ({ input, ctx }) => {
      const hasOverridePermission =
        ctx.isSuperuser ||
        ctx.isStaffAdmin ||
        ctx.permissionKeys.includes("billing:override_price");

      return billingService.addLineItem(input, {
        hasOverridePermission,
        actorUserId: ctx.authUserId!,
      });
    }),

  /**
   * Remove a line item from a DRAFT invoice.
   * Own-line rule: billing:add_line_item lets you remove your dept's own lines.
   * billing:edit_invoice lets you remove any line (cashier).
   */
  removeLineItem: protectedProcedure
    .use(hasPermission("billing:add_line_item"))
    .use(withAuditLog("billing:remove_line_item", "invoice_line_item"))
    .input(RemoveLineItemSchema)
    .mutation(async ({ input, ctx }) => {
      const hasEditInvoicePermission =
        ctx.isSuperuser ||
        ctx.isStaffAdmin ||
        ctx.permissionKeys.includes("billing:edit_invoice");

      return billingService.removeLineItem(input, { hasEditInvoicePermission });
    }),

  /**
   * Transition an invoice from DRAFT → ISSUED (cashier finalises the bill).
   * After this, only cashier-level overrides can change line items.
   */
  issueInvoice: protectedProcedure
    .use(hasPermission("billing:edit_invoice"))
    .use(withAuditLog("billing:edit_invoice", "invoice"))
    .input(IssueInvoiceSchema)
    .mutation(async ({ input }) => {
      return billingService.issueInvoice(input);
    }),

  /**
   * Record a payment against an invoice (cashier flow).
   * Automatically sets status to PAID once totalAmount is fully covered.
   */
  recordPayment: protectedProcedure
    .use(hasPermission("billing:record_payment"))
    .use(withAuditLog("billing:record_payment", "invoice"))
    .input(RecordPaymentSchema)
    .mutation(async ({ input }) => {
      return billingService.recordPayment(input);
    }),
});
