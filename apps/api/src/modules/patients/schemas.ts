import { z } from "zod";

export const CreatePatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
});

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;

export const GetPatientSchema = z.object({
  id: z.string().uuid(),
});
