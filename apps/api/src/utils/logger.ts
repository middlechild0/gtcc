import { logger as honoLogger } from "hono/logger";

export function httpLogger() {
  return honoLogger();
}
