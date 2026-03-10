"use client";

import { useBranch } from "@/app/(dashboard)/dashboard/branch-context";
import { trpc } from "@/trpc/client";

type UsePatientKpisOptions = {
  enabled?: boolean;
};

export function usePatientKpis(options: UsePatientKpisOptions = {}) {
  const { activeBranchId } = useBranch();
  const isEnabled = !!activeBranchId && (options.enabled ?? true);

  const { data, isLoading, error, refetch } = trpc.patients.getKpis.useQuery(
    { branchId: activeBranchId || 0 },
    { enabled: isEnabled },
  );

  return {
    kpis: data,
    isLoading,
    error,
    refetch,
  };
}
