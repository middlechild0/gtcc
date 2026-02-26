"use client";

import { useMemo } from "react";
import type { SettingsMenuItem } from "@visyx/ui/settings-menu";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import type { RouteConfig } from "../routes.config";
import { getRouteHref } from "../routes.config";

export function useSettingsMenuItems(
  searchableRoutes: RouteConfig[],
): SettingsMenuItem[] {
  const { isLoading: authLoading, hasPermission } = useAuth();

  return useMemo(() => {
    if (authLoading) return [];

    return searchableRoutes
      .map((route) => {
        const allowed =
          !route.permissions || hasPermission(route.permissions);
        if (!allowed) return null;

        const groupLabel =
          route.group === "settings" ? "Settings" : "Main";
        return {
          label: `${groupLabel} · ${route.label}`,
          href: getRouteHref(route),
        };
      })
      .filter((item): item is SettingsMenuItem => item !== null);
  }, [authLoading, hasPermission, searchableRoutes]);
}
