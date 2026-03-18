"use client";

import { useToast } from "@visyx/ui/use-toast";
import { trpc } from "@/trpc/client";

export function usePriceBooksList(input?: {
  branchId?: number;
  type?: "CASH" | "INSURANCE" | "CORPORATE";
  isActive?: boolean;
}) {
  const query = trpc.pricing.listPriceBooks.useQuery(
    {
      limit: 50,
      cursor: undefined,
      branchId: input?.branchId,
      type: input?.type,
      isActive: input?.isActive,
    },
    { staleTime: 0 },
  );

  return query;
}

export function usePriceBookMutations() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const create = trpc.pricing.createPriceBook.useMutation({
    onSuccess: async () => {
      await utils.pricing.listPriceBooks.invalidate();
      toast({ title: "Price book created" });
    },
    onError: (e) => {
      toast({
        title: "Failed to create price book",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const update = trpc.pricing.updatePriceBook.useMutation({
    onSuccess: async () => {
      await utils.pricing.listPriceBooks.invalidate();
      toast({ title: "Price book updated" });
    },
    onError: (e) => {
      toast({
        title: "Failed to update price book",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return { create, update };
}
