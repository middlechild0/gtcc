"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import type { PermissionKey } from "@/auth/permissions";
import { NoPermission } from "./no-permission";

type RouteGuardProps = {
  required: PermissionKey | PermissionKey[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
};

export function RouteGuard(props: RouteGuardProps) {
  const { required, requireAll, fallback, children } = props;
  const { isLoading, hasPermission } = useAuth();

  if (isLoading) {
    // Neutral page-level skeleton while auth is resolving.
    return (
      <div className="space-y-4">
        <div className="h-7 w-40 rounded-md bg-muted" />
        <div className="h-32 rounded-md bg-muted" />
      </div>
    );
  }

  if (!hasPermission(required, { requireAll })) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <NoPermission
        title="You don't have access to this area"
        description="If you believe this is a mistake, contact an administrator to adjust your permissions."
      />
    );
  }

  return <>{children}</>;
}
