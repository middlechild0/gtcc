import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasGlobalPermission } from "../../trpc/middleware/withPermission";
import {
  CreateDepartmentSchema,
  CreateVisitTypeSchema,
  UpdateDepartmentSchema,
  UpdateVisitTypeSchema,
} from "./schemas";
import { workflowService } from "./service";

const workflowProcedure = protectedProcedure.use(
  hasGlobalPermission("queue:configure_workflows"),
);

export const workflowRouter = router({
  listDepartments: workflowProcedure.query(async () => {
    return workflowService.listDepartments();
  }),

  listVisitTypes: workflowProcedure.query(async () => {
    return workflowService.listVisitTypes();
  }),

  createDepartment: workflowProcedure
    .use(
      withAuditLog(
        "workflow:create_department",
        "department",
        (_input, result) => String(result.id),
      ),
    )
    .input(CreateDepartmentSchema)
    .mutation(async ({ input }) => {
      return workflowService.createDepartment(input);
    }),

  updateDepartment: workflowProcedure
    .use(
      withAuditLog(
        "workflow:update_department",
        "department",
        (_input, result) => String(result.id),
      ),
    )
    .input(UpdateDepartmentSchema)
    .mutation(async ({ input }) => {
      return workflowService.updateDepartment(input);
    }),

  createVisitType: workflowProcedure
    .use(
      withAuditLog(
        "workflow:create_visit_type",
        "visit_type",
        (_input, result) => String(result.id),
      ),
    )
    .input(CreateVisitTypeSchema)
    .mutation(async ({ input }) => {
      return workflowService.createVisitType(input);
    }),

  updateVisitType: workflowProcedure
    .use(
      withAuditLog(
        "workflow:update_visit_type",
        "visit_type",
        (_input, result) => String(result.id),
      ),
    )
    .input(UpdateVisitTypeSchema)
    .mutation(async ({ input }) => {
      return workflowService.updateVisitType(input);
    }),
});
