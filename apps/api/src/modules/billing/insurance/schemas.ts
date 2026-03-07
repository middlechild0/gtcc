import { z } from "zod";

export const CreateInsuranceProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

export type CreateInsuranceProviderInput = z.infer<
  typeof CreateInsuranceProviderSchema
>;

export const UpdateInsuranceProviderSchema = CreateInsuranceProviderSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateInsuranceProviderInput = z.infer<
  typeof UpdateInsuranceProviderSchema
>;
