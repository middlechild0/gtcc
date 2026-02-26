import { z } from "zod";

export const CreateBranchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const UpdateBranchSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const GetBranchSchema = z.object({
  id: z.number().int().positive(),
});

export const ListBranchesSchema = z.object({
  includeInactive: z.boolean().default(false).optional(),
});

export const DeactivateBranchSchema = z.object({
  id: z.number().int().positive(),
});

export type CreateBranchInput = z.infer<typeof CreateBranchSchema>;
export type UpdateBranchInput = z.infer<typeof UpdateBranchSchema>;
export type GetBranchInput = z.infer<typeof GetBranchSchema>;
export type ListBranchesInput = z.infer<typeof ListBranchesSchema>;
export type DeactivateBranchInput = z.infer<typeof DeactivateBranchSchema>;
