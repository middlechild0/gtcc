import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import * as Sentry from "@sentry/bun";
import { logger } from "@visyx/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { Context } from "./rest/types";
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

app.get("/health", (c) => c.json({ status: "ok" }, 200));
app.get("/health/ready", (c) => c.json({ status: "ok" }, 200));
app.get("/health/dependencies", (c) =>
  c.json({ status: "ok", dependencies: [] }, 200),
);

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
