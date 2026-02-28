"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import type { Patient } from "../_utils/patient-types";
import { useDebouncedValue } from "./use-debounced-value";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function usePatientsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearchState] = useState(searchParams?.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading, error, refetch } = trpc.patients.list.useQuery({
    page,
    limit: pageSize,
    search: debouncedSearch.trim() || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const patients: Patient[] = data?.items ?? [];
  const totalFiltered = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    updater(params);
    router.replace(`?${params.toString()}`);
  };

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
    updateSearchParams((params) => {
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
    });
  };

  return {
    patients,
    filteredPatients: patients,
    totalFiltered,
    search,
    setSearch,
    isLoading,
    error,
    refetch,
    pagination: {
      page: clampedPage,
      setPage,
      pageSize,
      setPageSize,
      totalPages,
      totalFiltered,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    },
  };
}
