import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";
import { CatalogService } from "./service";

export const catalogRouter = router({
  listServices: protectedProcedure
    .use(hasPermission("catalog:view"))
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(), // id based cursor
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => CatalogService.listServices(input)),

  createService: protectedProcedure
    .use(hasPermission("catalog:manage"))
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum([
          "CONSULTATION",
          "DIAGNOSTIC",
          "OPTICAL",
          "PROCEDURE",
          "OTHER",
        ]),
        description: z.string().optional(),
        vatExempt: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => CatalogService.createService(input)),

  updateService: protectedProcedure
    .use(hasPermission("catalog:manage"))
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        category: z
          .enum(["CONSULTATION", "DIAGNOSTIC", "OPTICAL", "PROCEDURE", "OTHER"])
          .optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        vatExempt: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => CatalogService.updateService(input)),

  // Products
  listProducts: protectedProcedure
    .use(hasPermission("catalog:view"))
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => CatalogService.listProducts(input)),

  createProduct: protectedProcedure
    .use(hasPermission("catalog:manage"))
    .input(
      z.object({
        name: z.string().min(1),
        sku: z.string().optional(),
        category: z.enum([
          "FRAME",
          "LENS",
          "CONTACT_LENS",
          "ACCESSORY",
          "MEDICATION",
          "CONSUMABLE",
          "OTHER",
        ]),
        description: z.string().optional(),
        vatExempt: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => CatalogService.createProduct(input)),

  updateProduct: protectedProcedure
    .use(hasPermission("catalog:manage"))
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        sku: z.string().optional(),
        category: z
          .enum([
            "FRAME",
            "LENS",
            "CONTACT_LENS",
            "ACCESSORY",
            "MEDICATION",
            "CONSUMABLE",
            "OTHER",
          ])
          .optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        vatExempt: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => CatalogService.updateProduct(input)),

  // Billable Items (Unified Interface)
  listBillableItems: protectedProcedure
    .use(hasPermission("catalog:view"))
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().nullish(),
        search: z.string().optional(),
        type: z.enum(["SERVICE", "PRODUCT"]).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => CatalogService.listBillableItems(input)),
});
