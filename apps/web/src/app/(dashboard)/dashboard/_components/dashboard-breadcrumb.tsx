"use client";

import { cn } from "@visyx/ui/cn";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBreadcrumb } from "../_hooks/use-breadcrumb";

export function DashboardBreadcrumb() {
  const items = useBreadcrumb();

  if (items.length === 0) {
    return (
      <span className="text-lg font-semibold tracking-tight">Dashboard</span>
    );
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-lg font-semibold tracking-tight"
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const label = item.label;
        if (item.href != null && !isLast) {
          return (
            <span key={i} className="flex items-center gap-1.5">
              <Link
                href={item.href}
                className="text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {label}
              </Link>
              <ChevronRight
                className="text-muted-foreground size-4 shrink-0"
                aria-hidden
              />
            </span>
          );
        }
        return (
          <span
            key={i}
            className={cn(
              "truncate",
              isLast ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        );
      })}
    </nav>
  );
}
