import { z } from "zod";

export const CreatePatientSchema = z.object({
  // Basic Info
  salutation: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().optional(), // ISO date string or YYYY-MM-DD
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z
    .enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "OTHER"])
    .optional(),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "UNKNOWN"])
    .optional(),

  // Contact
  email: z
    .union([z.literal(""), z.string().email("Invalid email address")])
    .optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),

  // IDs
  passportNumber: z.string().optional(),
  nationalId: z.string().optional(),
  nhifNumber: z.string().optional(),

  // Branch registration context
  branchId: z.number().int().positive("Branch ID is required"),

  // Relations (Emergency Contact) 1-to-many
  kin: z
    .array(
      z.object({
        isPrimary: z.boolean().default(false).optional(),
        firstName: z.string().min(1, "Kin first name is required"),
        lastName: z.string().min(1, "Kin last name is required"),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        email: z.union([z.literal(""), z.string().email()]).optional(),
        nationalId: z.string().optional(),
      }),
    )
    .optional(),

  // Guarantor 1-to-many
  guarantor: z
    .array(
      z.object({
        isPrimary: z.boolean().default(false).optional(),
        firstName: z.string().min(1, "Guarantor first name is required"),
        lastName: z.string().min(1, "Guarantor last name is required"),
        relationship: z.string().optional(),
        phone: z.string().optional(),
        email: z.union([z.literal(""), z.string().email()]).optional(),
        nationalId: z.string().optional(),
        employer: z.string().optional(),
      }),
    )
    .optional(),

  // Insurance
  insurance: z
    .object({
      providerId: z.number().int().optional(),
      schemeId: z.number().int().optional(),
      memberNumber: z.string().optional(),
      preAuthNumber: z.string().optional(),
      expiresAt: z.string().optional(), // YYYY-MM-DD
    })
    .optional(),
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

export const UpdatePatientSchema = CreatePatientSchema.extend({
  id: z.string().uuid("Patient ID is required for update"),
});

export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;

export const DeactivatePatientSchema = z.object({
  id: z.string().uuid("Patient ID is required for deactivation"),
  branchId: z.number().int().positive("Branch ID is required"),
});

export type DeactivatePatientInput = z.infer<typeof DeactivatePatientSchema>;
