import { z } from "zod";
import { authRouter } from "./auth";
import { publicProcedure, router } from "../init";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => ({ greeting: `Hello, ${input?.name ?? "World"}!` })),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
