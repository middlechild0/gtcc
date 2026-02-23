"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.publicProcedure = exports.router = void 0;
exports.createTRPCContext = createTRPCContext;
const server_1 = require("@trpc/server");
const supabase_js_1 = require("@supabase/supabase-js");
const drizzle_orm_1 = require("drizzle-orm");
const superjson_1 = __importDefault(require("superjson"));
const client_1 = require("@visyx/db/client");
const schema_1 = require("@visyx/db/schema");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
async function getAuthUserFromRequest(req) {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    if (!token || !supabaseUrl || !supabaseAnonKey)
        return null;
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error, } = await supabase.auth.getUser(token);
    if (error || !user)
        return null;
    return { id: user.id };
}
async function loadProfileAndRoles(authUserId) {
    const [profileRow] = await client_1.db
        .select()
        .from(schema_1.userProfiles)
        .where((0, drizzle_orm_1.eq)(schema_1.userProfiles.userId, authUserId))
        .limit(1);
    if (!profileRow) {
        return { profile: null, staff: null, permissionKeys: [] };
    }
    const [staffRow] = await client_1.db
        .select()
        .from(schema_1.staff)
        .where((0, drizzle_orm_1.eq)(schema_1.staff.userId, authUserId))
        .limit(1);
    if (!staffRow) {
        return { profile: profileRow, staff: null, permissionKeys: [] };
    }
    const isAdmin = staffRow.isAdmin === true;
    const isSuperuser = profileRow.isSuperuser === true;
    if (isSuperuser || isAdmin) {
        const allPerms = await client_1.db.select({ key: schema_1.permissions.key }).from(schema_1.permissions);
        return {
            profile: profileRow,
            staff: staffRow,
            permissionKeys: allPerms.map((p) => p.key),
        };
    }
    const permRows = await client_1.db
        .select({ key: schema_1.permissions.key })
        .from(schema_1.staffPermissions)
        .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.staffPermissions.permissionId, schema_1.permissions.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.staffPermissions.staffId, staffRow.id), (0, drizzle_orm_1.eq)(schema_1.staffPermissions.granted, true)));
    const permissionKeys = [...new Set(permRows.map((r) => r.key))];
    return {
        profile: profileRow,
        staff: staffRow,
        permissionKeys,
    };
}
async function createTRPCContext(opts) {
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
    const { profile, staff: staffRow, permissionKeys } = await loadProfileAndRoles(authUser.id);
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
const t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
});
exports.router = t.router;
exports.publicProcedure = t.procedure;
exports.protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.authUserId) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    if (!ctx.profile) {
        throw new server_1.TRPCError({
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
