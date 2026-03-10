"use client";

import { Button } from "@visyx/ui/button";
import { Skeleton } from "@visyx/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { Key, Shield, User } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { NoPermission } from "@/app/auth/components/no-permission";
import { trpc } from "@/trpc/client";
import { StaffDetailHeader } from "../_components/staff-detail-header";
import { StaffPermissionsTab } from "../_components/staff-permissions-tab";
import { StaffProfileForm } from "../_components/staff-profile-form";
import { StaffSecurityTab } from "../_components/staff-security-tab";
import { useStaffDetail } from "../_hooks/use-staff-detail";
import { useStaffMutations } from "../_hooks/use-staff-mutations";

export default function UserAdministrationDetailPage() {
  const {
    id,
    staff,
    isLoading,
    error,
    invalidId,
    canView,
    canManage,
    canManagePermissions,
    canManagePermissionGroups,
    isSelf,
    authLoading,
  } = useStaffDetail();

  const { isSuperuser, hasPermission } = useAuth();
  const { update, deactivate, reactivate, bulkUpdatePermissions, applyGroup } =
    useStaffMutations(id);

  const canViewBranches = !authLoading && hasPermission("branches:view");
  const { data: branches } = trpc.branches.list.useQuery(
    { includeInactive: false },
    { enabled: canViewBranches },
  );
  const branchOptions = useMemo(() => branches ?? [], [branches]);

  const { data: permissionsCatalog } = trpc.staff.listPermissions.useQuery(
    { includeInactive: false },
    { enabled: canManagePermissions },
  );

  const { data: groups } = trpc.staff.listGroups.useQuery(
    { includeInactive: false },
    { enabled: canManagePermissionGroups && canManagePermissions },
  );
  const groupOptions = useMemo(() => groups ?? [], [groups]);

  if (!authLoading && !canView) {
    return (
      <NoPermission
        title="You don't have permission to view users"
        description="Contact a system administrator if you need access to user administration."
      />
    );
  }

  if (invalidId) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">User</h1>
        <p className="text-destructive text-sm">Invalid user id.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User</h1>
          <p className="text-muted-foreground">
            There was a problem loading this user.
          </p>
        </div>
        <p className="text-destructive text-sm">
          Unable to load user. It may have been deleted or you may not have
          access.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings/user-administration">
            Back to users
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !staff) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="h-64 rounded-md bg-muted" />
      </div>
    );
  }

  const handleSaveProfile = async (values: {
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    primaryBranchId: number | null;
    isAdmin?: boolean;
  }) => {
    await update.mutateAsync({
      id,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      jobTitle: values.jobTitle,
      primaryBranchId: values.primaryBranchId,
      ...(isSuperuser && values.isAdmin !== undefined
        ? { isAdmin: values.isAdmin }
        : {}),
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <StaffDetailHeader staff={staff} />

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <User className="mr-2 size-4" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Shield className="mr-2 size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Key className="mr-2 size-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <StaffProfileForm
            staff={staff}
            branchOptions={branchOptions}
            canManage={canManage}
            canViewBranches={canViewBranches}
            isSuperuser={isSuperuser}
            isSelf={isSelf}
            onSave={handleSaveProfile}
            onDeactivate={() => deactivate.mutate({ id })}
            onReactivate={() => reactivate.mutate({ id })}
            saving={update.isPending}
            deactivating={deactivate.isPending}
            reactivating={reactivate.isPending}
          />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <StaffSecurityTab />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <StaffPermissionsTab
            staff={staff}
            permissionsCatalog={permissionsCatalog}
            groups={groupOptions}
            branchOptions={branchOptions}
            canManagePermissions={canManagePermissions}
            canManagePermissionGroups={canManagePermissionGroups}
            staffIsAdmin={Boolean(staff.isAdmin)}
            onSavePermissions={async (updates) => {
              await bulkUpdatePermissions.mutateAsync({
                staffId: id,
                permissions: updates,
              });
            }}
            onApplyGroup={async (groupId, branchId) => {
              await applyGroup.mutateAsync({
                staffId: id,
                groupId,
                branchId,
              });
            }}
            saving={bulkUpdatePermissions.isPending}
            applyingGroup={applyGroup.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
