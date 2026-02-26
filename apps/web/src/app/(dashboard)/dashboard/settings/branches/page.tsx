"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Switch } from "@visyx/ui/switch";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { PermissionGate } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { BranchesHeader } from "./_components/branches-header";
import { BranchesTable } from "./_components/branches-table";
import { useBranchesList } from "./_hooks/use-branches-list";

function BranchesContent() {
  const {
    filteredBranches,
    search,
    setSearch,
    includeInactive,
    setIncludeInactive,
    isLoading,
    error,
    refetch,
  } = useBranchesList();

  return (
    <div className="space-y-6">
      <BranchesHeader
        title="Branches"
        description="Manage clinic locations and their contact details."
        actions={
          <>
            <PermissionGate required="branches:manage">
              <Button asChild>
                <Link href="/dashboard/settings/branches/new">
                  <Plus className="mr-2 size-4" />
                  New branch
                </Link>
              </Button>
            </PermissionGate>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh branches"
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
        <CardHeader className="space-y-4">
          <CardTitle className="text-base">Branch list</CardTitle>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              type="search"
              placeholder="Search by name, phone, email, or address"
              className="h-9 w-full max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Switch
                id="include-inactive"
                checked={includeInactive}
                onCheckedChange={setIncludeInactive}
              />
              <label
                htmlFor="include-inactive"
                className="text-muted-foreground text-sm"
              >
                Include inactive
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BranchesTable
            branches={filteredBranches}
            isLoading={isLoading}
            error={error}
            emptyMessage={
              search ? "No branches match your search." : "No branches found."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function BranchesPage() {
  return (
    <RouteGuard required="branches:view">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-7 w-40 rounded-md bg-muted" />
            <div className="h-32 rounded-md bg-muted" />
          </div>
        }
      >
        <BranchesContent />
      </Suspense>
    </RouteGuard>
  );
}
