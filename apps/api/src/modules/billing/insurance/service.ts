import { db } from "@visyx/db/client";
import { insuranceProviderSchemes, insuranceProviders } from "@visyx/db/schema";
import { asc, eq } from "drizzle-orm";
import type {
  CreateInsuranceProviderInput,
  UpdateInsuranceProviderInput,
} from "./schemas";

export const insuranceService = {
  async listProviders() {
    return db.query.insuranceProviders.findMany({
      where: eq(insuranceProviders.isActive, true),
      orderBy: asc(insuranceProviders.name),
      with: {
        schemes: {
          where: eq(insuranceProviderSchemes.isActive, true),
          orderBy: asc(insuranceProviderSchemes.name),
        },
      },
    });
  },

  async createProvider(input: CreateInsuranceProviderInput) {
    const provider = await db.transaction(async (tx) => {
      const [providerRow] = await tx
        .insert(insuranceProviders)
        .values({
          name: input.name,
          providerCode: input.providerCode?.trim() || null,
          billingBasis: input.billingBasis,
          requiresPreAuth: input.requiresPreAuth,
          copayAmount: input.copayAmount,
          shaAccreditationNumber: input.shaAccreditationNumber?.trim() || null,
          isActive: true,
        })
        .returning();

      if (!providerRow) {
        throw new Error("Failed to create insurance provider");
      }

      if (input.schemes.length > 0) {
        await tx.insert(insuranceProviderSchemes).values(
          input.schemes.map((scheme) => ({
            providerId: providerRow.id,
            name: scheme.name.trim(),
            billingBasis: scheme.billingBasis ?? input.billingBasis,
            requiresPreAuth: scheme.requiresPreAuth ?? input.requiresPreAuth,
            copayAmount: scheme.copayAmount ?? input.copayAmount,
            isActive: scheme.isActive ?? true,
          })),
        );
      }

      return providerRow;
    });

    const withSchemes = await db.query.insuranceProviders.findFirst({
      where: eq(insuranceProviders.id, provider.id),
      with: {
        schemes: {
          where: eq(insuranceProviderSchemes.isActive, true),
          orderBy: asc(insuranceProviderSchemes.name),
        },
      },
    });

    if (!withSchemes) {
      throw new Error("Failed to load created insurance provider");
    }

    return withSchemes;
  },

  async updateProvider(input: UpdateInsuranceProviderInput) {
    const { id, schemes, ...updateData } = input;

    const provider = await db.transaction(async (tx) => {
      const [providerRow] = await tx
        .update(insuranceProviders)
        .set({
          ...(updateData.name !== undefined ? { name: updateData.name } : {}),
          ...(updateData.providerCode !== undefined
            ? { providerCode: updateData.providerCode?.trim() || null }
            : {}),
          ...(updateData.billingBasis !== undefined
            ? { billingBasis: updateData.billingBasis }
            : {}),
          ...(updateData.requiresPreAuth !== undefined
            ? { requiresPreAuth: updateData.requiresPreAuth }
            : {}),
          ...(updateData.copayAmount !== undefined
            ? { copayAmount: updateData.copayAmount }
            : {}),
          ...(updateData.shaAccreditationNumber !== undefined
            ? {
                shaAccreditationNumber:
                  updateData.shaAccreditationNumber?.trim() || null,
              }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(insuranceProviders.id, id))
        .returning();

      if (!providerRow) {
        throw new Error("Insurance provider not found");
      }

      if (schemes !== undefined) {
        await tx
          .delete(insuranceProviderSchemes)
          .where(eq(insuranceProviderSchemes.providerId, id));

        if (schemes.length > 0) {
          await tx.insert(insuranceProviderSchemes).values(
            schemes.map((scheme) => ({
              providerId: id,
              name: scheme.name.trim(),
              billingBasis: scheme.billingBasis ?? providerRow.billingBasis,
              requiresPreAuth:
                scheme.requiresPreAuth ?? providerRow.requiresPreAuth,
              copayAmount: scheme.copayAmount ?? providerRow.copayAmount,
              isActive: scheme.isActive ?? true,
            })),
          );
        }
      }

      return providerRow;
    });

    const withSchemes = await db.query.insuranceProviders.findFirst({
      where: eq(insuranceProviders.id, provider.id),
      with: {
        schemes: {
          where: eq(insuranceProviderSchemes.isActive, true),
          orderBy: asc(insuranceProviderSchemes.name),
        },
      },
    });

    if (!withSchemes) {
      throw new Error("Failed to load updated insurance provider");
    }

    return withSchemes;
  },
};
