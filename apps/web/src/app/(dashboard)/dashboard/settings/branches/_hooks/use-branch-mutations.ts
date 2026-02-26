"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export function useBranchMutations(id?: number) {
  const utils = trpc.useUtils();

  const create = trpc.branches.create.useMutation({
    onSuccess: async (branch) => {
      if (!branch) return;
      await utils.branches.list.invalidate();
      toast.success(`Branch "${branch.name}" created`);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to create branch");
    },
  });

  const update = trpc.branches.update.useMutation({
    onSuccess: async (branch) => {
      if (!branch) return;
      if (id != null) {
        await utils.branches.get.invalidate({ id });
      }
      await utils.branches.list.invalidate();
      toast.success(`Branch "${branch.name}" updated`);
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update branch");
    },
  });

  const deactivate = trpc.branches.deactivate.useMutation({
    onSuccess: async () => {
      if (id != null) {
        await utils.branches.get.invalidate({ id });
      }
      await utils.branches.list.invalidate();
      toast.success("Branch deactivated");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to deactivate branch");
    },
  });

  const reactivate = trpc.branches.reactivate.useMutation({
    onSuccess: async () => {
      if (id != null) {
        await utils.branches.get.invalidate({ id });
      }
      await utils.branches.list.invalidate();
      toast.success("Branch reactivated");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to reactivate branch");
    },
  });

  return {
    create,
    update,
    deactivate,
    reactivate,
  };
}
