"use client";

import { trpc } from "@/trpc/client";

type UseInvoiceDetailsOptions = {
  invoiceId: string | null;
};

export function useInvoiceDetails(options: UseInvoiceDetailsOptions) {
  const { invoiceId } = options;

  const query = trpc.billing.getInvoiceById.useQuery(
    { id: invoiceId ?? "" },
    {
      enabled: Boolean(invoiceId),
    },
  );

  return {
    invoice: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
