"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from "@visyx/ui/sidebar";
import { PermissionGate } from "@/app/auth/components/permission-gate";
import { BranchSwitcher } from "../branch-switcher";
import type { RouteConfig } from "../routes.config";
import { getRouteHref } from "../routes.config";

type DashboardSidebarProps = {
  mainItems: RouteConfig[];
};

export function DashboardSidebar({ mainItems }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});

  const isRouteActive = (item: RouteConfig) => {
    if (!pathname) return false;
    const href = getRouteHref(item, pathname);

    // Exact match for the dashboard root.
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="px-2 py-2">
        <div className="flex h-8 items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            Visyx
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            {mainItems
              .filter((item) => !item.parentId)
              .map((item) => {
                const Icon = item.icon;
                const href = getRouteHref(item);
                const children = mainItems.filter(
                  (child) => child.parentId === item.id,
                );

                const hasChildren = children.length > 0;
                const isParentOpen =
                  openParents[item.id] ?? isRouteActive(item) ?? false;

                const parentLink = (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isRouteActive(item)}
                    >
                      <Link href={href}>
                        {Icon ? <Icon className="size-4" /> : null}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {hasChildren ? (
                      <SidebarMenuAction
                        aria-label={
                          isParentOpen
                            ? `Collapse ${item.label}`
                            : `Expand ${item.label}`
                        }
                        showOnHover
                        onClick={() =>
                          setOpenParents((prev) => ({
                            ...prev,
                            [item.id]: !isParentOpen,
                          }))
                        }
                      >
                        <ChevronDown
                          className={`size-3 transition-transform ${
                            isParentOpen ? "rotate-180" : ""
                          }`}
                        />
                      </SidebarMenuAction>
                    ) : null}
                  </SidebarMenuItem>
                );

                const wrappedParent = !item.permissions ? (
                  parentLink
                ) : (
                  <PermissionGate key={item.id} required={item.permissions}>
                    {parentLink}
                  </PermissionGate>
                );

                if (!hasChildren) {
                  return wrappedParent;
                }

                return (
                  <div key={item.id} className="space-y-1">
                    {wrappedParent}
                    {isParentOpen ? (
                      <SidebarMenuSub>
                        {children.map((child) => {
                          const childHref = getRouteHref(child);
                          const childLink = (
                            <SidebarMenuSubItem key={child.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isRouteActive(child)}
                              >
                                <Link href={childHref}>
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );

                          if (!child.permissions) return childLink;

                          return (
                            <PermissionGate
                              key={child.id}
                              required={child.permissions}
                            >
                              {childLink}
                            </PermissionGate>
                          );
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </div>
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
