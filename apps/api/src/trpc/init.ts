import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createClient } from "@supabase/supabase-js";
import { eq, and } from "drizzle-orm";
import superjson from "superjson";
import { db } from "@visyx/db/client";
import {
  userProfiles,
  staff,
  staffPermissions,
  permissions,
} from "@visyx/db/schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export type Profile = typeof userProfiles.$inferSelect;
export type Staff = typeof staff.$inferSelect;
export type AuthContext = {
  req: Request;
  resHeaders: Headers;
  authUserId: string | null;
  profile: Profile | null;
  staff: Staff | null;
  permissionKeys: string[];
  isSuperuser: boolean;
  isStaffAdmin: boolean;
};

async function getAuthUserFromRequest(req: Request): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { id: user.id };
}

async function loadProfileAndRoles(authUserId: string): Promise<{
  profile: Profile | null;
  staff: Staff | null;
  permissionKeys: string[];
}> {
  const [profileRow] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, authUserId))
    .limit(1);

  if (!profileRow) {
    return { profile: null, staff: null, permissionKeys: [] };
  }

  const [staffRow] = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, authUserId))
    .limit(1);

  if (!staffRow) {
    return { profile: profileRow, staff: null, permissionKeys: [] };
  }

  const isAdmin = staffRow.isAdmin === true;
  const isSuperuser = profileRow.isSuperuser === true;

  if (isSuperuser || isAdmin) {
    const allPerms = await db.select({ key: permissions.key }).from(permissions);
    return {
      profile: profileRow,
      staff: staffRow,
      permissionKeys: allPerms.map((p) => p.key),
    };
  }

  const permRows = await db
    .select({ key: permissions.key })
    .from(staffPermissions)
    .innerJoin(permissions, eq(staffPermissions.permissionId, permissions.id))
    .where(
      and(eq(staffPermissions.staffId, staffRow.id), eq(staffPermissions.granted, true)),
    );
  const permissionKeys = [...new Set(permRows.map((r) => r.key))];

  return {
    profile: profileRow,
    staff: staffRow,
    permissionKeys,
  };
}

export async function createTRPCContext(
  opts: FetchCreateContextFnOptions,
): Promise<AuthContext> {
  const req = opts.req;
  const resHeaders = opts.resHeaders;
  const authUser = await getAuthUserFromRequest(req);

  if (!authUser) {
    return {
      req,
      resHeaders,
      authUserId: null,
      profile: null,
      staff: null,
      permissionKeys: [],
      isSuperuser: false,
      isStaffAdmin: false,
    };
  }

  const { profile, staff: staffRow, permissionKeys } = await loadProfileAndRoles(
    authUser.id,
  );

  return {
    req,
    resHeaders,
    authUserId: authUser.id,
    profile,
    staff: staffRow,
    permissionKeys,
    isSuperuser: profile?.isSuperuser ?? false,
    isStaffAdmin: staffRow?.isAdmin ?? false,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.authUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  if (!ctx.profile) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No profile found. Contact an admin for access.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      authUserId: ctx.authUserId,
      profile: ctx.profile,
      staff: ctx.staff,
      permissionKeys: ctx.permissionKeys,
      isSuperuser: ctx.isSuperuser,
      isStaffAdmin: ctx.isStaffAdmin,
    },
  });
});
