import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { priceBooks, priceBookEntries, taxRates } from "@visyx/db/schema";

export const pricingRouter = router({
  // Price Books
  listPriceBooks: protectedProcedure
    .use(hasPermission("pricing:view"))
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
        branchId: z.number().optional(),
        type: z.enum(["CASH", "INSURANCE", "CORPORATE"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [];
      if (input.branchId) conditions.push(eq(priceBooks.branchId, input.branchId));
      if (input.type) conditions.push(eq(priceBooks.type, input.type));
      if (input.isActive !== undefined) conditions.push(eq(priceBooks.isActive, input.isActive));

      const allBooks = await db.query.priceBooks.findMany({
        where: (conditions.length > 0 ? and(...conditions) : undefined) as any,
        limit: input.limit + 1,
        orderBy: desc(priceBooks.createdAt),
        with: {
          branch: true,
          insuranceProvider: true,
        }
      });

      let nextCursor: typeof input.cursor = undefined;
      if (allBooks.length > input.limit) {
        const nextItem = allBooks.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: allBooks,
        nextCursor,
      };
    }),

  createPriceBook: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["CASH", "INSURANCE", "CORPORATE"]),
        branchId: z.number().optional().nullable(),
        insuranceProviderId: z.number().optional().nullable(),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const [newBook] = await db.insert(priceBooks).values(input).returning();
      return newBook;
    }),

  updatePriceBook: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["CASH", "INSURANCE", "CORPORATE"]).optional(),
        branchId: z.number().optional().nullable(),
        insuranceProviderId: z.number().optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [updatedBook] = await db
        .update(priceBooks)
        .set(data)
        .where(eq(priceBooks.id, id))
        .returning();

      if (!updatedBook) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Price book not found" });
      }

      return updatedBook;
    }),

  // Price Book Entries
  listEntries: protectedProcedure
    .use(hasPermission("pricing:view"))
    .input(
      z.object({
        priceBookId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
      })
    )
    .query(async ({ input }) => {
      const allEntries = await db.query.priceBookEntries.findMany({
        where: eq(priceBookEntries.priceBookId, input.priceBookId) as any,
        limit: input.limit + 1,
        orderBy: desc(priceBookEntries.createdAt),
        with: {
          billableItem: {
             with: {
                 service: true,
                 product: true
             }
          }
        }
      });

      let nextCursor: typeof input.cursor = undefined;
      if (allEntries.length > input.limit) {
        const nextItem = allEntries.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: allEntries,
        nextCursor,
      };
    }),

  upsertEntry: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        priceBookId: z.number(),
        billableItemId: z.number(),
        price: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      // Use PostgreSQL ON CONFLICT to either insert or update the price
      const [entry] = await db
        .insert(priceBookEntries)
        .values(input)
        .onConflictDoUpdate({
          target: [priceBookEntries.priceBookId, priceBookEntries.billableItemId],
          set: { price: input.price, updatedAt: new Date() },
        })
        .returning();

      return entry;
    }),

  // Tax Rates
  listTaxRates: protectedProcedure
    .use(hasPermission("pricing:view"))
    .query(async () => {
      return await db.query.taxRates.findMany({
        orderBy: desc(taxRates.createdAt),
      });
    }),

  createTaxRate: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        name: z.string().min(1),
        rate: z.number().min(0).max(100),
        isDefault: z.boolean().default(false),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      if (input.isDefault) {
          // Unset any existing default
          await db.update(taxRates).set({ isDefault: false }).where(eq(taxRates.isDefault, true));
      }

      const [newTaxRate] = await db.insert(taxRates).values(input).returning();
      return newTaxRate;
    }),

  updateTaxRate: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        rate: z.number().min(0).max(100).optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      
      if (data.isDefault) {
          // Unset any existing default
          await db.update(taxRates).set({ isDefault: false }).where(eq(taxRates.isDefault, true));
      }

      const [updatedTaxRate] = await db
        .update(taxRates)
        .set(data)
        .where(eq(taxRates.id, id))
        .returning();

      if (!updatedTaxRate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tax rate not found" });
      }

      return updatedTaxRate;
    }),
});
