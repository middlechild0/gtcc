"use client";

import { useToast } from "@visyx/ui/use-toast";
import { trpc } from "@/trpc/client";

export function useServices(search?: string) {
  return trpc.catalog.listServices.useQuery(
    { limit: 50, cursor: undefined, search: search?.trim() || undefined },
    { staleTime: 0 },
  );
}

export function useProducts(search?: string) {
  return trpc.catalog.listProducts.useQuery(
    { limit: 50, cursor: undefined, search: search?.trim() || undefined },
    { staleTime: 0 },
  );
}

export function useBillableItems(input?: {
  search?: string;
  type?: "SERVICE" | "PRODUCT";
  isActive?: boolean;
}) {
  return trpc.catalog.listBillableItems.useQuery(
    {
      limit: 50,
      cursor: undefined,
      search: input?.search?.trim() || undefined,
      type: input?.type,
      isActive: input?.isActive,
    },
    { staleTime: 0 },
  );
}

export function useCatalogMutations() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const createService = trpc.catalog.createService.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.catalog.listServices.invalidate(),
        utils.catalog.listBillableItems.invalidate(),
      ]);
      toast({ title: "Service created" });
    },
    onError: (e) => {
      toast({
        title: "Failed to create service",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const updateService = trpc.catalog.updateService.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.catalog.listServices.invalidate(),
        utils.catalog.listBillableItems.invalidate(),
      ]);
      toast({ title: "Service updated" });
    },
    onError: (e) => {
      toast({
        title: "Failed to update service",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const createProduct = trpc.catalog.createProduct.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.catalog.listProducts.invalidate(),
        utils.catalog.listBillableItems.invalidate(),
      ]);
      toast({ title: "Product created" });
    },
    onError: (e) => {
      toast({
        title: "Failed to create product",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const updateProduct = trpc.catalog.updateProduct.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.catalog.listProducts.invalidate(),
        utils.catalog.listBillableItems.invalidate(),
      ]);
      toast({ title: "Product updated" });
    },
    onError: (e) => {
      toast({
        title: "Failed to update product",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return { createService, updateService, createProduct, updateProduct };
}
