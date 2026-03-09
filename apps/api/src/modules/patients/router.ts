import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import {
  CreatePatientSchema,
  DeactivatePatientSchema,
  GetPatientSchema,
  ListPatientsSchema,
  UpdatePatientSchema,
} from "./schemas";
import { patientService } from "./service";

export const patientsRouter = router({
  list: protectedProcedure
    .use(hasPermission("patients:view"))
    .input(ListPatientsSchema.extend({ branchId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return patientService.getPatients(input);
    }),

  get: protectedProcedure
    .use(hasPermission("patients:view"))
    .input(GetPatientSchema)
    .use(withAuditLog("patients:view", "patient", (input) => input.id))
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

  update: protectedProcedure
    .use(hasPermission("patients:edit"))
    .input(UpdatePatientSchema)
    .use(withAuditLog("patients:edit", "patient", (input) => input.id))
    .mutation(async ({ input }) => {
      return patientService.updatePatient(input);
    }),

  deactivate: protectedProcedure
    .use(hasPermission("patients:delete"))
    .input(DeactivatePatientSchema)
    .use(withAuditLog("patients:delete", "patient", (input) => input.id))
    .mutation(async ({ input }) => {
      return patientService.deactivatePatient(input);
    }),
});
