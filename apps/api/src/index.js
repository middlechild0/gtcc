"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// Import Sentry instrumentation first, before any other modules
require("./instrument");
const trpc_server_1 = require("@hono/trpc-server");
const zod_openapi_1 = require("@hono/zod-openapi");
const logger_1 = require("@visyx/logger");
const Sentry = __importStar(require("@sentry/bun"));
const cors_1 = require("hono/cors");
const secure_headers_1 = require("hono/secure-headers");
const init_1 = require("./trpc/init");
const _app_1 = require("./trpc/routers/_app");
const logger_2 = require("./utils/logger");
const app = new zod_openapi_1.OpenAPIHono();
app.use((0, logger_2.httpLogger)());
app.use((0, secure_headers_1.secureHeaders)({
    crossOriginResourcePolicy: "cross-origin",
}));
app.use("*", (0, cors_1.cors)({
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
}));
app.use("/trpc/*", (0, trpc_server_1.trpcServer)({
    router: _app_1.appRouter,
    createContext: init_1.createTRPCContext,
    onError: ({ error, path }) => {
        logger_1.logger.error(`[tRPC] ${path}`, {
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
}));
app.get("/favicon.ico", (c) => c.body(null, 204));
app.get("/robots.txt", (c) => c.body(null, 204));
app.get("/health", (c) => c.json({ status: "ok" }, 200));
app.get("/health/ready", (c) => c.json({ status: "ok" }, 200));
app.get("/health/dependencies", (c) => c.json({ status: "ok", dependencies: [] }, 200));
app.doc("/openapi", {
    openapi: "3.1.0",
    info: {
        version: "0.0.1",
        title: "visyx API",
        description: "visyx is a platform for Invoicing, Time tracking, File reconciliation, Storage, Financial Overview & your own Assistant.",
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
app.get("/", (c) => c.json({
    name: "visyx API",
    version: "0.0.1",
    docs: "/openapi",
    health: "/health",
}));
app.onError((err, c) => {
    Sentry.captureException(err, {
        tags: { source: "hono", path: c.req.path, method: c.req.method },
    });
    logger_1.logger.error(`[Hono] ${c.req.method} ${c.req.path}`, {
        message: err.message,
        stack: err.stack,
    });
    return c.json({ error: "Internal Server Error" }, 500);
});
process.on("uncaughtException", (err) => {
    logger_1.logger.error("Uncaught exception", { error: err.message, stack: err.stack });
    Sentry.captureException(err, { tags: { errorType: "uncaught_exception" } });
});
process.on("unhandledRejection", (reason, promise) => {
    logger_1.logger.error("Unhandled rejection", {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
    });
    Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)), { tags: { errorType: "unhandled_rejection" } });
});
exports.default = {
    port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3003,
    fetch: app.fetch,
    host: "0.0.0.0",
    idleTimeout: 60,
};
