"use client";

import { useToast } from "@visyx/ui/use-toast";
import { trpc } from "@/trpc/client";

export function useTaxRates() {
  return trpc.pricing.listTaxRates.useQuery(undefined, { staleTime: 0 });
}

export function useTaxRateMutations() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const create = trpc.pricing.createTaxRate.useMutation({
    onSuccess: async () => {
      await utils.pricing.listTaxRates.invalidate();
      toast({ title: "Tax rate created" });
    },
    onError: (e) => {
      toast({
        title: "Failed to create tax rate",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const update = trpc.pricing.updateTaxRate.useMutation({
    onSuccess: async () => {
      await utils.pricing.listTaxRates.invalidate();
      toast({ title: "Tax rate updated" });
    },
    onError: (e) => {
      toast({
        title: "Failed to update tax rate",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return { create, update };
}
