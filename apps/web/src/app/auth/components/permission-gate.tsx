"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import type { PermissionKey } from "@/auth/permissions";

type PermissionGateProps = {
  required: PermissionKey | PermissionKey[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate(props: PermissionGateProps) {
  const { required, requireAll, fallback = null, children } = props;
  const { isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(required, { requireAll })) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function useHasPermission(
  required: PermissionKey | PermissionKey[],
  opts?: { requireAll?: boolean },
) {
  const { isLoading, hasPermission } = useAuth();
  const allowed = !isLoading && hasPermission(required, opts);

  return {
    isLoading,
    allowed,
  };
}
