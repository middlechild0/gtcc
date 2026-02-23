import { protectedProcedure, router } from "../init";

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ({
    profile: ctx.profile,
    staff: ctx.staff,
    permissions: ctx.permissionKeys,
  })),
});
