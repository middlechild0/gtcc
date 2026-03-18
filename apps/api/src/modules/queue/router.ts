import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import {
  GetDepartmentPoolSchema,
  StartVisitSchema,
  TransferPatientSchema,
  UpdateVisitStatusSchema,
} from "./schemas";
import { queueService } from "./service";

export const queueRouter = router({
  getVisitTypes: protectedProcedure.query(async () => {
    return queueService.getVisitTypes();
  }),

  getDepartmentPool: protectedProcedure
    .input(GetDepartmentPoolSchema)
    .query(async ({ input }) => {
      return queueService.getDepartmentPool(input);
    }),

  getGlobalOverview: protectedProcedure
    .input(z.object({ branchId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return queueService.getGlobalOverview(input.branchId);
    }),

  startVisit: protectedProcedure
    .use(hasPermission("queue:manage"))
    .use(withAuditLog("queue:manage", "visit"))
    .input(StartVisitSchema)
    .mutation(async ({ input }) => {
      return queueService.startVisit(input);
    }),

  callPatient: protectedProcedure
    .use(hasPermission("queue:manage"))
    .use(withAuditLog("queue:manage", "visit", (input) => input.visitId))
    .input(UpdateVisitStatusSchema)
    .mutation(async ({ input }) => {
      return queueService.callPatient(input);
    }),

  advanceWorkflow: protectedProcedure
    .use(hasPermission("queue:manage"))
    .use(withAuditLog("queue:manage", "visit", (input) => input.visitId))
    .input(UpdateVisitStatusSchema)
    .mutation(async ({ input }) => {
      return queueService.advanceWorkflow(input);
    }),

  transferPatient: protectedProcedure
    .use(hasPermission("queue:transfer"))
    .use(withAuditLog("queue:transfer", "visit", (input) => input.visitId))
    .input(TransferPatientSchema)
    .mutation(async ({ input }) => {
      return queueService.transferPatient(input);
    }),

  markUrgent: protectedProcedure
    .use(hasPermission("queue:manage"))
    .input(UpdateVisitStatusSchema)
    .mutation(async ({ input }) => {
      return queueService.markUrgent(input);
    }),

  cancelVisit: protectedProcedure
    .use(hasPermission("queue:cancel"))
    .use(withAuditLog("queue:cancel", "visit", (input) => input.visitId))
    .input(UpdateVisitStatusSchema)
    .mutation(async ({ input }) => {
      return queueService.cancelVisit(input);
    }),
});
