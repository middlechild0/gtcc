import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { priceBookEntries, priceBooks, taxRates } from "@visyx/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";

export const PricingService = {
  async listPriceBooks(input: {
    limit: number;
    cursor?: number | null;
    branchId?: number;
    type?: "CASH" | "INSURANCE" | "CORPORATE";
    isActive?: boolean;
  }) {
    const conditions = [];
    if (input.branchId)
      conditions.push(eq(priceBooks.branchId, input.branchId));
    if (input.type) conditions.push(eq(priceBooks.type, input.type));
    if (input.isActive !== undefined)
      conditions.push(eq(priceBooks.isActive, input.isActive));
    if (input.cursor) conditions.push(lt(priceBooks.id, input.cursor));

    const allBooks = await db.query.priceBooks.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: input.limit + 1,
      orderBy: desc(priceBooks.id),
      with: {
        branch: true,
        insuranceProvider: true,
      },
    });

    let nextCursor: typeof input.cursor;
    if (allBooks.length > input.limit) {
      const nextItem = allBooks.pop();
      nextCursor = nextItem!.id;
    }

    return { items: allBooks, nextCursor };
  },

  async createPriceBook(input: {
    name: string;
    type: "CASH" | "INSURANCE" | "CORPORATE";
    branchId?: number | null;
    insuranceProviderId?: number | null;
    isActive: boolean;
  }) {
    const [newBook] = await db.insert(priceBooks).values(input).returning();
    return newBook;
  },

  async updatePriceBook(input: {
    id: number;
    name?: string;
    type?: "CASH" | "INSURANCE" | "CORPORATE";
    branchId?: number | null;
    insuranceProviderId?: number | null;
    isActive?: boolean;
  }) {
    const { id, ...data } = input;
    if (Object.keys(data).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    const [updatedBook] = await db
      .update(priceBooks)
      .set(data)
      .where(eq(priceBooks.id, id))
      .returning();

    if (!updatedBook) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Price book not found",
      });
    }

    return updatedBook;
  },

  async listEntries(input: {
    priceBookId: number;
    limit: number;
    cursor?: number | null;
  }) {
    const conditions = [eq(priceBookEntries.priceBookId, input.priceBookId)];
    if (input.cursor) conditions.push(lt(priceBookEntries.id, input.cursor));

    const allEntries = await db.query.priceBookEntries.findMany({
      where: and(...conditions),
      limit: input.limit + 1,
      orderBy: desc(priceBookEntries.id),
      with: {
        billableItem: {
          with: {
            service: true,
            product: true,
          },
        },
      },
    });

    let nextCursor: typeof input.cursor;
    if (allEntries.length > input.limit) {
      const nextItem = allEntries.pop();
      nextCursor = nextItem!.id;
    }

    return { items: allEntries, nextCursor };
  },

  async upsertEntry(input: {
    priceBookId: number;
    billableItemId: number;
    price: number;
  }) {
    const [entry] = await db
      .insert(priceBookEntries)
      .values(input)
      .onConflictDoUpdate({
        target: [
          priceBookEntries.priceBookId,
          priceBookEntries.billableItemId,
        ],
        set: { price: input.price, updatedAt: new Date() },
      })
      .returning();

    return entry;
  },

  async bulkUpsertEntries(input: {
    priceBookId: number;
    entries: { billableItemId: number; price: number }[];
  }) {
    if (input.entries.length === 0) return [];

    return await db.transaction(async (tx) => {
      const results = [];
      for (const entry of input.entries) {
        const [upserted] = await tx
          .insert(priceBookEntries)
          .values({
            priceBookId: input.priceBookId,
            billableItemId: entry.billableItemId,
            price: entry.price,
          })
          .onConflictDoUpdate({
            target: [
              priceBookEntries.priceBookId,
              priceBookEntries.billableItemId,
            ],
            set: { price: entry.price, updatedAt: new Date() },
          })
          .returning();
        results.push(upserted);
      }
      return results;
    });
  },

  async listTaxRates() {
    return await db.query.taxRates.findMany({
      orderBy: desc(taxRates.createdAt),
    });
  },

  async createTaxRate(input: {
    name: string;
    rate: number;
    isDefault: boolean;
    isActive: boolean;
  }) {
    return await db.transaction(async (tx) => {
      if (input.isDefault) {
        await tx
          .update(taxRates)
          .set({ isDefault: false })
          .where(eq(taxRates.isDefault, true));
      }

      const [newTaxRate] = await tx.insert(taxRates).values(input).returning();
      return newTaxRate;
    });
  },

  async updateTaxRate(input: {
    id: number;
    name?: string;
    rate?: number;
    isDefault?: boolean;
    isActive?: boolean;
  }) {
    const { id, ...data } = input;
    if (Object.keys(data).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    return await db.transaction(async (tx) => {
      if (data.isDefault) {
        await tx
          .update(taxRates)
          .set({ isDefault: false })
          .where(eq(taxRates.isDefault, true));
      }

      const [updatedTaxRate] = await tx
        .update(taxRates)
        .set(data)
        .where(eq(taxRates.id, id))
        .returning();

      if (!updatedTaxRate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tax rate not found",
        });
      }

      return updatedTaxRate;
    });
  },
};
