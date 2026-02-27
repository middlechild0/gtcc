"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export function useStaffMutations(staffId?: number) {
  const utils = trpc.useUtils();

  const invite = trpc.staff.invite.useMutation({
    onSuccess: async () => {
      await utils.staff.list.invalidate();
      toast.success("Invite sent");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to invite staff");
    },
  });

  const update = trpc.staff.update.useMutation({
    onSuccess: async () => {
      await utils.staff.list.invalidate();
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
      toast.success("User updated");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update user");
    },
  });

  const deactivate = trpc.staff.deactivate.useMutation({
    onSuccess: async () => {
      await utils.staff.list.invalidate();
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
      toast.success("User deactivated");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to deactivate user");
    },
  });

  const reactivate = trpc.staff.reactivate.useMutation({
    onSuccess: async () => {
      await utils.staff.list.invalidate();
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
      toast.success("User reactivated");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to reactivate user");
    },
  });

  const grantPermission = trpc.staff.grantPermission.useMutation({
    onSuccess: async () => {
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to grant permission");
    },
  });

  const revokePermission = trpc.staff.revokePermission.useMutation({
    onSuccess: async () => {
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to revoke permission");
    },
  });

  const bulkUpdatePermissions = trpc.staff.bulkUpdatePermissions.useMutation({
    onSuccess: async () => {
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
      toast.success("Permissions updated");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to update permissions");
    },
  });

  const applyGroup = trpc.staff.applyGroup.useMutation({
    onSuccess: async () => {
      if (staffId != null) {
        await utils.staff.get.invalidate({ id: staffId });
      }
      toast.success("Permission group applied");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to apply permission group");
    },
  });

  return {
    invite,
    update,
    deactivate,
    reactivate,
    grantPermission,
    revokePermission,
    bulkUpdatePermissions,
    applyGroup,
  };
}
