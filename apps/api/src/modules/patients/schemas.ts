import { z } from "zod";

export const CreatePatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.union([z.literal(""), z.string().email("Invalid email address")]).optional(),
  phone: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;

export const ListPatientsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type ListPatientsInput = z.infer<typeof ListPatientsSchema>;

export const GetPatientSchema = z.object({
  id: z.string().uuid(),
});
