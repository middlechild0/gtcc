"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export function usePatientMutations() {
  const utils = trpc.useUtils();

  const create = trpc.patients.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.patients.list.invalidate(),
        utils.patients.getKpis.invalidate(),
      ]);
      toast.success("Patient registered");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to register patient");
    },
  });

  const update = trpc.patients.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.patients.list.invalidate(),
        utils.patients.get.invalidate(),
      ]);
      toast.success("Patient updated successfully");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update patient");
    },
  });

  return {
    create,
    update,
  };
}
