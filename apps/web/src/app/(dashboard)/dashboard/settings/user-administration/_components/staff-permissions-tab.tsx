"use client";

import { Badge } from "@visyx/ui/badge";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@visyx/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { Switch } from "@visyx/ui/switch";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NoPermission } from "@/app/auth/components/no-permission";
import { trpc } from "@/trpc/client";
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
  saving,
}: StaffPermissionsTabProps) {
  const utils = trpc.useUtils();

  const [desiredGranted, setDesiredGranted] = useState<
    Record<number, Record<string, boolean>>
  >({});
  const initialDesiredRef = useRef<Record<number, Record<string, boolean>>>({});

  const scopeKeys = useMemo(() => ["global", ...branchOptions.map((b) => String(b.id))], [branchOptions]);

  useEffect(() => {
    if (!permissionsCatalog) return;
    const next: Record<number, Record<string, boolean>> = {};
    for (const perm of permissionsCatalog) {
      next[perm.id] = {};
      for (const key of scopeKeys) {
        next[perm.id]![key] = false;
      }
    }

    for (const p of staff?.permissions ?? []) {
      const key = p.branchId == null ? "global" : String(p.branchId);
      if (next[p.permissionId]) {
        next[p.permissionId]![key] = Boolean(p.granted);
      } else {
        next[p.permissionId] = { [key]: Boolean(p.granted) };
      }
    }
    setDesiredGranted(next);
    initialDesiredRef.current = structuredClone(next);
  }, [permissionsCatalog, staff?.permissions, scopeKeys]);

  const permissionsByModule = useMemo(() => {
    const rows = permissionsCatalog ?? [];
    const grouped = new Map<string, typeof rows>();
    for (const p of rows) {
      const key = p.module ?? "other";
      grouped.set(key, [...(grouped.get(key) ?? []), p]);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissionsCatalog]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("none");
  const [groupTargetScope, setGroupTargetScope] = useState<string>("global");
  const [applyingGroupLocal, setApplyingGroupLocal] = useState(false);

  const applyGroupDisabled =
    selectedGroupId === "none" || applyingGroupLocal || !canManagePermissions;

  const handleApplyGroupLocal = async () => {
    const gid = Number(selectedGroupId);
    if (!Number.isFinite(gid)) return;

    try {
      setApplyingGroupLocal(true);
      const groupData = await utils.staff.getGroup.fetch({ id: gid });
      if (!groupData) return;

      setDesiredGranted((prev) => {
        const next = structuredClone(prev);
        // Clear existing permissions for this specific scope
        for (const pid in next) {
          if (next[pid]) {
            next[pid][groupTargetScope] = false;
          }
        }
        // Apply group permissions to this scope
        for (const gp of groupData.items) {
          if (next[gp.permissionId]) {
            next[gp.permissionId]![groupTargetScope] = true;
          }
        }
        return next;
      });
      toast.success(
        "Template applied to local preview. Save changes below to commit.",
      );
    } catch (err) {
      toast.error("Failed to load group details.");
    } finally {
      setApplyingGroupLocal(false);
    }
  };

  const savePermissions = async () => {
    if (!permissionsCatalog) return;
    const changed: Array<{
      permissionId: number;
      branchId: number | null;
      granted: boolean;
    }> = [];

    const initial = initialDesiredRef.current;

    for (const perm of permissionsCatalog) {
      for (const scopeKey of scopeKeys) {
        const desired = Boolean(desiredGranted[perm.id]?.[scopeKey]);
        const current = Boolean(initial[perm.id]?.[scopeKey]);
        if (desired !== current) {
          changed.push({
            permissionId: perm.id,
            branchId: scopeKey === "global" ? null : Number(scopeKey),
            granted: desired,
          });
        }
      }
    }

    if (changed.length === 0) {
      toast.info("No changes to save.");
      return;
    }
    await onSavePermissions(changed);
  };

  const resetToCurrent = () => {
    if (!permissionsCatalog) return;
    setDesiredGranted(structuredClone(initialDesiredRef.current));
  };

  const [openRows, setOpenRows] = useState<Set<number>>(new Set());
  const toggleRow = (id: number) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    if (!permissionsCatalog) return;
    const allIds = permissionsCatalog.map(p => p.id);
    setOpenRows(new Set(allIds));
  };

  const collapseAll = () => setOpenRows(new Set());

  const getBadges = (permId: number) => {
    const scopes = desiredGranted[permId] || {};
    const active: string[] = [];
    if (scopes["global"]) {
      active.push("Global");
      return active;
    }
    for (const b of branchOptions) {
      if (scopes[String(b.id)]) active.push(b.name);
    }
    return active;
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
          Configure what this user can access. Expand a row to toggle access globally or for specific branches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {canManagePermissionGroups && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">
                Apply a permission group
              </div>
              <p className="text-muted-foreground text-xs">
                Preview a template by applying it to the desired scope. You must save changes to persist them.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
                disabled={applyingGroupLocal}
              >
                <SelectTrigger className="h-9 sm:w-[260px]">
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

              <Select
                value={groupTargetScope}
                onValueChange={setGroupTargetScope}
                disabled={applyingGroupLocal}
              >
                <SelectTrigger className="h-9 sm:w-[200px]">
                  <SelectValue placeholder="Select target scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (All branches)</SelectItem>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                disabled={applyGroupDisabled}
                onClick={handleApplyGroupLocal}
              >
                {applyingGroupLocal ? "Applying..." : "Preview group"}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={resetToCurrent}
            >
              Reset to saved
            </Button>
            <Button
              type="button"
              disabled={saving || staffIsAdmin}
              onClick={() => void savePermissions()}
            >
              {saving ? "Saving..." : "Save changes"}
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
                    const isOpen = openRows.has(perm.id);
                    const activeScopes = getBadges(perm.id);
                    const isGlobal = Boolean(desiredGranted[perm.id]?.["global"]);

                    return (
                      <Collapsible
                        key={perm.id}
                        open={isOpen}
                        onOpenChange={() => toggleRow(perm.id)}
                      >
                        <div className="flex flex-col">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                              <div className="min-w-0 flex flex-col gap-1.5">
                                <div className="text-sm font-medium">
                                  {perm.label}
                                  <span className="text-muted-foreground text-xs ml-2 font-normal hidden sm:inline-block">({perm.key})</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[20px] items-center">
                                  {activeScopes.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">No access</span>
                                  ) : (
                                    activeScopes.map((scope) => (
                                      <Badge
                                        key={scope}
                                        variant={scope === "Global" ? "default" : "secondary"}
                                        className="text-[10px] h-[18px] px-1.5 font-medium"
                                      >
                                        {scope}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center text-muted-foreground shrink-0">
                                {isOpen ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="bg-muted/10 border-t p-3 space-y-3">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Configure Scopes
                              </div>
                              <div className="flex items-center justify-between py-1">
                                <span className="text-sm font-medium">Global (All branches)</span>
                                <Switch
                                  checked={isGlobal}
                                  onCheckedChange={(next) =>
                                    setDesiredGranted((prev) => ({
                                      ...prev,
                                      [perm.id]: {
                                        ...prev[perm.id],
                                        ["global"]: Boolean(next),
                                      },
                                    }))
                                  }
                                  disabled={saving || staffIsAdmin}
                                />
                              </div>
                              <div className="space-y-1">
                                {branchOptions.map((b) => (
                                  <div
                                    key={b.id}
                                    className="flex items-center justify-between py-1 border-t border-border/50"
                                  >
                                    <div className="flex items-center gap-2 pl-4">
                                      <span className="text-sm text-muted-foreground">Branch: {b.name}</span>
                                      {isGlobal && (
                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
                                          Inherited from Global
                                        </span>
                                      )}
                                    </div>
                                    <Switch
                                      checked={isGlobal || Boolean(desiredGranted[perm.id]?.[String(b.id)])}
                                      onCheckedChange={(next) =>
                                        setDesiredGranted((prev) => ({
                                          ...prev,
                                          [perm.id]: {
                                            ...prev[perm.id],
                                            [String(b.id)]: Boolean(next),
                                          },
                                        }))
                                      }
                                      disabled={saving || staffIsAdmin || isGlobal}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
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
