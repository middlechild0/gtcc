import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { departments, services, visits, visitTypes } from "@visyx/db/schema";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import type {
  CreateDepartmentInput,
  CreateVisitTypeInput,
  UpdateDepartmentInput,
  UpdateVisitTypeInput,
} from "./schemas";

function normalizeVisitTypeName(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeWorkflowStepCodes(steps: string[]): string[] {
  const out = steps.map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (out.length !== new Set(out).size) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Duplicate workflow steps are not allowed",
    });
  }
  return out;
}

function mapPgErrorToTrpc(error: unknown): TRPCError {
  const pgCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : null;

  if (pgCode === "23505") {
    return new TRPCError({
      code: "CONFLICT",
      message: "A record with the same unique value already exists",
    });
  }

  if (pgCode === "23503") {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "A referenced record does not exist",
    });
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected database error",
    cause: error,
  });
}

export class WorkflowService {
  async listDepartments() {
    return db.select().from(departments).orderBy(departments.name);
  }

  async listVisitTypes() {
    return db.select().from(visitTypes).orderBy(visitTypes.name);
  }

  async createDepartment(input: CreateDepartmentInput) {
    const name = input.name.trim();
    const code = input.code;

    const [dup] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.code, code))
      .limit(1);

    if (dup) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `A department with code ${code} already exists`,
      });
    }

    let row: typeof departments.$inferSelect | undefined;
    try {
      [row] = await db
        .insert(departments)
        .values({ name, code, isActive: true })
        .returning();
    } catch (error) {
      throw mapPgErrorToTrpc(error);
    }

    if (!row) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create department",
      });
    }

    return row;
  }

  async updateDepartment(input: UpdateDepartmentInput) {
    const [existing] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, input.id))
      .limit(1);

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Department not found",
      });
    }

    if (input.isActive === false && existing.isActive) {
      await this.assertDepartmentCanDeactivate(existing.id, existing.code);
    }

    const patch: Partial<typeof existing> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.isActive !== undefined) patch.isActive = input.isActive;

    if (Object.keys(patch).length === 0) {
      return existing;
    }

    const [updated] = await db
      .update(departments)
      .set(patch)
      .where(eq(departments.id, input.id))
      .returning();

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update department",
      });
    }

    return updated;
  }

  private async assertDepartmentCanDeactivate(
    departmentId: number,
    departmentCode: string,
  ) {
    const activeVisitCount = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(visits)
      .where(
        and(
          eq(visits.currentDepartmentId, departmentId),
          ne(visits.status, "DONE"),
        ),
      );

    const n = activeVisitCount[0]?.c ?? 0;
    if (n > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Cannot deactivate: there are active visits still assigned to this department",
      });
    }

    const [workflowReference] = await db
      .select({ id: visitTypes.id })
      .from(visitTypes)
      .where(
        sql`${visitTypes.workflowSteps} @> ${JSON.stringify([departmentCode])}::jsonb`,
      )
      .limit(1);

    const referencesWorkflow = Boolean(workflowReference);

    if (referencesWorkflow) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "Cannot deactivate: this department code is still used in a visit type workflow. Remove it from all workflows first.",
      });
    }
  }

  private async assertVisitTypeNameAvailable(
    normalizedName: string,
    excludeId?: number,
  ) {
    const matches = await db
      .select({ id: visitTypes.id })
      .from(visitTypes)
      .where(sql`lower(trim(${visitTypes.name})) = ${normalizedName}`);

    const conflict = matches.find((m) => m.id !== excludeId);
    if (conflict) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A visit type with this name already exists",
      });
    }
  }

  private async resolveActiveDepartmentRowsForSteps(codes: string[]) {
    const uniqueCodes = [...new Set(codes)];

    const matchedRows = await db
      .select({ code: departments.code, isActive: departments.isActive })
      .from(departments)
      .where(inArray(departments.code, uniqueCodes));

    const byCode = new Map(matchedRows.map((d) => [d.code, d]));

    for (const code of codes) {
      const dept = byCode.get(code);
      if (!dept) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown department code in workflow: ${code}`,
        });
      }
      if (!dept.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Department ${code} is inactive and cannot be used in a workflow`,
        });
      }
    }
  }

  async createVisitType(input: CreateVisitTypeInput) {
    const name = input.name.trim();
    const normalizedName = normalizeVisitTypeName(name);
    await this.assertVisitTypeNameAvailable(normalizedName);

    const steps = normalizeWorkflowStepCodes(input.workflowSteps);
    if (steps.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Workflow must contain at least one valid step",
      });
    }

    await this.resolveActiveDepartmentRowsForSteps(steps);

    if (input.defaultServiceId != null) {
      await this.assertServiceExists(input.defaultServiceId);
    }

    let row: typeof visitTypes.$inferSelect | undefined;
    try {
      [row] = await db
        .insert(visitTypes)
        .values({
          name,
          workflowSteps: steps,
          isActive: input.isActive ?? true,
          defaultServiceId: input.defaultServiceId ?? null,
        })
        .returning();
    } catch (error) {
      throw mapPgErrorToTrpc(error);
    }

    if (!row) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create visit type",
      });
    }

    return row;
  }

  async updateVisitType(input: UpdateVisitTypeInput) {
    const [existing] = await db
      .select()
      .from(visitTypes)
      .where(eq(visitTypes.id, input.id))
      .limit(1);

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Visit type not found",
      });
    }

    if (input.name !== undefined) {
      const name = input.name.trim();
      await this.assertVisitTypeNameAvailable(
        normalizeVisitTypeName(name),
        input.id,
      );
    }

    let steps: string[] | undefined;
    if (input.workflowSteps !== undefined) {
      steps = normalizeWorkflowStepCodes(input.workflowSteps);
      if (steps.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Workflow must contain at least one valid step",
        });
      }
      await this.resolveActiveDepartmentRowsForSteps(steps);
    }

    if (
      input.defaultServiceId !== undefined &&
      input.defaultServiceId !== null
    ) {
      await this.assertServiceExists(input.defaultServiceId);
    }

    const hasUpdates =
      input.name !== undefined ||
      steps !== undefined ||
      input.isActive !== undefined ||
      input.defaultServiceId !== undefined;

    if (!hasUpdates) {
      return existing;
    }

    let updated: typeof visitTypes.$inferSelect | undefined;
    try {
      [updated] = await db
        .update(visitTypes)
        .set({
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(steps !== undefined ? { workflowSteps: steps } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input.defaultServiceId !== undefined
            ? { defaultServiceId: input.defaultServiceId }
            : {}),
        })
        .where(eq(visitTypes.id, input.id))
        .returning();
    } catch (error) {
      throw mapPgErrorToTrpc(error);
    }

    if (!updated) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update visit type",
      });
    }

    return updated;
  }

  private async assertServiceExists(serviceId: number) {
    const [svc] = await db
      .select({ id: services.id })
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1);

    if (!svc) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "defaultServiceId does not reference a valid service",
      });
    }
  }
}

export const workflowService = new WorkflowService();
