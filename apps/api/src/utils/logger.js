Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = httpLogger;
const logger_1 = require("hono/logger");
function httpLogger() {
  return (0, logger_1.logger)();
}
