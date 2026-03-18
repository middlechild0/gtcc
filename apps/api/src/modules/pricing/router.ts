import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { PricingService } from "./service";

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
      }),
    )
    .query(async ({ input }) => PricingService.listPriceBooks(input)),

  createPriceBook: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        name: z.string().min(1),
        type: z.enum(["CASH", "INSURANCE", "CORPORATE"]),
        branchId: z.number().optional().nullable(),
        insuranceProviderId: z.number().optional().nullable(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => PricingService.createPriceBook(input)),

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
      }),
    )
    .mutation(async ({ input }) => PricingService.updatePriceBook(input)),

  // Price Book Entries
  listEntries: protectedProcedure
    .use(hasPermission("pricing:view"))
    .input(
      z.object({
        priceBookId: z.number(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ input }) => PricingService.listEntries(input)),

  upsertEntry: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        priceBookId: z.number(),
        billableItemId: z.number(),
        price: z.number().min(0),
      }),
    )
    .mutation(async ({ input }) => PricingService.upsertEntry(input)),

  bulkUpsertEntries: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        priceBookId: z.number(),
        entries: z.array(
          z.object({
            billableItemId: z.number(),
            price: z.number().min(0),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => PricingService.bulkUpsertEntries(input)),

  // Tax Rates
  listTaxRates: protectedProcedure
    .use(hasPermission("pricing:view"))
    .query(async () => PricingService.listTaxRates()),

  createTaxRate: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        name: z.string().min(1),
        rate: z.number().min(0).max(100),
        isDefault: z.boolean().default(false),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => PricingService.createTaxRate(input)),

  updateTaxRate: protectedProcedure
    .use(hasPermission("pricing:manage"))
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        rate: z.number().min(0).max(100).optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => PricingService.updateTaxRate(input)),
});
