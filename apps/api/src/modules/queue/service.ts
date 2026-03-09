import { db } from "@visyx/db/client";
import {
    departments,
    invoices,
    patients,
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
                    sql`DATE(${visits.registeredAt}) = ${todayStr}`
                )
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
                    sql`DATE(${visits.registeredAt}) = ${todayStr}`
                )
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
                    sql`DATE(${visits.registeredAt}) = ${todayStr}`
                )
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
                { name: string; code: string; patients: Omit<typeof results[0], "departmentName" | "departmentCode">[] }
            >
        );

        return Object.values(grouped);
    }

    /**
     * Starts a new visit: adds to queue, initiates invoice.
     */
    async startVisit(input: StartVisitInput) {
        return await db.transaction(async (tx) => {
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
            const [initialDept] = await tx
                .select()
                .from(departments)
                .where(eq(departments.code, firstStepCode));

            if (!initialDept) {
                throw new Error(`Initial department ${firstStepCode} not found in DB`);
            }

            // 3. Generate Ticket
            const ticketNumber = await this.generateTicketNumber(input.branchId);

            // 4. Create Visit
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
                })
                .returning();

            if (!newVisit) {
                throw new Error("Failed to generate visit record");
            }

            // 5. Generate Empty Draft Invoice
            await tx.insert(invoices).values({
                visitId: newVisit.id,
                totalAmount: 0,
                amountPaid: 0,
                status: "DRAFT",
            });

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
                "Could not call patient. Ensure they are currently WAITING."
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
                        sql`${invoices.amountPaid} = 0` // Using sql template explicitly
                    )
                );

            return cancelled;
        });
    }
}

export const queueService = new QueueService();
