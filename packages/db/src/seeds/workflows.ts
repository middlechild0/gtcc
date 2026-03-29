import { eq } from "drizzle-orm";
import { db } from "../client";
import { departments, visitTypes } from "../schema";

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

/** When true, seed may overwrite existing department names and visit type workflows (dev / explicit opt-in). */
function allowWorkflowSeedOverwrite(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_WORKFLOW_SEED_OVERWRITE === "1"
  );
}

export async function seedDepartmentsAndVisitTypes() {
  const allowOverwrite = allowWorkflowSeedOverwrite();

  console.log("Seeding departments...");
  for (const dept of defaultDepartments) {
    const existing = await db.query.departments.findFirst({
      where: eq(departments.code, dept.code),
    });

    if (existing) {
      if (allowOverwrite) {
        await db
          .update(departments)
          .set({ name: dept.name, isActive: dept.isActive })
          .where(eq(departments.id, existing.id));
      }
      continue;
    }

    await db.insert(departments).values(dept);
  }

  console.log("Seeding visit types...");
  for (const visitType of defaultVisitTypes) {
    const existing = await db.query.visitTypes.findFirst({
      where: eq(visitTypes.name, visitType.name),
    });

    if (existing) {
      if (allowOverwrite) {
        await db
          .update(visitTypes)
          .set({
            workflowSteps: visitType.workflowSteps,
            isActive: visitType.isActive,
          })
          .where(eq(visitTypes.id, existing.id));
      }
      continue;
    }

    await db.insert(visitTypes).values(visitType);
  }

  if (!allowOverwrite) {
    console.log(
      "  (Existing rows were left unchanged. Set ALLOW_WORKFLOW_SEED_OVERWRITE=1 or NODE_ENV=development to overwrite.)",
    );
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
