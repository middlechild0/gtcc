import { z } from "zod";

export const GetDepartmentPoolSchema = z.object({
    branchId: z.number().int().positive(),
    departmentCode: z.string(),
});

export const StartVisitSchema = z.object({
    patientId: z.string().uuid(),
    branchId: z.number().int().positive(),
    visitTypeId: z.number().int().positive(),
    priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
});

export const UpdateVisitStatusSchema = z.object({
    visitId: z.string().uuid(),
});

export const TransferPatientSchema = z.object({
    visitId: z.string().uuid(),
    targetDepartmentId: z.number().int().positive(),
});

export type GetDepartmentPoolInput = z.infer<typeof GetDepartmentPoolSchema>;
export type StartVisitInput = z.infer<typeof StartVisitSchema>;
export type UpdateVisitStatusInput = z.infer<typeof UpdateVisitStatusSchema>;
export type TransferPatientInput = z.infer<typeof TransferPatientSchema>;
