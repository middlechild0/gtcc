import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { patientService } from "./service";

export const patientsRouter = router({
  list: protectedProcedure
    .use(hasPermission("patients:view"))
    .query(async () => {
      return patientService.getPatients();
    }),

  // An example mutation to demonstrate the withAuditLog
  createPlaceholder: protectedProcedure
    .use(hasPermission("patients:create"))
    .use(withAuditLog("patients:create", "patient"))
    .mutation(async ({ input }) => {
      // Create logic goes here...
      return { success: true, id: "new-patient-uuid" };
    }),
});
