"use client";

import { toast } from "sonner";
import { useBranch } from "@/app/(dashboard)/dashboard/branch-context";
import { trpc } from "@/trpc/client";

export function usePatientActions() {
  const utils = trpc.useUtils();
  const { activeBranchId } = useBranch();

  const deactivate = trpc.patients.deactivate.useMutation({
    onSuccess: async () => {
      await utils.patients.list.invalidate();
      await utils.patients.getKpis.invalidate();
      toast.success("Patient deactivated successfully");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to deactivate patient");
    },
  });

  return {
    deactivatePatient: async (patientId: string) => {
      if (!activeBranchId) {
        toast.error("No active branch selected");
        return;
      }
      return deactivate.mutateAsync({
        id: patientId,
        branchId: activeBranchId,
      });
    },
    isDeactivating: deactivate.isPending,
  };
}
