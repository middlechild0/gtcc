"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicProcedure = exports.router = void 0;
exports.createTRPCContext = createTRPCContext;
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
async function createTRPCContext(opts) {
    return { req: opts.req, resHeaders: opts.resHeaders };
}
const t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
});
exports.router = t.router;
exports.publicProcedure = t.procedure;
