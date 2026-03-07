import { db } from "@visyx/db/client";
import { insuranceProviders } from "@visyx/db/schema";
import { asc, eq } from "drizzle-orm";
import type { CreateInsuranceProviderInput, UpdateInsuranceProviderInput } from "./schemas";

export const insuranceService = {
  async listProviders() {
    return db
      .select({
        id: insuranceProviders.id,
        name: insuranceProviders.name,
      })
      .from(insuranceProviders)
      .where(eq(insuranceProviders.isActive, true))
      .orderBy(asc(insuranceProviders.name));
  },

  async createProvider(input: CreateInsuranceProviderInput) {
    const [provider] = await db
      .insert(insuranceProviders)
      .values({
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        isActive: true,
      })
      .returning();
    return provider;
  },

  async updateProvider(input: UpdateInsuranceProviderInput) {
    const { id, ...updateData } = input;
    const [provider] = await db
      .update(insuranceProviders)
      .set({
        ...updateData,
        email: updateData.email ?? null,
        phone: updateData.phone ?? null,
        address: updateData.address ?? null,
        updatedAt: new Date(),
      })
      .where(eq(insuranceProviders.id, id))
      .returning();
    return provider;
  },
};

