import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import {
  CreatePatientSchema,
  GetPatientSchema,
  ListPatientsSchema,
} from "./schemas";
import { patientService } from "./service";

export const patientsRouter = router({
  list: protectedProcedure
    .use(hasPermission("patients:view"))
    .input(ListPatientsSchema.extend({ branchId: z.number().int().positive() })) // enforce branch info at router level
    .query(async ({ input }) => {
      return patientService.getPatients(input);
    }),

  get: protectedProcedure
    .use(hasPermission("patients:view"))
    .use(withAuditLog("patients:view", "patient", (req) => req.input.id)) // explicit audit log for PII view
    .input(GetPatientSchema)
    .query(async ({ input }) => {
      return patientService.getPatient(input.id);
    }),

  create: protectedProcedure
    .use(hasPermission("patients:create"))
    .use(withAuditLog("patients:create", "patient"))
    .input(CreatePatientSchema)
    .mutation(async ({ input }) => {
      return patientService.createPatient(input);
    }),

  getKpis: protectedProcedure
    .use(hasPermission("patients:view"))
    .input(z.object({ branchId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return patientService.getKpis(input.branchId);
    }),
});
