"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { type BreadcrumbItem, getBreadcrumb } from "../routes.config";

export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = usePathname();
  return useMemo(() => getBreadcrumb(pathname ?? ""), [pathname]);
}
