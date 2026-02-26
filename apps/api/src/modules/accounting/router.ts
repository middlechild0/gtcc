import { router, protectedProcedure } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";

export const accountingRouter = router({
    getDashboard: protectedProcedure
        .use(hasPermission("accounting:view_reports"))
        .query(async () => {
            return { revenue: 0, expenses: 0 };
        }),
});
