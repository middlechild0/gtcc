"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/app/auth/_hooks/use-auth";

export function useBranchDetail() {
  const params = useParams();
  const rawId = params?.id;
  const id = Number(rawId);

  const { isLoading: authLoading, hasPermission } = useAuth();
  const canView = !authLoading && hasPermission("branches:view");
  const canManage = !authLoading && hasPermission("branches:manage");

  const enabled = Number.isFinite(id);
  const {
    data: branch,
    isLoading,
    error,
  } = trpc.branches.get.useQuery(
    { id },
    {
      enabled,
    },
  );

  const invalidId = !enabled;

  return {
    id,
    branch,
    isLoading,
    error,
    invalidId,
    canView,
    canManage,
    authLoading,
  };
}

