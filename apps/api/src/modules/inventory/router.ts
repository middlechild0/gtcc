import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";

export const inventoryRouter = router({
  listItems: protectedProcedure
    .use(hasPermission("inventory:view"))
    .query(async () => {
      return [];
    }),
});
