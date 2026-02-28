import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { CreatePatientSchema } from "./schemas";
import { patientService } from "./service";

export const patientsRouter = router({
  list: protectedProcedure
    .use(hasPermission("patients:view"))
    .query(async () => {
      return patientService.getPatients();
    }),

  create: protectedProcedure
    .use(hasPermission("patients:create"))
    .use(withAuditLog("patients:create", "patient"))
    .input(CreatePatientSchema)
    .mutation(async ({ input }) => {
      return patientService.createPatient(input);
    }),

  kpis: protectedProcedure
    .use(hasPermission("patients:view"))
    .query(async () => {
      return patientService.getKpis();
    }),
});
