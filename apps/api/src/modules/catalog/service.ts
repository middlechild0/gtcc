import { TRPCError } from "@trpc/server";
import { db } from "@visyx/db/client";
import { billableItems, products, services } from "@visyx/db/schema";
import { and, desc, eq, ilike, lt } from "drizzle-orm";

export const CatalogService = {
  async listServices(input: {
    limit: number;
    cursor?: number | null;
    search?: string;
  }) {
    const conditions = [];
    if (input.search)
      conditions.push(ilike(services.name, `%${input.search}%`));
    if (input.cursor) conditions.push(lt(services.id, input.cursor));

    const allServices = await db.query.services.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: input.limit + 1,
      orderBy: desc(services.id),
    });

    let nextCursor: typeof input.cursor;
    if (allServices.length > input.limit) {
      const nextItem = allServices.pop();
      nextCursor = nextItem!.id;
    }

    return { items: allServices, nextCursor };
  },

  async createService(input: {
    name: string;
    category: "CONSULTATION" | "DIAGNOSTIC" | "OPTICAL" | "PROCEDURE" | "OTHER";
    description?: string;
    vatExempt: boolean;
  }) {
    return await db.transaction(async (tx) => {
      const [newService] = await tx
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

      await tx.insert(billableItems).values({
        type: "SERVICE",
        serviceId: newService.id,
        name: newService.name,
        isActive: newService.isActive,
      });

      return newService;
    });
  },

  async updateService(input: {
    id: number;
    name?: string;
    category?:
      | "CONSULTATION"
      | "DIAGNOSTIC"
      | "OPTICAL"
      | "PROCEDURE"
      | "OTHER";
    description?: string;
    isActive?: boolean;
    vatExempt?: boolean;
  }) {
    const { id, ...data } = input;
    if (Object.keys(data).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    return await db.transaction(async (tx) => {
      const [updatedService] = await tx
        .update(services)
        .set(data)
        .where(eq(services.id, id))
        .returning();

      if (data.name) {
        await tx
          .update(billableItems)
          .set({ name: data.name })
          .where(eq(billableItems.serviceId, id));
      }

      if (data.isActive !== undefined) {
        await tx
          .update(billableItems)
          .set({ isActive: data.isActive })
          .where(eq(billableItems.serviceId, id));
      }

      return updatedService;
    });
  },

  async listProducts(input: {
    limit: number;
    cursor?: number | null;
    search?: string;
  }) {
    const conditions = [];
    if (input.search)
      conditions.push(ilike(products.name, `%${input.search}%`));
    if (input.cursor) conditions.push(lt(products.id, input.cursor));

    const allProducts = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: input.limit + 1,
      orderBy: desc(products.id),
    });

    let nextCursor: typeof input.cursor;
    if (allProducts.length > input.limit) {
      const nextItem = allProducts.pop();
      nextCursor = nextItem!.id;
    }

    return { items: allProducts, nextCursor };
  },

  async createProduct(input: {
    name: string;
    sku?: string;
    category:
      | "FRAME"
      | "LENS"
      | "CONTACT_LENS"
      | "ACCESSORY"
      | "MEDICATION"
      | "CONSUMABLE"
      | "OTHER";
    description?: string;
    vatExempt: boolean;
  }) {
    return await db.transaction(async (tx) => {
      const [newProduct] = await tx.insert(products).values(input).returning();

      if (!newProduct) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        });
      }

      await tx.insert(billableItems).values({
        type: "PRODUCT",
        productId: newProduct.id,
        name: newProduct.name,
        isActive: newProduct.isActive,
      });

      return newProduct;
    });
  },

  async updateProduct(input: {
    id: number;
    name?: string;
    sku?: string;
    category?:
      | "FRAME"
      | "LENS"
      | "CONTACT_LENS"
      | "ACCESSORY"
      | "MEDICATION"
      | "CONSUMABLE"
      | "OTHER";
    description?: string;
    isActive?: boolean;
    vatExempt?: boolean;
  }) {
    const { id, ...data } = input;
    if (Object.keys(data).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No fields to update",
      });
    }

    return await db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(products)
        .set(data)
        .where(eq(products.id, id))
        .returning();

      if (data.name) {
        await tx
          .update(billableItems)
          .set({ name: data.name })
          .where(eq(billableItems.productId, id));
      }
      if (data.isActive !== undefined) {
        await tx
          .update(billableItems)
          .set({ isActive: data.isActive })
          .where(eq(billableItems.productId, id));
      }

      return updatedProduct;
    });
  },

  async listBillableItems(input: {
    limit: number;
    cursor?: number | null;
    search?: string;
    type?: "SERVICE" | "PRODUCT";
    isActive?: boolean;
  }) {
    const conditions = [];
    if (input.search)
      conditions.push(ilike(billableItems.name, `%${input.search}%`));
    if (input.type) conditions.push(eq(billableItems.type, input.type));
    if (input.isActive !== undefined)
      conditions.push(eq(billableItems.isActive, input.isActive));
    if (input.cursor) conditions.push(lt(billableItems.id, input.cursor));

    const allItems = await db.query.billableItems.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: input.limit + 1,
      orderBy: desc(billableItems.id),
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

    return { items: allItems, nextCursor };
  },
};
