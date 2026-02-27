import { createClient } from "@supabase/supabase-js";
import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@visyx/db/client";
import {
  permissions,
  staff,
  staffPermissions,
  userProfiles,
} from "@visyx/db/schema";
import { and, eq, isNull, or } from "drizzle-orm";
import superjson from "superjson";

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
  branchId: number | null;
  permissionKeys: string[];
  isSuperuser: boolean;
  isStaffAdmin: boolean;
};

async function getAuthUserFromRequest(
  req: Request,
): Promise<{ id: string } | null> {
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

async function loadProfileAndRoles(
  authUserId: string,
  requestedBranchId: number | null,
): Promise<{
  profile: Profile | null;
  staff: Staff | null;
  branchId: number | null;
  permissionKeys: string[];
}> {
  const [profileRow] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, authUserId))
    .limit(1);

  if (!profileRow) {
    return { profile: null, staff: null, branchId: null, permissionKeys: [] };
  }

  const [staffRow] = await db
    .select()
    .from(staff)
    .where(eq(staff.userId, authUserId))
    .limit(1);

  if (!staffRow) {
    return {
      profile: profileRow,
      staff: null,
      branchId: null,
      permissionKeys: [],
    };
  }

  const resolvedBranchId =
    requestedBranchId ?? staffRow.primaryBranchId ?? null;

  const isAdmin = staffRow.isAdmin === true;
  const isSuperuser = profileRow.isSuperuser === true;

  if (isSuperuser || isAdmin) {
    // Superusers and Admins implicitly have all permissions and access to all branches.
    // Optimization: we return empty permission keys here since the middleware
    // short-circuits for them anyway. This saves a database roundtrip.
    return {
      profile: profileRow,
      staff: staffRow,
      branchId: resolvedBranchId,
      permissionKeys: [],
    };
  }

  // Find all active permissions for this staff member that apply to this branch
  // (either globally via branchId IS NULL, or specifically for the resolved branch)
  const permRows = await db
    .select({ key: permissions.key })
    .from(staffPermissions)
    .innerJoin(permissions, eq(staffPermissions.permissionId, permissions.id))
    .where(
      and(
        eq(staffPermissions.staffId, staffRow.id),
        eq(staffPermissions.granted, true),
        resolvedBranchId
          ? or(
              isNull(staffPermissions.branchId),
              eq(staffPermissions.branchId, resolvedBranchId),
            )
          : isNull(staffPermissions.branchId),
      ),
    );

  // We no longer throw an error here if they have zero permissions for the branch.
  // Returning an empty permission array allows endpoints like `auth.me` to successfully
  // return their identity and zero permissions, letting the UI gracefully reject them
  // or prompt them to switch branches, rather than crashing the entire API layer with a 403.

  const permissionKeys = [...new Set(permRows.map((r) => r.key))];

  return {
    profile: profileRow,
    staff: staffRow,
    branchId: resolvedBranchId,
    permissionKeys,
  };
}

export async function createTRPCContext(
  opts: FetchCreateContextFnOptions,
): Promise<AuthContext> {
  const req = opts.req;
  const resHeaders = opts.resHeaders;
  const authUser = await getAuthUserFromRequest(req);

  const branchHeader = req.headers.get("x-branch-id");
  const requestedBranchId = branchHeader ? parseInt(branchHeader, 10) : null;

  if (!authUser) {
    return {
      req,
      resHeaders,
      authUserId: null,
      profile: null,
      staff: null,
      branchId: requestedBranchId,
      permissionKeys: [],
      isSuperuser: false,
      isStaffAdmin: false,
    };
  }

  const {
    profile,
    staff: staffRow,
    branchId,
    permissionKeys,
  } = await loadProfileAndRoles(authUser.id, requestedBranchId);

  return {
    req,
    resHeaders,
    authUserId: authUser.id,
    profile,
    staff: staffRow,
    branchId,
    permissionKeys,
    isSuperuser: profile?.isSuperuser ?? false,
    isStaffAdmin: staffRow?.isAdmin ?? false,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const t = initTRPC.context<Context>().create({
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
      branchId: ctx.branchId,
      permissionKeys: ctx.permissionKeys,
      isSuperuser: ctx.isSuperuser,
      isStaffAdmin: ctx.isStaffAdmin,
    },
  });
});
