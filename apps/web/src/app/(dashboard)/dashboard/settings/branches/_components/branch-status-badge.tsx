"use client";

import { Badge } from "@visyx/ui/badge";

export function BranchStatusBadge(props: { isActive: boolean }) {
  const { isActive } = props;
  return (
    <Badge
      variant={isActive ? "default" : "outline"}
      className={isActive ? "" : "border-destructive/30 text-destructive"}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
