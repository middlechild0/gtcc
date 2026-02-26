"use client";

import type { ReactNode } from "react";

type BranchesHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function BranchesHeader({
  title,
  description,
  actions,
}: BranchesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

