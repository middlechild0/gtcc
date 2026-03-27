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
    .input(StartVisitSchema)
    .use(hasPermission("queue:manage"))
    .use(withAuditLog("queue:manage", "visit"))
    .mutation(async ({ input }) => {
      return queueService.startVisit(input);
    }),

  callPatient: protectedProcedure
    .input(UpdateVisitStatusSchema)
    .use(hasPermission("queue:manage"))
    .use(
      withAuditLog(
        "queue:manage",
        "visit",
        (input, result) => input?.visitId ?? result?.id,
      ),
    )
    .mutation(async ({ input }) => {
      return queueService.callPatient(input);
    }),

  advanceWorkflow: protectedProcedure
    .input(UpdateVisitStatusSchema)
    .use(hasPermission("queue:manage"))
    .use(
      withAuditLog(
        "queue:manage",
        "visit",
        (input, result) => input?.visitId ?? result?.visit?.id,
      ),
    )
    .mutation(async ({ input }) => {
      return queueService.advanceWorkflow(input);
    }),

  transferPatient: protectedProcedure
    .input(TransferPatientSchema)
    .use(hasPermission("queue:transfer"))
    .use(
      withAuditLog(
        "queue:transfer",
        "visit",
        (input, result) => input?.visitId ?? result?.id,
      ),
    )
    .mutation(async ({ input }) => {
      return queueService.transferPatient(input);
    }),

  markUrgent: protectedProcedure
    .input(UpdateVisitStatusSchema)
    .use(hasPermission("queue:manage"))
    .mutation(async ({ input }) => {
      return queueService.markUrgent(input);
    }),

  cancelVisit: protectedProcedure
    .input(UpdateVisitStatusSchema)
    .use(hasPermission("queue:cancel"))
    .use(
      withAuditLog(
        "queue:cancel",
        "visit",
        (input, result) => input?.visitId ?? result?.id,
      ),
    )
    .mutation(async ({ input }) => {
      return queueService.cancelVisit(input);
    }),
});
