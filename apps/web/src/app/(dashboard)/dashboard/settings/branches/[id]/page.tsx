"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@visyx/ui/alert-dialog";
import { Button } from "@visyx/ui/button";
import { Skeleton } from "@visyx/ui/skeleton";
import Link from "next/link";
import { NoPermission } from "@/app/auth/components/no-permission";
import { BranchForm } from "../_components/branch-form";
import { BranchStatusBadge } from "../_components/branch-status-badge";
import { useBranchDetail } from "../_hooks/use-branch-detail";
import { useBranchMutations } from "../_hooks/use-branch-mutations";

export default function BranchDetailPage() {
  const {
    id,
    branch,
    isLoading,
    error,
    invalidId,
    canView,
    canManage,
    authLoading,
  } = useBranchDetail();
  const { update, deactivate, reactivate } = useBranchMutations(id);

  if (!authLoading && !canView) {
    return (
      <NoPermission
        title="You don't have permission to view this branch"
        description="Contact a system administrator if you need access to branch details."
      />
    );
  }

  if (invalidId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Branch</h1>
        <p className="text-destructive text-sm">Invalid branch id.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branch</h1>
          <p className="text-muted-foreground">
            There was a problem loading this branch.
          </p>
        </div>
        <p className="text-destructive text-sm">
          Unable to load branch. It may have been deleted or you may not have
          access.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings/branches">Back to branches</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !branch) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="space-y-4 rounded-lg border p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    );
  }

  const readOnly = !canManage;

  const handleSubmit = async (
    values: Omit<Parameters<typeof update.mutateAsync>[0], "id">,
  ) => {
    if (!canManage) return;
    await update.mutateAsync({ id, ...values });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {branch.name}
          </h1>
          <div className="flex items-center gap-3 text-muted-foreground text-sm">
            <BranchStatusBadge isActive={branch.isActive} />
            <span>Branch ID: {branch.id}</span>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings/branches">Back to branches</Link>
        </Button>
      </div>

      <BranchForm
        mode="edit"
        defaultValues={{
          name: branch.name ?? "",
          address: branch.address ?? "",
          phone: branch.phone ?? "",
          email: branch.email ?? "",
        }}
        readOnly={readOnly}
        submitting={
          update.isPending || deactivate.isPending || reactivate.isPending
        }
        cancelHref="/dashboard/settings/branches"
        onSubmit={handleSubmit}
      />

      {canManage && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant={branch.isActive ? "destructive" : "default"}
                disabled={deactivate.isPending || reactivate.isPending}
              >
                {branch.isActive ? "Deactivate branch" : "Reactivate branch"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {branch.isActive
                    ? "Deactivate this branch?"
                    : "Reactivate this branch?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {branch.isActive
                    ? "This will mark the branch as inactive. Staff will no longer be able to use it for daily operations, but historical data will be preserved. You can enable it again later from this page."
                    : "This will mark the branch as active again so staff can use it in daily operations."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={deactivate.isPending || reactivate.isPending}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className={
                    branch.isActive
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : undefined
                  }
                  disabled={deactivate.isPending || reactivate.isPending}
                  onClick={() => {
                    if (branch.isActive) {
                      deactivate.mutate({ id });
                    } else {
                      reactivate.mutate({ id });
                    }
                  }}
                >
                  {branch.isActive
                    ? deactivate.isPending
                      ? "Deactivating..."
                      : "Deactivate"
                    : reactivate.isPending
                      ? "Reactivating..."
                      : "Reactivate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
