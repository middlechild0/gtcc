import { z } from "zod";
import { accountingRouter } from "../../modules/accounting/router";
import { billingRouter } from "../../modules/billing/router";
import { branchesRouter } from "../../modules/branches/router";
import { inventoryRouter } from "../../modules/inventory/router";
import { patientsRouter } from "../../modules/patients/router";
import { staffRouter } from "../../modules/staff/router";
import { publicProcedure, router } from "../init";
import { authRouter } from "./auth";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => ({ greeting: `Hello, ${input?.name ?? "World"}!` })),
  auth: authRouter,

  // Mounted domain modules
  patients: patientsRouter,
  billing: billingRouter,
  inventory: inventoryRouter,
  accounting: accountingRouter,
  staff: staffRouter,
  branches: branchesRouter,
});

export type AppRouter = typeof appRouter;
