import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";

export const staffRouter = router({
  listStaff: protectedProcedure
    .use(hasPermission("staff:view"))
    .query(async () => {
      return [];
    }),
});
