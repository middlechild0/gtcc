import { z } from "zod";
import { authRouter } from "./auth";
import { publicProcedure, router } from "../init";

import { patientsRouter } from "../../modules/patients/router";
import { billingRouter } from "../../modules/billing/router";
import { inventoryRouter } from "../../modules/inventory/router";
import { accountingRouter } from "../../modules/accounting/router";
import { staffRouter } from "../../modules/staff/router";

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
});

export type AppRouter = typeof appRouter;
