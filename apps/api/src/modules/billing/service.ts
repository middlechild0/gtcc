import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import {
  billableItems,
  departments,
  invoiceLineItems,
  invoiceLineItemOverrides,
  invoices,
  payments,
  priceBookEntries,
  products,
  services,
  taxRates,
  visits,
} from "@visyx/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type {
  AddLineItemInput,
  GetInvoiceForVisitInput,
  IssueInvoiceInput,
  RecordPaymentInput,
  RemoveLineItemInput,
} from "./schemas";

// ─── Helper: lock the invoice row and return it ───────────────────────────────
// Uses a typed sql<> to avoid QueryResult<Record<...>> cast issues.
async function lockInvoiceRow(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invoiceId: string,
) {
  const rows = await tx.execute(
    sql`SELECT id::text, status, total_amount::int FROM invoices WHERE id = ${invoiceId}::uuid FOR UPDATE`,
  );
  const row = rows.rows[0] as
    | { id: string; status: string; total_amount: number }
    | undefined;
  return row ?? null;
}

async function lockInvoiceRowByVisitId(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  visitId: string,
) {
  const rows = await tx.execute(
    sql`SELECT id::text, status, total_amount::int FROM invoices WHERE visit_id = ${visitId}::uuid FOR UPDATE`,
  );
  const row = rows.rows[0] as
    | { id: string; status: string; total_amount: number }
    | undefined;
  return row ?? null;
}

// ─── Helper: recompute and update invoice total inside a tx ──────────────────
// Never does read-modify-write; always sums from `invoice_line_items`.
async function recomputeInvoiceTotal(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  invoiceId: string,
) {
  await tx
    .update(invoices)
    .set({
      totalAmount: sql<number>`COALESCE(
        (SELECT SUM(total) FROM invoice_line_items WHERE invoice_id = ${invoiceId}::uuid),
        0
      )`,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));
}

export class BillingService {
  /**
   * Returns the full enriched invoice (with line items) for a given visit.
   */
  async getInvoiceForVisit(input: GetInvoiceForVisitInput) {
    const [visit] = await db
      .select({ id: visits.id, priceBookId: visits.priceBookId })
      .from(visits)
      .where(eq(visits.id, input.visitId))
      .limit(1);

    if (!visit) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Visit not found" });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.visitId, input.visitId))
      .limit(1);

    if (!invoice) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No invoice found for this visit",
      });
    }

    const lineItems = await db
      .select({
        id: invoiceLineItems.id,
        billableItemId: invoiceLineItems.billableItemId,
        billableItemName: invoiceLineItems.description,
        unitPrice: invoiceLineItems.unitPrice,
        quantity: invoiceLineItems.quantity,
        subtotal: invoiceLineItems.subtotal,
        vatAmount: invoiceLineItems.vatAmount,
        total: invoiceLineItems.total,
        isOverridden: invoiceLineItems.isOverridden,
        departmentSource: invoiceLineItems.departmentSource,
        departmentSourceCode: invoiceLineItems.departmentSourceCode,
        createdAt: invoiceLineItems.createdAt,
      })
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoice.id))
      .orderBy(invoiceLineItems.createdAt);

    return { invoice, lineItems, priceBookId: visit.priceBookId };
  }

  /**
   * Adds a billable item to a DRAFT invoice for a visit.
   *
   * Price resolution:
   *   - Looks up visits.priceBookId → price_book_entries
   *   - If no entry found: blocked unless actor has billing:override_price
   * Concurrency safety:
   *   - SELECT ... FOR UPDATE on the invoice row
   *   - Totals always recomputed via SUM, never read-modify-write
   */
  async addLineItem(
    input: AddLineItemInput,
    {
      hasOverridePermission,
      actorUserId,
    }: { hasOverridePermission: boolean; actorUserId: string },
  ) {
    return await db.transaction(async (tx) => {
      // 1. Fetch the visit (need priceBookId)
      const [visit] = await tx
        .select({ id: visits.id, priceBookId: visits.priceBookId })
        .from(visits)
        .where(eq(visits.id, input.visitId))
        .limit(1);

      if (!visit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Visit not found" });
      }

      // 2. Lock the invoice row (prevents concurrent total mutations)
      const invoice = await lockInvoiceRowByVisitId(tx, input.visitId);
      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found for this visit",
        });
      }

      if (invoice.status !== "DRAFT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Cannot add items to an invoice with status "${invoice.status}". Only DRAFT invoices can be modified.`,
        });
      }

      // 3. Fetch and validate the billable item (must be active)
      const [bItem] = await tx
        .select()
        .from(billableItems)
        .where(
          and(
            eq(billableItems.id, input.billableItemId),
            eq(billableItems.isActive, true),
          ),
        )
        .limit(1);

      if (!bItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Billable item not found or is inactive",
        });
      }

      // 4. Validate the underlying service/product is also active
      if (bItem.serviceId) {
        const [svc] = await tx
          .select({ isActive: services.isActive })
          .from(services)
          .where(eq(services.id, bItem.serviceId))
          .limit(1);
        if (!svc?.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The service linked to this item is inactive",
          });
        }
      }
      if (bItem.productId) {
        const [prd] = await tx
          .select({ isActive: products.isActive })
          .from(products)
          .where(eq(products.id, bItem.productId))
          .limit(1);
        if (!prd?.isActive) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "The product linked to this item is inactive",
          });
        }
      }

      // 5. Resolve price from price book
      let unitPrice = 0;
      let priceFound = false;

      if (visit.priceBookId) {
        const [pbEntry] = await tx
          .select({ price: priceBookEntries.price })
          .from(priceBookEntries)
          .where(
            and(
              eq(priceBookEntries.priceBookId, visit.priceBookId),
              eq(priceBookEntries.billableItemId, bItem.id),
            ),
          )
          .limit(1);

        if (pbEntry !== undefined) {
          unitPrice = pbEntry.price;
          priceFound = true;
        }
      }

      // 6. Missing price policy: block unless actor has override permission
      const isOverridden = !priceFound;
      if (isOverridden && !hasOverridePermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "No price found for this item in the patient's price book. You need the 'Override Price' permission to add it at a custom or zero price.",
        });
      }

      // 7. Resolve VAT (per-line, rounded per-line)
      let vatAmount = 0;
      let vatExempt = true; // default safe

      if (bItem.serviceId) {
        const [svc] = await tx
          .select({ vatExempt: services.vatExempt })
          .from(services)
          .where(eq(services.id, bItem.serviceId))
          .limit(1);
        vatExempt = svc?.vatExempt ?? true;
      } else if (bItem.productId) {
        const [prd] = await tx
          .select({ vatExempt: products.vatExempt })
          .from(products)
          .where(eq(products.id, bItem.productId))
          .limit(1);
        vatExempt = prd?.vatExempt ?? false;
      }

      if (!vatExempt) {
        const [defaultTax] = await tx
          .select({ rate: taxRates.rate })
          .from(taxRates)
          .where(and(eq(taxRates.isDefault, true), eq(taxRates.isActive, true)))
          .limit(1);
        if (defaultTax) {
          vatAmount = Math.round(
            (unitPrice * input.quantity * defaultTax.rate) / 100,
          );
        }
      }

      // 8. Resolve the department name for display
      const [dept] = await tx
        .select({ name: departments.name })
        .from(departments)
        .where(eq(departments.code, input.departmentCode))
        .limit(1);

      const subtotal = unitPrice * input.quantity;
      const total = subtotal + vatAmount;

      // 9. Insert the line item
      const [newLineItem] = await tx
        .insert(invoiceLineItems)
        .values({
          invoiceId: invoice.id,
          billableItemId: bItem.id,
          description: bItem.name,
          unitPrice,
          quantity: input.quantity,
          subtotal,
          vatAmount,
          total,
          isOverridden,
          departmentSource: dept?.name ?? input.departmentCode,
          departmentSourceCode: input.departmentCode,
        })
        .returning();

      // 10. If price was overridden (no book entry), write an override audit log
      if (isOverridden && newLineItem) {
        await tx.insert(invoiceLineItemOverrides).values({
          lineItemId: newLineItem.id,
          originalPrice: 0,
          newPrice: unitPrice,
          reason: "OTHER",
          note: "Item not in price book — added with override permission",
          changedById: actorUserId,
        });
      }

      // 11. Recompute invoice total from SUM (not read-modify-write)
      await recomputeInvoiceTotal(tx, invoice.id);

      return newLineItem;
    });
  }

  /**
   * Removes a line item from a DRAFT invoice.
   *
   * Own-line rule: billing:add_line_item → remove own dept's lines.
   * billing:edit_invoice → remove any line (cashier scope).
   */
  async removeLineItem(
    input: RemoveLineItemInput,
    { hasEditInvoicePermission }: { hasEditInvoicePermission: boolean },
  ) {
    return await db.transaction(async (tx) => {
      // 1. Fetch the line item
      const [lineItem] = await tx
        .select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.id, input.lineItemId))
        .limit(1);

      if (!lineItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Line item not found",
        });
      }

      // 2. Lock and validate the invoice
      const invoice = await lockInvoiceRow(tx, lineItem.invoiceId);
      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      if (invoice.status !== "DRAFT") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot modify a non-DRAFT invoice",
        });
      }

      // 3. Own-line permission check
      const isOwnLine = lineItem.departmentSourceCode === input.departmentCode;
      if (!isOwnLine && !hasEditInvoicePermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You can only remove line items added by your own department. A cashier-level permission is required to remove items from other departments.",
        });
      }

      // 4. Delete the line item
      await tx
        .delete(invoiceLineItems)
        .where(eq(invoiceLineItems.id, input.lineItemId));

      // 5. Recompute invoice total
      await recomputeInvoiceTotal(tx, invoice.id);

      return { success: true };
    });
  }

  /**
   * Transitions a DRAFT invoice to ISSUED (cashier finalises the bill).
   * Insurance visits stay ISSUED until claim reconciled.
   */
  async issueInvoice(input: IssueInvoiceInput) {
    return await db.transaction(async (tx) => {
      const invoice = await lockInvoiceRow(tx, input.invoiceId);

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      if (invoice.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invoice is already "${invoice.status}" — only DRAFT invoices can be issued`,
        });
      }

      const [updated] = await tx
        .update(invoices)
        .set({ status: "ISSUED", updatedAt: new Date() })
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return updated;
    });
  }

  /**
   * Records a payment against an ISSUED invoice.
   * Recomputes amountPaid from the payments table and marks PAID when fully covered.
   */
  async recordPayment(input: RecordPaymentInput) {
    return await db.transaction(async (tx) => {
      // Lock the invoice row
      const invoice = await lockInvoiceRow(tx, input.invoiceId);

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      if (invoice.status === "VOIDED" || invoice.status === "PAID") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot record a payment against an invoice with status "${invoice.status}"`,
        });
      }

      // Insert the payment record
      const [newPayment] = await tx
        .insert(payments)
        .values({
          invoiceId: input.invoiceId,
          amount: input.amount,
          paymentMode: input.paymentMode,
          receiptNumber: input.receiptNumber,
        })
        .returning();

      // Recompute total paid from the payments table (not read-modify-write)
      const result = await tx.execute(
        sql`SELECT COALESCE(SUM(amount), 0)::int AS total_paid FROM payments WHERE invoice_id = ${input.invoiceId}::uuid`,
      );
      const totalPaid = (result.rows[0] as { total_paid: number } | undefined)
        ?.total_paid ?? 0;

      const newStatus: "DRAFT" | "ISSUED" | "PAID" | "VOIDED" =
        totalPaid >= invoice.total_amount ? "PAID" : (invoice.status as "DRAFT" | "ISSUED");

      await tx
        .update(invoices)
        .set({ amountPaid: totalPaid, status: newStatus, updatedAt: new Date() })
        .where(eq(invoices.id, input.invoiceId));

      return { payment: newPayment, totalPaid, invoiceStatus: newStatus };
    });
  }
}

export const billingService = new BillingService();
