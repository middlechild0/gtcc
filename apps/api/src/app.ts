import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import * as Sentry from "@sentry/bun";
import { logger } from "@visyx/logger";
import { checkHealth as checkCacheHealth } from "@visyx/cache/health";
import { checkHealth as checkDbHealth } from "@visyx/db/utils/health";
import { checkEmailHealth } from "@visyx/email/utils/health";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Context } from "./rest/types";
import { checkSupabaseHealth } from "./utils/health";
import { createTRPCContext } from "./trpc/init";
import { appRouter } from "./trpc/routers/_app";
import { httpLogger } from "./utils/logger";

const app = new OpenAPIHono<Context>();

app.use(httpLogger());
app.use(
  secureHeaders({
    crossOriginResourcePolicy: "cross-origin",
  }),
);

app.use(
  "*",
  cors({
    origin: [
      ...(process.env.ALLOWED_API_ORIGINS?.split(",").map((s) => s.trim()) ?? [
        "http://localhost:3000",
      ]),
      "https://www.visyx.africa",
      "https://visyx.gitahi.cc",
    ].filter((v, i, a) => a.indexOf(v) === i),
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Authorization",
      "Content-Type",
      "User-Agent",
      "accept-language",
      "x-trpc-source",
      "x-user-locale",
      "x-user-timezone",
      "x-user-country",
      "x-force-primary",
      "x-branch-id",
      "x-slack-signature",
      "x-slack-request-timestamp",
    ],
    exposeHeaders: [
      "Content-Length",
      "Content-Type",
      "Cache-Control",
      "Cross-Origin-Resource-Policy",
    ],
    maxAge: 86400,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error, path }) => {
      logger.error(`[tRPC] ${path}`, {
        message: error.message,
        code: error.code,
        cause: error.cause instanceof Error ? error.cause.message : undefined,
        stack: error.stack,
      });
      if (error.code === "INTERNAL_SERVER_ERROR") {
        Sentry.captureException(error, {
          tags: { source: "trpc", path: path ?? "unknown" },
        });
      }
    },
  }),
);

app.get("/favicon.ico", (c) => c.body(null, 204));
app.get("/robots.txt", (c) => c.body(null, 204));

app.get("/health", async (c) => {
  const wrap = async (fn: () => Promise<void>) => {
    try {
      await fn();
      return { ok: true as const };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
      return { ok: false as const, error: message };
    }
  };

  const [db, cache, supabase, email] = await Promise.all([
    wrap(() => checkDbHealth()),
    wrap(() => checkCacheHealth()),
    wrap(async () => {
      const result = await checkSupabaseHealth();
      if (!result.ok) throw new Error(result.error);
    }),
    wrap(async () => {
      const result = await checkEmailHealth();
      if (!result.ok) throw new Error(result.error);
    }),
  ]);

  const checks = { db, cache, supabase, email };
  const allOk = Object.values(checks).every((result) => result.ok);
  const status = allOk ? "ok" : "degraded";

  return c.json({ status, checks }, allOk ? 200 : 503);
});

app.get("/health/ready", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = "/health";
  const res = await app.fetch(new Request(url.toString()));
  const body = await res.json();
  return c.json(body, { status: res.status as 200 | 503 });
});

app.get("/health/dependencies", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = "/health";
  const res = await app.fetch(new Request(url.toString()));
  const body = (await res.json()) as unknown;
  return c.json(body, { status: res.status as 200 | 503 });
});

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "0.0.1",
    title: "visyx API",
    description:
      "visyx is a platform for Invoicing, Time tracking, File reconciliation, Storage, Financial Overview & your own Assistant.",
    contact: {
      name: "visyx Support",
      email: "engineer@visyx.ai",
      url: "https://visyx.ai",
    },
    license: {
      name: "AGPL-3.0 license",
      url: "https://github.com/visyx-ai/visyx/blob/main/LICENSE",
    },
  },
  servers: [{ url: "https://api.visyx.ai", description: "Production API" }],
});

app.get("/", (c) =>
  c.json({
    name: "visyx API",
    version: "0.0.1",
    docs: "/openapi",
    health: "/health",
  }),
);

app.onError((err, c) => {
  Sentry.captureException(err, {
    tags: { source: "hono", path: c.req.path, method: c.req.method },
  });
  logger.error(`[Hono] ${c.req.method} ${c.req.path}`, {
    message: err.message,
    stack: err.stack,
  });
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
