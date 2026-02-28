"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export function usePatientMutations() {
  const utils = trpc.useUtils();

  const create = trpc.patients.create.useMutation({
    onSuccess: async () => {
      await utils.patients.list.invalidate();
      toast.success("Patient registered");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to register patient");
    },
  });

  return {
    create,
  };
}

