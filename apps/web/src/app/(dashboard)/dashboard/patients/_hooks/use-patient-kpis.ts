"use client";

import { useBranch } from "@/app/(dashboard)/dashboard/branch-context";
import { trpc } from "@/trpc/client";

export function usePatientKpis() {
  const { activeBranchId } = useBranch();
  const { data, isLoading, error, refetch } = trpc.patients.getKpis.useQuery(
    { branchId: activeBranchId || 0 },
    { enabled: !!activeBranchId },
  );

  return {
    kpis: data,
    isLoading,
    error,
    refetch,
  };
}
