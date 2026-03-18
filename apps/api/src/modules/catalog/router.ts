import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { billableItems, products, services } from "@visyx/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/init";
import { hasPermission } from "../../trpc/middleware/withPermission";

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
    .query(async ({ input }) => {
      // Implement finding services
      const allServices = await db.query.services.findMany({
        where: (input.search
          ? ilike(services.name, `%${input.search}%`)
          : undefined) as any,
        limit: input.limit + 1,
        orderBy: desc(services.createdAt),
      });

      let nextCursor: typeof input.cursor;
      if (allServices.length > input.limit) {
        const nextItem = allServices.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: allServices,
        nextCursor,
      };
    }),

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
    .mutation(async ({ input }) => {
      // 1. Create the base service
      const [newService] = await db
        .insert(services)
        .values({
          name: input.name,
          category: input.category,
          description: input.description,
          vatExempt: input.vatExempt,
        })
        .returning();

      if (!newService) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create service",
        });
      }

      // 2. Create the polymorphic billable item linking to it
      const [_newBillableItem] = await db
        .insert(billableItems)
        .values({
          type: "SERVICE",
          serviceId: newService.id,
          name: newService.name,
          isActive: newService.isActive,
        })
        .returning();

      return newService;
    }),

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
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [updatedService] = await db
        .update(services)
        .set(data)
        .where(eq(services.id, id))
        .returning();

      // If name changed, sync it to the billable item
      if (data.name) {
        await db
          .update(billableItems)
          .set({ name: data.name })
          .where(eq(billableItems.serviceId, id));
      }

      // If isActive changed, sync it
      if (data.isActive !== undefined) {
        await db
          .update(billableItems)
          .set({ isActive: data.isActive })
          .where(eq(billableItems.serviceId, id));
      }

      return updatedService;
    }),

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
    .query(async ({ input }) => {
      const allProducts = await db.query.products.findMany({
        where: (input.search
          ? ilike(products.name, `%${input.search}%`)
          : undefined) as any,
        limit: input.limit + 1,
        orderBy: desc(products.createdAt),
      });

      let nextCursor: typeof input.cursor;
      if (allProducts.length > input.limit) {
        const nextItem = allProducts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: allProducts,
        nextCursor,
      };
    }),

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
    .mutation(async ({ input }) => {
      const [newProduct] = await db.insert(products).values(input).returning();

      if (!newProduct) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        });
      }

      // Create the polymorphic billable item linking to it
      const [_newBillableItem] = await db
        .insert(billableItems)
        .values({
          type: "PRODUCT",
          productId: newProduct.id,
          name: newProduct.name,
          isActive: newProduct.isActive,
        })
        .returning();

      return newProduct;
    }),

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
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [updatedProduct] = await db
        .update(products)
        .set(data)
        .where(eq(products.id, id))
        .returning();

      // Sync name and active status to billable item
      if (data.name) {
        await db
          .update(billableItems)
          .set({ name: data.name })
          .where(eq(billableItems.productId, id));
      }
      if (data.isActive !== undefined) {
        await db
          .update(billableItems)
          .set({ isActive: data.isActive })
          .where(eq(billableItems.productId, id));
      }

      return updatedProduct;
    }),

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
    .query(async ({ input }) => {
      const conditions = [];
      if (input.search)
        conditions.push(ilike(billableItems.name, `%${input.search}%`));
      if (input.type) conditions.push(eq(billableItems.type, input.type));
      if (input.isActive !== undefined)
        conditions.push(eq(billableItems.isActive, input.isActive));

      const allItems = await db.query.billableItems.findMany({
        where: (conditions.length > 0 ? and(...conditions) : undefined) as any,
        limit: input.limit + 1,
        orderBy: desc(billableItems.createdAt),
        with: {
          service: true,
          product: true,
        },
      });

      let nextCursor: typeof input.cursor;
      if (allItems.length > input.limit) {
        const nextItem = allItems.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: allItems,
        nextCursor,
      };
    }),
});
