import { db } from "../client";
import { departments, visitTypes } from "../schema";
import { eq } from "drizzle-orm";

export const defaultDepartments = [
    { code: "RECEPTION", name: "Reception", isActive: true },
    { code: "TRIAGE", name: "Triage / Pre-test", isActive: true },
    { code: "DOCTOR", name: "Doctor Room", isActive: true },
    { code: "OPTICIAN", name: "Optician", isActive: true },
    { code: "TECHNICIAN", name: "Technician / Lab", isActive: true },
    { code: "CASHIER", name: "Cashier", isActive: true },
    { code: "DISPATCH", name: "Dispatch / Collection", isActive: true },
];

export const defaultVisitTypes = [
    {
        name: "Complete Eye Exam",
        workflowSteps: ["RECEPTION", "TRIAGE", "DOCTOR", "OPTICIAN", "CASHIER"],
        isActive: true,
    },
    {
        name: "Doctor Follow-up",
        workflowSteps: ["RECEPTION", "TRIAGE", "DOCTOR", "CASHIER"],
        isActive: true,
    },
    {
        name: "External Rx Glasses",
        workflowSteps: ["RECEPTION", "OPTICIAN", "CASHIER"],
        isActive: true,
    },
    {
        name: "Frame Repair",
        workflowSteps: ["RECEPTION", "TECHNICIAN", "CASHIER"],
        isActive: true,
    },
    {
        name: "Glasses Collection",
        workflowSteps: ["RECEPTION", "DISPATCH"],
        isActive: true,
    },
    {
        name: "Contact Lens Fitting",
        workflowSteps: ["RECEPTION", "DOCTOR", "OPTICIAN", "CASHIER"],
        isActive: true,
    },
    {
        name: "Emergency",
        workflowSteps: ["RECEPTION", "DOCTOR", "CASHIER"],
        isActive: true,
    },
];

export async function seedDepartmentsAndVisitTypes() {
    console.log("Seeding departments...");
    for (const dept of defaultDepartments) {
        await db
            .insert(departments)
            .values(dept)
            .onConflictDoUpdate({
                target: departments.code,
                set: { name: dept.name, isActive: dept.isActive },
            });
    }

    console.log("Seeding visit types...");
    for (const visitType of defaultVisitTypes) {
        // Visit types don't have a strict unique code, so we upsert by name
        const existing = await db.query.visitTypes.findFirst({
            where: eq(visitTypes.name, visitType.name),
        });

        if (existing) {
            await db
                .update(visitTypes)
                .set({
                    workflowSteps: visitType.workflowSteps,
                    isActive: visitType.isActive,
                })
                .where(eq(visitTypes.id, existing.id));
        } else {
            await db.insert(visitTypes).values(visitType);
        }
    }

    console.log("Finished seeding departments and visit types 🌱");
}

if (require.main === module) {
    seedDepartmentsAndVisitTypes()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error(e);
            process.exit(1);
        });
}
