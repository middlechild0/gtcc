var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = { enumerable: true, get: () => m[k] };
        }
        Object.defineProperty(o, k2, desc);
      }
    : (o, m, k, k2) => {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? (o, v) => {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : (o, v) => {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (() => {
    var ownKeys = (o) => {
      ownKeys =
        Object.getOwnPropertyNames ||
        ((o) => {
          var ar = [];
          for (var k in o) if (Object.hasOwn(o, k)) ar[ar.length] = k;
          return ar;
        });
      return ownKeys(o);
    };
    return (mod) => {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/bun"));
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.GIT_COMMIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA,
    // Use Railway environment name so staging and production are separate in Sentry
    environment:
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.NODE_ENV ||
      "production",
    integrations: [Sentry.consoleLoggingIntegration({ levels: ["error"] })],
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: 0.1,
    // Drop noisy transactions that don't provide value
    // Filter out expected client errors from error reporting
    beforeSend(event) {
      // Don't send network/timeout errors from health checks
      const message = event.exception?.values?.[0]?.value || "";
      if (message.includes("ECONNREFUSED") || message.includes("ETIMEDOUT")) {
        // Only drop if it's from a health check context
        const transaction = event.transaction || "";
        if (transaction.includes("/health")) {
          return null;
        }
      }
      return event;
    },
  });
}
