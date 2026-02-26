import { protectedProcedure, router } from "../../../trpc/init";
import { hasPermission } from "../../../trpc/middleware/withPermission";

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
      return [];
    }),
});
