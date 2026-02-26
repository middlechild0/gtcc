import { z } from "zod";

export const CreatePatientSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().optional(),
});

export const GetPatientSchema = z.object({
    id: z.string().uuid(),
});
