"use client";

import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { Switch } from "@visyx/ui/switch";
import { useEffect, useMemo, useRef, useState } from "react";
import { NoPermission } from "@/app/auth/components/no-permission";
import type { PermissionRow, StaffDetail } from "../_utils/staff-types";

type StaffPermissionsTabProps = {
  staff: StaffDetail;
  permissionsCatalog: PermissionRow[] | undefined;
  groups: { id: number; name: string }[];
  branchOptions: { id: number; name: string }[];
  canManagePermissions: boolean;
  canManagePermissionGroups: boolean;
  staffIsAdmin: boolean;
  onSavePermissions: (
    updates: Array<{
      permissionId: number;
      branchId: number | null;
      granted: boolean;
    }>,
  ) => Promise<void>;
  onApplyGroup: (groupId: number, branchId: number | null) => Promise<void>;
  saving: boolean;
  applyingGroup: boolean;
};

export function StaffPermissionsTab({
  staff,
  permissionsCatalog,
  groups,
  branchOptions,
  canManagePermissions,
  canManagePermissionGroups,
  staffIsAdmin,
  onSavePermissions,
  onApplyGroup,
  saving,
  applyingGroup,
}: StaffPermissionsTabProps) {
  const [scopeBranchId, setScopeBranchId] = useState<number | null>(null);
  const scopeKey = scopeBranchId ?? "global";

  const currentGrantedByScope = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const p of staff?.permissions ?? []) {
      const key = p.branchId ?? "global";
      if (key === scopeKey) {
        map.set(p.permissionId, Boolean(p.granted));
      }
    }
    return map;
  }, [staff?.permissions, scopeKey]);

  const [desiredGranted, setDesiredGranted] = useState<Record<number, boolean>>(
    {},
  );
  const initialDesiredRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (!permissionsCatalog) return;
    const next: Record<number, boolean> = {};
    for (const perm of permissionsCatalog) {
      next[perm.id] = currentGrantedByScope.get(perm.id) ?? false;
    }
    setDesiredGranted(next);
    initialDesiredRef.current = next;
  }, [permissionsCatalog, currentGrantedByScope]);

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
  const applyGroupDisabled =
    selectedGroupId === "none" || applyingGroup || !canManagePermissions;

  const handleApplyGroup = () => {
    const gid = Number(selectedGroupId);
    if (!Number.isFinite(gid)) return;
    void onApplyGroup(gid, scopeBranchId);
  };

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
          branchId: scopeBranchId,
          granted: desired,
        });
      }
    }
    if (changed.length === 0) return;
    await onSavePermissions(changed);
  };

  const resetToCurrent = () => {
    if (!permissionsCatalog) return;
    const reset: Record<number, boolean> = {};
    for (const perm of permissionsCatalog) {
      reset[perm.id] = currentGrantedByScope.get(perm.id) ?? false;
    }
    setDesiredGranted(reset);
    initialDesiredRef.current = reset;
  };

  if (!canManagePermissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Configure what this user can access. Requires
            auth:manage_permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NoPermission
            title="You don't have permission to manage permissions"
            description="Ask an administrator for auth:manage_permissions if you need to adjust access."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <CardDescription>
          Configure what this user can access. Select a scope to edit global or
          branch-specific permissions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManagePermissionGroups ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">
                Apply a permission group
              </div>
              <p className="text-muted-foreground text-xs">
                One-time copy into the user&apos;s permissions for the selected
                scope.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
                disabled={applyingGroup}
              >
                <SelectTrigger className="h-9 sm:w-[320px]">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a group</SelectItem>
                  {groups.map((g) => (
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
                onClick={handleApplyGroup}
              >
                {applyingGroup ? "Applying..." : "Apply group"}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm text-muted-foreground">
              Editing scope:
            </span>
            <Select
              value={scopeBranchId == null ? "global" : String(scopeBranchId)}
              onValueChange={(v) =>
                setScopeBranchId(v === "global" ? null : Number(v))
              }
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">All branches</SelectItem>
                {branchOptions.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={resetToCurrent}
            >
              Reset
            </Button>
            <Button
              type="button"
              disabled={saving || staffIsAdmin}
              onClick={() => void savePermissions()}
            >
              {saving ? "Saving..." : "Save permissions"}
            </Button>
          </div>
        </div>

        {staffIsAdmin ? (
          <p className="text-muted-foreground text-sm">
            This user is an Admin and bypasses explicit permission checks.
          </p>
        ) : (
          <div className="space-y-6">
            {permissionsByModule.map(([module, perms]) => (
              <div key={module} className="space-y-3">
                <div className="text-sm font-semibold capitalize">{module}</div>
                <div className="divide-y rounded-lg border">
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
                          disabled={saving || staffIsAdmin}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
