import { db } from "@visyx/db/client";
import {
  billableItems,
  departments,
  invoiceLineItems,
  invoices,
  patientInsurances,
  patients,
  priceBookEntries,
  priceBooks,
  services,
  taxRates,
  visits,
  visitTypes,
} from "@visyx/db/schema";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import type {
  GetDepartmentPoolInput,
  StartVisitInput,
  TransferPatientInput,
  UpdateVisitStatusInput,
} from "./schemas";

export class QueueService {
  /**
   * Generates a ticket sequence number for the day.
   */
  private async generateTicketNumber(branchId: number): Promise<string> {
    const todayStr = new Date().toISOString().split("T")[0];
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visits)
      .where(
        and(
          eq(visits.branchId, branchId),
          sql`DATE(${visits.registeredAt}) = ${todayStr}`,
        ),
      );

    const count = countResult[0]?.count ?? 0;
    const sequence = count + 1;
    return sequence.toString().padStart(3, "0");
  }

  /**
   * Fetches all active visit types for the UI select dropdowns.
   */
  async getVisitTypes() {
    return db
      .select()
      .from(visitTypes)
      .where(eq(visitTypes.isActive, true))
      .orderBy(visitTypes.name);
  }

  /**
   * Fetches all actively waiting patients in a specific department for today.
   */
  async getDepartmentPool(input: GetDepartmentPoolInput) {
    const todayStr = new Date().toISOString().split("T")[0];

    return db
      .select({
        id: visits.id,
        ticketNumber: visits.ticketNumber,
        priority: visits.priority,
        status: visits.status,
        registeredAt: visits.registeredAt,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          patientNumber: patients.patientNumber,
        },
        visitType: {
          name: visitTypes.name,
        },
      })
      .from(visits)
      .innerJoin(patients, eq(visits.patientId, patients.id))
      .innerJoin(visitTypes, eq(visits.visitTypeId, visitTypes.id))
      .innerJoin(departments, eq(visits.currentDepartmentId, departments.id))
      .where(
        and(
          eq(visits.branchId, input.branchId),
          eq(departments.code, input.departmentCode),
          eq(visits.status, "WAITING"),
          sql`DATE(${visits.registeredAt}) = ${todayStr}`,
        ),
      )
      .orderBy(desc(visits.priority), visits.registeredAt);
  }

  /**
   * Fetches the global overview for receptionists and managers.
   */
  async getGlobalOverview(branchId: number) {
    const todayStr = new Date().toISOString().split("T")[0];
    const results = await db
      .select({
        id: visits.id,
        ticketNumber: visits.ticketNumber,
        status: visits.status,
        priority: visits.priority,
        patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
        departmentName: departments.name,
        departmentCode: departments.code,
      })
      .from(visits)
      .innerJoin(patients, eq(visits.patientId, patients.id))
      .innerJoin(departments, eq(visits.currentDepartmentId, departments.id))
      .where(
        and(
          eq(visits.branchId, branchId),
          ne(visits.status, "DONE"),
          sql`DATE(${visits.registeredAt}) = ${todayStr}`,
        ),
      )
      .orderBy(visits.registeredAt);

    // Group by department
    const grouped = results.reduce(
      (acc, visit) => {
        if (!visit.departmentCode) return acc;
        const code = visit.departmentCode;
        if (!acc[code]) {
          acc[code] = {
            name: visit.departmentName,
            code: code,
            patients: [],
          };
        }

        // Exclude redundant fields from patient object
        const { departmentName, departmentCode, ...patientData } = visit;
        acc[code]!.patients.push(patientData);
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          code: string;
          patients: Omit<
            (typeof results)[0],
            "departmentName" | "departmentCode"
          >[];
        }
      >,
    );

    return Object.values(grouped);
  }

  /**
   * Starts a new visit: adds to queue, initiates invoice.
   */
  async startVisit(input: StartVisitInput) {
    return await db.transaction(async (tx) => {
      if (input.payerType === "INSURANCE") {
        if (!input.insuranceProviderId) {
          throw new Error(
            "Insurance provider is required for insurance visits",
          );
        }

        const insuranceRecord = await tx.query.patientInsurances.findFirst({
          where: and(
            eq(patientInsurances.patientId, input.patientId),
            eq(patientInsurances.providerId, input.insuranceProviderId),
            eq(patientInsurances.isActive, true),
          ),
          with: {
            provider: true,
            scheme: true,
          },
        });

        if (!insuranceRecord) {
          throw new Error(
            "Patient has no active insurance record for the selected provider",
          );
        }

        const requiresPreAuth =
          insuranceRecord.scheme?.requiresPreAuth ??
          insuranceRecord.provider.requiresPreAuth;

        if (requiresPreAuth && !insuranceRecord.preAuthNumber?.trim()) {
          throw new Error(
            "Pre-authorization number is required before starting this insurance visit",
          );
        }
      }

      // 1. Fetch visit type details
      const [vType] = await tx
        .select()
        .from(visitTypes)
        .where(eq(visitTypes.id, input.visitTypeId));

      if (!vType || !vType.workflowSteps) {
        throw new Error("Invalid visit type or missing workflow steps");
      }

      const steps = vType.workflowSteps as string[];
      if (steps.length === 0) {
        throw new Error("Visit type has no workflow steps");
      }

      // 2. Determine initial department
      const firstStepCode = steps[0];
      if (!firstStepCode) {
        throw new Error("Initial department code is missing from workflow");
      }
      const [initialDept] = await tx
        .select()
        .from(departments)
        .where(eq(departments.code, firstStepCode));

      if (!initialDept) {
        throw new Error(`Initial department ${firstStepCode} not found in DB`);
      }

      // 3. Find the applicable price book
      let priceBookId: number | null = null;
      const pbConditions = [
        eq(priceBooks.isActive, true),
        eq(priceBooks.type, input.payerType),
        // optionally branch specific, though cash could be global
      ];

      // Prefer branch specific book if defined
      // Since drizzle doesn't easily do "ORDER BY strictness" in a single query reliably without complex SQL,
      // we'll fetch them and sort in memory, or just look for exact match first.
      let matchedBook = null;

      // Try Exact Match first (Branch + PayerType + Insurance)
      const exactConditions = [
        ...pbConditions,
        eq(priceBooks.branchId, input.branchId),
      ];
      if (input.payerType === "INSURANCE" && input.insuranceProviderId) {
        exactConditions.push(
          eq(priceBooks.insuranceProviderId, input.insuranceProviderId),
        );
      }
      const [exactBook] = await tx
        .select()
        .from(priceBooks)
        .where(and(...exactConditions))
        .limit(1);

      if (exactBook) {
        matchedBook = exactBook;
      } else {
        // Try Global Match (No Branch)
        const globalConditions = [...pbConditions];
        // using sql`priceBooks.branchId IS NULL` in Drizzle could be tricky, using isNull if we exported it,
        // but let's just fetch potential matches and filter
        if (input.payerType === "INSURANCE" && input.insuranceProviderId) {
          globalConditions.push(
            eq(priceBooks.insuranceProviderId, input.insuranceProviderId),
          );
        }
        const globalBooks = await tx
          .select()
          .from(priceBooks)
          .where(and(...globalConditions));
        matchedBook = globalBooks.find((b) => b.branchId === null);
      }

      if (matchedBook) {
        priceBookId = matchedBook.id;
      }

      // 4. Generate Ticket
      const ticketNumber = await this.generateTicketNumber(input.branchId);

      // 5. Create Visit
      const [newVisit] = await tx
        .insert(visits)
        .values({
          patientId: input.patientId,
          branchId: input.branchId,
          visitTypeId: input.visitTypeId,
          ticketNumber,
          priority: input.priority,
          currentDepartmentId: initialDept.id,
          status: "WAITING",
          payerType: input.payerType,
          priceBookId,
        })
        .returning();

      if (!newVisit) {
        throw new Error("Failed to generate visit record");
      }

      // 6. Generate Empty Draft Invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          visitId: newVisit.id,
          totalAmount: 0,
          amountPaid: 0,
          status: "DRAFT",
        })
        .returning();

      // 7. Add Default Service if defined on the Visit Type
      if (vType.defaultServiceId) {
        // Find billable item mapping for this service
        const [bItem] = await tx
          .select()
          .from(billableItems)
          .where(eq(billableItems.serviceId, vType.defaultServiceId));

        if (bItem && newInvoice) {
          // Find price in pricebook
          let unitPrice = 0; // Default if not found
          if (priceBookId) {
            const [pbEntry] = await tx
              .select()
              .from(priceBookEntries)
              .where(
                and(
                  eq(priceBookEntries.priceBookId, priceBookId),
                  eq(priceBookEntries.billableItemId, bItem.id),
                ),
              );
            if (pbEntry) {
              unitPrice = pbEntry.price;
            }
          }

          // Get service vatExempt status
          const [service] = await tx
            .select()
            .from(services)
            .where(eq(services.id, vType.defaultServiceId));
          let vatAmount = 0;

          if (service && !service.vatExempt) {
            // Find default tax rate
            const [defaultTax] = await tx
              .select()
              .from(taxRates)
              .where(eq(taxRates.isDefault, true));
            if (defaultTax) {
              vatAmount = Math.round((unitPrice * defaultTax.rate) / 100);
            }
          }

          const subtotal = unitPrice * 1; // quantity is 1
          const total = subtotal + vatAmount;

          await tx.insert(invoiceLineItems).values({
            invoiceId: newInvoice.id,
            billableItemId: bItem.id,
            description: bItem.name,
            unitPrice,
            quantity: 1,
            subtotal,
            vatAmount,
            total,
            departmentSource: initialDept.name,
            departmentSourceCode: initialDept.code,
          });

          // Recompute invoice total from SUM (consistent with BillingService, safe for concurrent edits)
          await tx
            .update(invoices)
            .set({
              totalAmount: sql`COALESCE((SELECT SUM(total) FROM invoice_line_items WHERE invoice_id = ${newInvoice.id}), 0)`,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, newInvoice.id));
        }
      }

      return newVisit;
    });
  }

  /**
   * Transitions a patient from WAITING to IN_PROGRESS.
   */
  async callPatient(input: UpdateVisitStatusInput) {
    const [updated] = await db
      .update(visits)
      .set({ status: "IN_PROGRESS" })
      .where(and(eq(visits.id, input.visitId), eq(visits.status, "WAITING")))
      .returning();

    if (!updated) {
      throw new Error(
        "Could not call patient. Ensure they are currently WAITING.",
      );
    }
    return updated;
  }

  /**
   * Advances the patient to the next workflow step defined by their visit type.
   */
  async advanceWorkflow(input: UpdateVisitStatusInput) {
    return await db.transaction(async (tx) => {
      // Get current visit and its workflow definition
      const [visit] = await tx
        .select({
          id: visits.id,
          currentDepartmentId: visits.currentDepartmentId,
          workflowSteps: visitTypes.workflowSteps,
          departmentCode: departments.code,
        })
        .from(visits)
        .innerJoin(visitTypes, eq(visits.visitTypeId, visitTypes.id))
        .innerJoin(departments, eq(visits.currentDepartmentId, departments.id))
        .where(eq(visits.id, input.visitId));

      if (!visit) throw new Error("Visit not found");

      const stepsData = visit.workflowSteps as string[];
      const currentIndex = stepsData.indexOf(visit.departmentCode!);

      // Check if they are at the end
      if (currentIndex === -1 || currentIndex >= stepsData.length - 1) {
        // Workflow complete
        const [completed] = await tx
          .update(visits)
          .set({ status: "DONE", completedAt: new Date() })
          .where(eq(visits.id, input.visitId))
          .returning();
        return { completed: true, visit: completed };
      }

      // Move to next department
      const nextDeptCode = stepsData[currentIndex + 1];
      if (!nextDeptCode) {
        throw new Error("No further steps mapped for this workflow");
      }

      const [nextDept] = await tx
        .select()
        .from(departments)
        .where(eq(departments.code, nextDeptCode as string));

      if (!nextDept) {
        throw new Error(`Next department ${nextDeptCode} not found in DB`);
      }

      const [advanced] = await tx
        .update(visits)
        .set({
          currentDepartmentId: nextDept.id,
          status: "WAITING",
        })
        .where(eq(visits.id, input.visitId))
        .returning();

      return { completed: false, visit: advanced };
    });
  }

  /**
   * Manually overrides the workflow to transfer to a specific department.
   */
  async transferPatient(input: TransferPatientInput) {
    const [updated] = await db
      .update(visits)
      .set({
        currentDepartmentId: input.targetDepartmentId,
        status: "WAITING",
      })
      .where(eq(visits.id, input.visitId))
      .returning();

    if (!updated) throw new Error("Visit not found");
    return updated;
  }

  /**
   * Bumps a patient to URGENT priority.
   */
  async markUrgent(input: UpdateVisitStatusInput) {
    const [updated] = await db
      .update(visits)
      .set({ priority: "URGENT" })
      .where(eq(visits.id, input.visitId))
      .returning();
    if (!updated) throw new Error("Visit not found");
    return updated;
  }

  /**
   * Cancels an ongoing visit and voids its draft invoice if unpaid.
   */
  async cancelVisit(input: UpdateVisitStatusInput) {
    return await db.transaction(async (tx) => {
      const [cancelled] = await tx
        .update(visits)
        .set({ status: "DONE", completedAt: new Date() })
        .where(eq(visits.id, input.visitId))
        .returning();

      if (!cancelled) throw new Error("Visit not found");

      // Void the invoice only if no payments were made
      await tx
        .update(invoices)
        .set({ status: "VOIDED" })
        .where(
          and(
            eq(invoices.visitId, cancelled.id),
            sql`${invoices.amountPaid} = 0`, // Using sql template explicitly
          ),
        );

      return cancelled;
    });
  }
}

export const queueService = new QueueService();
