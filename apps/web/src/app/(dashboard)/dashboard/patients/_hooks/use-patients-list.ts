"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { trpc } from "@/trpc/client";
import { filterPatients } from "../_utils/patient-filters";
import type { Patient } from "../_utils/patient-types";

export function usePatientsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearchState] = useState(searchParams?.get("q") ?? "");

  const { data, isLoading, error, refetch } = trpc.patients.list.useQuery();

  const patients: Patient[] = data ?? [];

  const filteredPatients = useMemo(
    () => filterPatients(patients, search),
    [patients, search],
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

  return {
    patients,
    filteredPatients,
    search,
    setSearch,
    isLoading,
    error,
    refetch,
  };
}

