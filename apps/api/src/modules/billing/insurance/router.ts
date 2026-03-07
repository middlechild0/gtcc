import { protectedProcedure, router } from "../../../trpc/init";
import { hasPermission } from "../../../trpc/middleware/withPermission";
import {
  CreateInsuranceProviderSchema,
  UpdateInsuranceProviderSchema,
} from "./schemas";
import { insuranceService } from "./service";

export const insuranceRouter = router({
  submitClaim: protectedProcedure
    .use(hasPermission("billing:submit_claim"))
    .mutation(async ({ input, ctx }) => {
      // Claim logic
      return { success: true };
    }),

  listProviders: protectedProcedure
    .use(hasPermission("billing:view_insurance_providers"))
    .query(async () => {
      return insuranceService.listProviders();
    }),

  createProvider: protectedProcedure
    .use(hasPermission("billing:manage_insurance_providers"))
    .input(CreateInsuranceProviderSchema)
    .mutation(async ({ input }) => {
      return insuranceService.createProvider(input);
    }),

  updateProvider: protectedProcedure
    .use(hasPermission("billing:manage_insurance_providers"))
    .input(UpdateInsuranceProviderSchema)
    .mutation(async ({ input }) => {
      return insuranceService.updateProvider(input);
    }),
});
