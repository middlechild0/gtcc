"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { filterBranches } from "../_utils/branch-filters";
import type { Branch } from "../_utils/branch-types";

export function useBranchesList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearchState] = useState(searchParams?.get("q") ?? "");
  const includeInactiveParam = searchParams?.get("includeInactive") === "true";
  const [includeInactive, setIncludeInactiveState] =
    useState(includeInactiveParam);

  const { data, isLoading, error, refetch } = trpc.branches.list.useQuery({
    includeInactive,
  });

  const branches: Branch[] = data ?? [];

  const filteredBranches = useMemo(
    () => filterBranches(branches, search),
    [branches, search],
  );

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    updater(params);
    router.replace(`?${params.toString()}`);
  };

  const setSearch = (value: string) => {
    setSearchState(value);
    updateSearchParams((params) => {
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
    });
  };

  const setIncludeInactive = (checked: boolean) => {
    setIncludeInactiveState(checked);
    updateSearchParams((params) => {
      if (checked) {
        params.set("includeInactive", "true");
      } else {
        params.delete("includeInactive");
      }
    });
  };

  return {
    branches,
    filteredBranches,
    search,
    setSearch,
    includeInactive,
    setIncludeInactive,
    isLoading,
    error,
    refetch,
  };
}
