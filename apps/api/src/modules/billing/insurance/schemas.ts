import { z } from "zod";

const BillingBasisSchema = z.enum(["CAPITATION", "FEE_FOR_SERVICE"]);

const InsuranceProviderSchemeSchema = z.object({
  name: z.string().min(1, "Scheme name is required"),
  billingBasis: BillingBasisSchema.optional(),
  requiresPreAuth: z.boolean().optional(),
  copayAmount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const CreateInsuranceProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  providerCode: z.string().nullable().optional(),
  billingBasis: BillingBasisSchema.default("FEE_FOR_SERVICE"),
  requiresPreAuth: z.boolean().default(false),
  copayAmount: z.number().int().min(0).default(0),
  shaAccreditationNumber: z.string().nullable().optional(),
  schemes: z.array(InsuranceProviderSchemeSchema).default([]),
});

export type CreateInsuranceProviderInput = z.infer<
  typeof CreateInsuranceProviderSchema
>;

export const UpdateInsuranceProviderSchema =
  CreateInsuranceProviderSchema.partial().extend({
    id: z.number().int().positive(),
  });

export type UpdateInsuranceProviderInput = z.infer<
  typeof UpdateInsuranceProviderSchema
>;
