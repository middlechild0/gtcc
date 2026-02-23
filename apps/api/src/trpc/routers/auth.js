"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const init_1 = require("../init");
exports.authRouter = (0, init_1.router)({
    me: init_1.protectedProcedure.query(({ ctx }) => ({
        profile: ctx.profile,
        staff: ctx.staff,
        permissions: ctx.permissionKeys,
    })),
});
