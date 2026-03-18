"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@visyx/ui/select";
import { useSidebar } from "@visyx/ui/sidebar";
import { useMemo } from "react";
import { useBranch } from "./branch-context";

/**
 * Shown to all authenticated staff. Backend allows branches.list without
 * branches:view so users can always switch branch (e.g. escape a zero-permission branch).
 */
export function BranchSwitcher() {
  const { branches, activeBranchId, setActiveBranchId, isLoading, error } =
    useBranch();
  const { state } = useSidebar();

  const activeBranch = useMemo(
    () => branches.find((b) => b.id === activeBranchId) ?? null,
    [branches, activeBranchId],
  );

  // In icon-collapsed mode, hide the full branch control to avoid overflow
  if (state === "collapsed") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-sidebar-foreground">
          Active branch
        </p>
        <div className="h-8 w-full rounded-md bg-sidebar-foreground/10" />
      </div>
    );
  }

  if (error || branches.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-sidebar-foreground">
          Active branch
        </p>
        <p className="text-muted-foreground text-xs">No branches available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-sidebar-foreground">
        Active branch
      </p>
      <Select
        value={activeBranch ? String(activeBranch.id) : undefined}
        onValueChange={(value) => {
          const id = Number.parseInt(value, 10);
          if (Number.isFinite(id)) {
            setActiveBranchId(id);
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          {activeBranch ? activeBranch.name : "Select branch"}
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={String(branch.id)}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
