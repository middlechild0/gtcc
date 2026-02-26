// Import Sentry instrumentation first, before any other modules
import "./instrument";
import { logger } from "@visyx/logger";
import * as Sentry from "@sentry/bun";

import app from "./app";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  Sentry.captureException(err, { tags: { errorType: "uncaught_exception" } });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  Sentry.captureException(
    reason instanceof Error ? reason : new Error(String(reason)),
    { tags: { errorType: "unhandled_rejection" } },
  );
});

export default {
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3003,
  fetch: app.fetch,
  host: "0.0.0.0",
  idleTimeout: 60,
};
