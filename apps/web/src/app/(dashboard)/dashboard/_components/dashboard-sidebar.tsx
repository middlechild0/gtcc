"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@visyx/ui/sidebar";
import Link from "next/link";
import { PermissionGate } from "@/app/auth/components/permission-gate";
import type { RouteConfig } from "../routes.config";
import { getRouteHref } from "../routes.config";
import { BranchSwitcher } from "../branch-switcher";

type DashboardSidebarProps = {
  mainItems: RouteConfig[];
};

export function DashboardSidebar({ mainItems }: DashboardSidebarProps) {
  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2">
          <span className="font-semibold text-sidebar-foreground">Visyx</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {mainItems.map((item) => {
              const Icon = item.icon;
              const href = getRouteHref(item);
              const link = (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link href={href}>
                      {Icon ? <Icon className="size-4" /> : null}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
              if (!item.permissions) return link;
              return (
                <PermissionGate
                  key={item.id}
                  required={item.permissions}
                >
                  {link}
                </PermissionGate>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 px-2 py-2">
          <BranchSwitcher />
          <div className="text-muted-foreground text-xs">Visyx Dashboard</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
