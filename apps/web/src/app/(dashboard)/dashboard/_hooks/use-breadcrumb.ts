"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { getBreadcrumb, type BreadcrumbItem } from "../routes.config";

export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = usePathname();
  return useMemo(() => getBreadcrumb(pathname ?? ""), [pathname]);
}
