import { z } from "zod";

export const DepartmentCodeSchema = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .refine((code) => code.length > 0, { message: "Department code is required" })
  .refine((code) => /^[A-Z0-9_]+$/.test(code), {
    message:
      "Department code must contain only uppercase letters, digits, and underscores",
  });

export const CreateDepartmentSchema = z.object({
  name: z.string().min(1).max(200),
  code: DepartmentCodeSchema,
});

export const UpdateDepartmentSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});

export const CreateVisitTypeSchema = z.object({
  name: z.string().min(1).max(200),
  workflowSteps: z
    .array(z.string().min(1))
    .min(1, "At least one workflow step is required"),
  isActive: z.boolean().optional(),
  defaultServiceId: z.number().int().positive().nullable().optional(),
});

export const UpdateVisitTypeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(200).optional(),
  workflowSteps: z.array(z.string().min(1)).min(1).optional(),
  isActive: z.boolean().optional(),
  defaultServiceId: z.number().int().positive().nullable().optional(),
});

export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type CreateVisitTypeInput = z.infer<typeof CreateVisitTypeSchema>;
export type UpdateVisitTypeInput = z.infer<typeof UpdateVisitTypeSchema>;
