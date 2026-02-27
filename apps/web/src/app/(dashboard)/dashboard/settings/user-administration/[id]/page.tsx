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
import { Avatar, AvatarFallback } from "@visyx/ui/avatar";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { Skeleton } from "@visyx/ui/skeleton";
import { Switch } from "@visyx/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { ArrowLeft, Key, Shield, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { NoPermission } from "@/app/auth/components/no-permission";
import { trpc } from "@/trpc/client";
import { StaffStatusBadge } from "../_components/staff-status-badge";
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

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("none");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!staff) return;
    setFirstName(staff.firstName ?? "");
    setLastName(staff.lastName ?? "");
    setPhone(staff.phone ?? "");
    setJobTitle(staff.jobTitle ?? "");
    setPrimaryBranchId(
      staff.primaryBranchId != null ? String(staff.primaryBranchId) : "none",
    );
    setIsAdmin(Boolean(staff.isAdmin));
  }, [staff]);

  const savingProfile =
    update.isPending || deactivate.isPending || reactivate.isPending;

  // Permissions state (global scope only: branchId = null)
  const { data: permissionsCatalog } = trpc.staff.listPermissions.useQuery(
    { includeInactive: false },
    { enabled: canManagePermissions },
  );

  const currentGlobalGranted = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const p of staff?.permissions ?? []) {
      if (p.branchId != null) continue;
      map.set(p.permissionId, Boolean(p.granted));
    }
    return map;
  }, [staff?.permissions]);

  const [desiredGranted, setDesiredGranted] = useState<Record<number, boolean>>(
    {},
  );
  const initialDesiredRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (!permissionsCatalog) return;
    const next: Record<number, boolean> = {};
    for (const perm of permissionsCatalog) {
      next[perm.id] = currentGlobalGranted.get(perm.id) ?? false;
    }
    setDesiredGranted(next);
    initialDesiredRef.current = next;
  }, [permissionsCatalog, currentGlobalGranted]);

  const permissionsByModule = useMemo(() => {
    const rows = permissionsCatalog ?? [];
    const grouped = new Map<string, typeof rows>();
    for (const p of rows) {
      const key = p.module ?? "other";
      grouped.set(key, [...(grouped.get(key) ?? []), p]);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissionsCatalog]);

  const hasScopedRows = useMemo(() => {
    const set = new Set<number>();
    for (const p of staff?.permissions ?? []) {
      if (p.branchId != null) set.add(p.permissionId);
    }
    return set;
  }, [staff?.permissions]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("none");
  const { data: groups } = trpc.staff.listGroups.useQuery(
    { includeInactive: false },
    { enabled: canManagePermissionGroups && canManagePermissions },
  );

  const applyGroupDisabled =
    selectedGroupId === "none" || applyGroup.isPending || !canManagePermissions;

  const savePermissionsDisabled =
    bulkUpdatePermissions.isPending || !canManagePermissions;

  const savePermissions = async () => {
    if (!permissionsCatalog) return;
    const changed = [];
    const initial = initialDesiredRef.current;
    for (const perm of permissionsCatalog) {
      const desired = Boolean(desiredGranted[perm.id]);
      const current = Boolean(initial[perm.id]);
      if (desired !== current) {
        changed.push({
          permissionId: perm.id,
          branchId: null,
          granted: desired,
        });
      }
    }

    if (changed.length === 0) return;

    await bulkUpdatePermissions.mutateAsync({
      staffId: id,
      permissions: changed,
    });
  };

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
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="h-64 rounded-md bg-muted" />
      </div>
    );
  }

  const displayName = [staff.firstName, staff.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link href="/dashboard/settings/user-administration">
            <ArrowLeft className="mr-2 size-4" />
            Back to users
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="size-14 rounded-lg">
            <AvatarFallback className="rounded-lg text-lg">
              {(displayName || staff.email || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {displayName || "—"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span>{staff.email}</span>
              <StaffStatusBadge isActive={Boolean(staff.isActive)} />
              <span>User ID: {staff.id}</span>
            </div>
          </div>
        </div>
      </div>

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
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update staff profile fields. Email is managed by Supabase and is
                read-only here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="h-9"
                    disabled={!canManage || savingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="h-9"
                    disabled={!canManage || savingProfile}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={staff.email ?? ""}
                    className="h-9"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    className="h-9"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canManage || savingProfile}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Optometrist"
                    className="h-9"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    disabled={!canManage || savingProfile}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {canViewBranches ? (
                  <div className="space-y-2">
                    <Label>Primary branch</Label>
                    <Select
                      value={primaryBranchId}
                      onValueChange={setPrimaryBranchId}
                      disabled={!canManage || savingProfile}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {branchOptions.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {isSuperuser ? (
                  <div className="space-y-2">
                    <Label>Staff admin</Label>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium">Admin access</div>
                        <p className="text-muted-foreground text-xs">
                          Admins bypass explicit permission checks.
                        </p>
                      </div>
                      <Switch
                        checked={isAdmin}
                        onCheckedChange={setIsAdmin}
                        disabled={!canManage || savingProfile || isSelf}
                      />
                    </div>
                    {isSelf ? (
                      <p className="text-muted-foreground text-xs">
                        You can’t change your own admin status.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={
                    !canManage ||
                    savingProfile ||
                    firstName.trim().length === 0 ||
                    lastName.trim().length === 0
                  }
                  onClick={() => {
                    const branch =
                      primaryBranchId === "none"
                        ? null
                        : Number(primaryBranchId);
                    void update.mutateAsync({
                      id,
                      firstName,
                      lastName,
                      phone: phone || undefined,
                      jobTitle: jobTitle || undefined,
                      primaryBranchId: Number.isFinite(branch as number)
                        ? branch
                        : null,
                      ...(isSuperuser ? { isAdmin } : {}),
                    });
                  }}
                >
                  {update.isPending ? "Saving..." : "Save changes"}
                </Button>

                {canManage ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant={staff.isActive ? "destructive" : "default"}
                        disabled={savingProfile || isSelf}
                      >
                        {staff.isActive ? "Deactivate user" : "Reactivate user"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {staff.isActive
                            ? "Deactivate this user?"
                            : "Reactivate this user?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {staff.isActive
                            ? "This will disable their login and mark them inactive. You can reactivate them later."
                            : "This will re-enable their login and mark them active again."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={savingProfile}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className={
                            staff.isActive
                              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              : undefined
                          }
                          disabled={savingProfile}
                          onClick={() => {
                            if (staff.isActive) deactivate.mutate({ id });
                            else reactivate.mutate({ id });
                          }}
                        >
                          {staff.isActive
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
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change the user&apos;s password or send a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              <Button variant="outline">Change password</Button>
              <Button variant="outline">Send reset link</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security with 2FA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Not configured. The user can enable 2FA from their account
                settings.
              </p>
              <Button variant="outline" className="mt-4">
                Enable 2FA
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active sessions</CardTitle>
              <CardDescription>
                View and revoke active sessions for this user.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No active sessions to display. Logic will be integrated later.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Configure what this user can access. This page manages global
                (all-branches) permissions; branch-scoped permissions will be
                shown but not edited here yet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!canManagePermissions ? (
                <NoPermission
                  title="You don't have permission to manage permissions"
                  description="Ask an administrator for auth:manage_permissions if you need to adjust access."
                />
              ) : (
                <>
                  {canManagePermissionGroups ? (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium">
                          Apply a permission group
                        </div>
                        <p className="text-muted-foreground text-xs">
                          This is a one-time copy into the user’s permissions.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Select
                          value={selectedGroupId}
                          onValueChange={setSelectedGroupId}
                          disabled={applyGroup.isPending}
                        >
                          <SelectTrigger className="h-9 sm:w-[320px]">
                            <SelectValue placeholder="Select group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Select a group</SelectItem>
                            {(groups ?? []).map((g) => (
                              <SelectItem key={g.id} value={String(g.id)}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={applyGroupDisabled}
                          onClick={() => {
                            void applyGroup.mutateAsync({
                              staffId: id,
                              groupId: Number(selectedGroupId),
                              branchId: null,
                            });
                          }}
                        >
                          {applyGroup.isPending ? "Applying..." : "Apply group"}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {staff.isAdmin
                        ? "This user is an Admin and bypasses explicit permission checks."
                        : "Toggle permissions below and save changes."}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={savePermissionsDisabled}
                        onClick={() => {
                          if (!permissionsCatalog) return;
                          const reset: Record<number, boolean> = {};
                          for (const perm of permissionsCatalog) {
                            reset[perm.id] =
                              currentGlobalGranted.get(perm.id) ?? false;
                          }
                          setDesiredGranted(reset);
                          initialDesiredRef.current = reset;
                        }}
                      >
                        Reset
                      </Button>
                      <Button
                        type="button"
                        disabled={savePermissionsDisabled}
                        onClick={() => void savePermissions()}
                      >
                        {bulkUpdatePermissions.isPending
                          ? "Saving..."
                          : "Save permissions"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {permissionsByModule.map(([module, perms]) => (
                      <div key={module} className="space-y-3">
                        <div className="text-sm font-semibold capitalize">
                          {module}
                        </div>
                        <div className="rounded-lg border divide-y">
                          {perms.map((perm) => {
                            const checked = Boolean(desiredGranted[perm.id]);
                            const scoped = hasScopedRows.has(perm.id);

                            return (
                              <div
                                key={perm.id}
                                className="flex items-center justify-between gap-4 p-3"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium">
                                    {perm.label}
                                  </div>
                                  <div className="text-muted-foreground text-xs">
                                    {perm.key}
                                    {scoped ? " • Scoped rules exist" : ""}
                                  </div>
                                </div>
                                <Switch
                                  checked={checked}
                                  onCheckedChange={(next) => {
                                    setDesiredGranted((prev) => ({
                                      ...prev,
                                      [perm.id]: Boolean(next),
                                    }));
                                  }}
                                  disabled={
                                    bulkUpdatePermissions.isPending ||
                                    staff.isAdmin === true
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
