# @visyx/api

This directory contains the core backend API for the Visyx Optical Clinic Management System. It is built using **Bun**, **Hono** (for routing/middleware), and **tRPC** (for typesafe client-server communication).

## Architecture Approach

We use a **Domain-Driven (Feature-Sliced)** architecture to keep the codebase modular, testable, and maintainable. Instead of separating files by type (e.g., all routers in one folder, all schemas in another), we group them by **domain module**.

```text
src/
├── app.ts                  // The Hono app instance & global middleware (CORS, etc.)
├── index.ts                // Bun server entrypoint (imports app.ts)
├── trpc/
│   ├── init.ts             // tRPC context (Auth, Branch context, Permissions)
│   ├── routers/_app.ts     // The root router that mounts all domain modules
│   └── middleware/
│       ├── withPermission.ts // Granular RBAC permission guard
│       └── withAudit.ts      // Automated mutation audit logging
└── modules/
    ├── patients/           // DOMAIN: Patients
    │   ├── router.ts       // The tRPC routes for patients
    │   ├── service.ts      // Business logic & DB calls
    │   └── schemas.ts      // Zod validation schemas
    ├── billing/            // DOMAIN: Billing & Invoicing
    │   ├── router.ts
    │   └── insurance/      // Sub-domain: Insurance claims 
    │       └── router.ts   
    ├── inventory/
    ├── accounting/
    └── staff/
```

## Security & Context (`branchId`)

Visyx is a multi-branch system. Every tRPC request context is injected with a `branchId`.

1. **Header Resolution:** The context looks for the `x-branch-id` header sent by the client.
2. **Fallback:** If missing, it defaults to the staff member's `primaryBranchId`.
3. **Validation:** The context checks if the user is an `Admin`, `Superuser`, or has explicit `staffPermissions` mapped to that `branchId` (or mapped globally via a `NULL` branch ID).
4. **Pre-filtering:** The `ctx.permissionKeys` array ONLY contains the string keys the user is allowed to execute at that specific `branchId`.

## Middlewares

Before writing any sensitive endpoints, you should apply these two core middlewares:

### `hasPermission("module:action")`
This guard secures the endpoint. It automatically short-circuits to allow access for Admins/Superusers. For regular staff, it checks if the required key exists in their allowed `ctx.permissionKeys` array.

```typescript
import { hasPermission } from "../../trpc/middleware/withPermission";

export const patientRouter = router({
  list: protectedProcedure
    .use(hasPermission("patients:view"))   // <-- Protects the route
    .query(async () => { /* ... */ })
});
```

### `withAuditLog("action_name", "entity_type")`
For **mutations** (creates, updates, deletes), attach the audit logger. It executes *after* your logic finishes successfully, performing an async "fire-and-forget" insert into the `audit_logs` database table so your request isn't slowed down.

```typescript
import { withAuditLog } from "../../trpc/middleware/withAudit";

createPatient: protectedProcedure
  .use(hasPermission("patients:create"))
  .use(withAuditLog("patients:create", "patient")) // <-- Records the action gracefully
  .mutation(async ({ input }) => { /* ... */ })
```

## Optional Caching (`@visyx/cache`)

We use a custom `@visyx/cache` package that wraps `bun:redis`. To ensure the environment can boot smoothly for local testing even without Redis running, the cache handles missing connections gracefully.

If `REDIS_URL` is not provided in your `.env`, the cache will seamlessly return `undefined` on `get` and NO-OP on `set`/`delete`.

```typescript
import { RedisCache } from "@visyx/cache/redis-client";

// Initializes the cache wrapper. First arg is the prefix, second is default TTL in seconds.
const patientCache = new RedisCache("patients", 3600);

// Example usage:
const cached = await patientCache.get<any[]>("list_all");
if (cached) return cached;
// ... fetch from DB ...
void patientCache.set("list_all", dbResults).catch(console.error);
```

## How to add a new Module

1. Create a folder in `src/modules/your-module`.
2. Create `schemas.ts` for Zod validation inputs.
3. Create `service.ts` for database operations (keep tRPC routers thin!).
4. Create `router.ts` referencing `schemas.ts` and `service.ts`.
5. Mount your new router in `src/trpc/routers/_app.ts`.
