"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import type { StaffListItem } from "../_utils/staff-types";

const DEFAULT_LIMIT = 50;

export function useStaffList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearchState] = useState(searchParams?.get("q") ?? "");
  const includeInactiveParam = searchParams?.get("includeInactive") === "true";
  const [includeInactive, setIncludeInactiveState] =
    useState(includeInactiveParam);

  const branchIdParam = searchParams?.get("branchId");
  const [branchId, setBranchIdState] = useState<number | undefined>(() => {
    if (!branchIdParam) return undefined;
    const n = Number(branchIdParam);
    return Number.isFinite(n) ? n : undefined;
  });

  const pageParam = searchParams?.get("page");
  const [page, setPageState] = useState<number>(() => {
    const n = Number(pageParam ?? "1");
    return Number.isFinite(n) && n >= 1 ? n : 1;
  });

  const offset = (page - 1) * DEFAULT_LIMIT;

  const { data, isLoading, error, refetch } = trpc.staff.list.useQuery({
    search: search || undefined,
    includeInactive,
    branchId,
    limit: DEFAULT_LIMIT,
    offset,
  });

  const staffList: StaffListItem[] = data ?? [];

  const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    updater(params);
    router.replace(`?${params.toString()}`);
  };

  const setSearch = (value: string) => {
    setSearchState(value);
    setPageState(1);
    updateSearchParams((params) => {
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
    });
  };

  const setIncludeInactive = (checked: boolean) => {
    setIncludeInactiveState(checked);
    setPageState(1);
    updateSearchParams((params) => {
      if (checked) params.set("includeInactive", "true");
      else params.delete("includeInactive");
      params.delete("page");
    });
  };

  const setBranchId = (value: number | undefined) => {
    setBranchIdState(value);
    setPageState(1);
    updateSearchParams((params) => {
      if (value != null) params.set("branchId", String(value));
      else params.delete("branchId");
      params.delete("page");
    });
  };

  const setPage = (next: number) => {
    const normalized = Math.max(1, Math.floor(next));
    setPageState(normalized);
    updateSearchParams((params) => {
      if (normalized <= 1) params.delete("page");
      else params.set("page", String(normalized));
    });
  };

  const hasNextPage = useMemo(
    () => staffList.length === DEFAULT_LIMIT,
    [staffList.length],
  );

  return {
    staffList,
    search,
    setSearch,
    includeInactive,
    setIncludeInactive,
    branchId,
    setBranchId,
    page,
    setPage,
    hasNextPage,
    isLoading,
    error,
    refetch,
  };
}
