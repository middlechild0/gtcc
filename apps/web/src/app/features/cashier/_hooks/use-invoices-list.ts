"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { downloadCsvContent } from "../_utils/export-invoices-csv";
import type { CashierInvoice } from "../_utils/types";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

export function useInvoicesList() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );

  const { data, isLoading, error, refetch, isFetching } =
    trpc.billing.listInvoices.useQuery({
      page,
      limit: pageSize,
      search: search.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });

  const exportInvoicesCsv = trpc.billing.exportInvoicesCsv.useMutation({
    onSuccess: (result) => {
      if (result.total === 0 || !result.csvContent.trim()) {
        toast.info("No invoices available to download");
        return;
      }

      downloadCsvContent({
        csvContent: result.csvContent,
        fileName: result.fileName,
      });
      toast.success("Invoices CSV download started");
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || "Failed to export invoices");
    },
  });

  const invoices: CashierInvoice[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onFromDateChange = (value: string) => {
    setFromDate(value);
    setPage(1);
  };

  const onToDateChange = (value: string) => {
    setToDate(value);
    setPage(1);
  };

  const onDownload = () => {
    exportInvoicesCsv.mutate({
      search: search.trim() || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  return {
    invoices,
    isLoading,
    isFetching,
    isExporting: exportInvoicesCsv.isPending,
    error,
    refetch,
    search,
    onSearchChange,
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
    selectedInvoiceId,
    setSelectedInvoiceId,
    onDownload,
    pagination: {
      page,
      setPage,
      pageSize,
      setPageSize,
      total,
      totalPages,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    },
  };
}
