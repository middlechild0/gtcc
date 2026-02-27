"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { trpc } from "@/trpc/client";

export function useStaffDetail() {
  const params = useParams();
  const rawId = params?.id;
  const id = Number(rawId);

  const { isLoading: authLoading, hasPermission, staff: meStaff } = useAuth();
  const canView = !authLoading && hasPermission("auth:manage_staff");
  const canManage = canView;
  const canManagePermissions =
    !authLoading && hasPermission("auth:manage_permissions");
  const canManagePermissionGroups =
    !authLoading && hasPermission("auth:manage_permission_groups");

  const enabled = Number.isFinite(id);
  const {
    data: staff,
    isLoading,
    error,
    refetch,
  } = trpc.staff.get.useQuery(
    { id },
    {
      enabled,
    },
  );

  const invalidId = !enabled;
  const isSelf = meStaff?.id != null && meStaff.id === id;

  return {
    id,
    staff,
    isLoading,
    error,
    refetch,
    invalidId,
    canView,
    canManage,
    canManagePermissions,
    canManagePermissionGroups,
    isSelf,
    authLoading,
  };
}
