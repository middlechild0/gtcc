import { z } from "zod";
import { publicProcedure, router } from "../init";

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => ({ greeting: `Hello, ${input?.name ?? "World"}!` })),
});

export type AppRouter = typeof appRouter;
