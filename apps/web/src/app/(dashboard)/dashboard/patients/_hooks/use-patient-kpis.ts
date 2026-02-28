"use client";

import { trpc } from "@/trpc/client";

export function usePatientKpis() {
  const { data, isLoading, error, refetch } = trpc.patients.kpis.useQuery();

  return {
    kpis: data,
    isLoading,
    error,
    refetch,
  };
}

