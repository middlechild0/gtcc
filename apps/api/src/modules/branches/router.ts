import { protectedProcedure, router } from "../../trpc/init";
import { withAuditLog } from "../../trpc/middleware/withAudit";
import { hasPermission } from "../../trpc/middleware/withPermission";
import {
  CreateBranchSchema,
  DeactivateBranchSchema,
  GetBranchSchema,
  ListBranchesSchema,
  UpdateBranchSchema,
} from "./schemas";
import { branchesService } from "./service";

export const branchesRouter = router({
  list: protectedProcedure
    .use(hasPermission("branches:view"))
    .input(ListBranchesSchema)
    .query(async ({ input }) => {
      return branchesService.listBranches(input || {});
    }),

  get: protectedProcedure
    .use(hasPermission("branches:view"))
    .input(GetBranchSchema)
    .query(async ({ input }) => {
      return branchesService.getBranch(input.id);
    }),

  create: protectedProcedure
    .use(hasPermission("branches:manage"))
    .use(withAuditLog("branches:create", "branch"))
    .input(CreateBranchSchema)
    .mutation(async ({ input }) => {
      return branchesService.createBranch(input);
    }),

  update: protectedProcedure
    .use(hasPermission("branches:manage"))
    .use(withAuditLog("branches:update", "branch"))
    .input(UpdateBranchSchema)
    .mutation(async ({ input }) => {
      return branchesService.updateBranch(input);
    }),

  deactivate: protectedProcedure
    .use(hasPermission("branches:manage"))
    .use(withAuditLog("branches:deactivate", "branch"))
    .input(DeactivateBranchSchema)
    .mutation(async ({ input }) => {
      return branchesService.deactivateBranch(input.id);
    }),
});
