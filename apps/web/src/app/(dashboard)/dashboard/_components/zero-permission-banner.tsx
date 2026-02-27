"use client";

import { Alert, AlertDescription, AlertTitle } from "@visyx/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/app/auth/_hooks/use-auth";

/**
 * Shown when the user is in a branch where they have zero permissions (backend
 * returns permissions: []). Lets them know early and points them to the branch
 * switcher so they can switch to a branch they have access to.
 */
export function ZeroPermissionBanner() {
  const { staff, permissions, isLoading, isSuperuser, isStaffAdmin } =
    useAuth();

  const hasNoPermissionsInBranch =
    !isLoading &&
    Boolean(staff) &&
    !isSuperuser &&
    !isStaffAdmin &&
    Array.isArray(permissions) &&
    permissions.length === 0;

  if (!hasNoPermissionsInBranch) return null;

  return (
    <Alert
      variant="warning"
      className="mx-4 mt-4 border-amber-500/50 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <AlertCircle className="size-4" />
      <AlertTitle>No permissions in this branch</AlertTitle>
      <AlertDescription>
        You don&apos;t have any permissions assigned in the currently selected
        branch. Use the <strong>branch switcher</strong> in the sidebar to
        switch to another branch where you have access.
      </AlertDescription>
    </Alert>
  );
}
