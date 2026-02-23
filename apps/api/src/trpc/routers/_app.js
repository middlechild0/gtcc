"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const zod_1 = require("zod");
const auth_1 = require("./auth");
const init_1 = require("../init");
exports.appRouter = (0, init_1.router)({
    hello: init_1.publicProcedure
        .input(zod_1.z.object({ name: zod_1.z.string().optional() }).optional())
        .query(({ input }) => ({ greeting: `Hello, ${input?.name ?? "World"}!` })),
    auth: auth_1.authRouter,
});
