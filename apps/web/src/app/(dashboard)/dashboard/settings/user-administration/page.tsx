"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { Switch } from "@visyx/ui/switch";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { StaffTable } from "./_components/staff-table";
import { UserAdminHeader } from "./_components/user-admin-header";
import { useStaffList } from "./_hooks/use-staff-list";

function UserAdministrationContent() {
  const {
    staffList,
    search,
    setSearch,
    includeInactive,
    setIncludeInactive,
    branchId,
    setBranchId,
    page,
    setPage,
    hasNextPage,
    isLoading,
    error,
    refetch,
  } = useStaffList();

  const { isLoading: authLoading, hasPermission } = useAuth();
  const canViewBranches = !authLoading && hasPermission("branches:view");

  const { data: branches } = trpc.branches.list.useQuery(
    { includeInactive: false },
    { enabled: canViewBranches },
  );

  const branchOptions = useMemo(() => branches ?? [], [branches]);

  return (
    <div className="space-y-6">
      <UserAdminHeader
        title="User Administration"
        description="Invite staff, manage profiles, and control access."
        actions={
          <>
            <Button asChild>
              <Link href="/dashboard/settings/user-administration/invite">
                <Plus className="mr-2 size-4" />
                Invite user
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh users"
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">Users</CardTitle>
              <p className="text-muted-foreground text-sm">
                Search, invite, and manage staff accounts.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Input
                type="search"
                placeholder="Search by name or email"
                className="h-9 w-full max-w-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {canViewBranches ? (
                <Select
                  value={branchId != null ? String(branchId) : "all"}
                  onValueChange={(value) => {
                    if (value === "all") setBranchId(undefined);
                    else setBranchId(Number(value));
                  }}
                >
                  <SelectTrigger className="h-9 w-full sm:w-[220px]">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {branchOptions.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              <div className="flex items-center gap-2">
                <Switch
                  id="include-inactive-staff"
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                />
                <label
                  htmlFor="include-inactive-staff"
                  className="text-muted-foreground text-sm"
                >
                  Include inactive
                </label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <StaffTable
            staff={staffList}
            isLoading={isLoading}
            error={error}
            emptyMessage={search ? "No users match your search." : undefined}
          />

          <div className="flex items-center justify-between border-t p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="mr-2 size-4" />
              Previous
            </Button>

            <div className="text-muted-foreground text-sm">Page {page}</div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage || isLoading}
            >
              Next
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UserAdministrationPage() {
  return (
    <RouteGuard required="auth:manage_staff">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-7 w-40 rounded-md bg-muted" />
            <div className="h-32 rounded-md bg-muted" />
          </div>
        }
      >
        <UserAdministrationContent />
      </Suspense>
    </RouteGuard>
  );
}
