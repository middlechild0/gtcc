"use client";

import { useSession } from "@/app/auth/_hooks/use-session";
import {
  DashboardFooter,
  DashboardFooterFeedback,
  DashboardFooterSection,
} from "@visyx/ui/dashboard-footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@visyx/ui/sidebar";
import { SettingsMenu, type SettingsMenuItem } from "@visyx/ui/settings-menu";
import { TopNav } from "@visyx/ui/top-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { PermissionGate } from "@/app/auth/components/permission-gate";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { navItems } from "./dashboard/routes.config";
import { BranchProvider } from "./dashboard/branch-context";
import { BranchSwitcher } from "./dashboard/branch-switcher";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const { isLoading: authLoading, hasPermission } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? "Account";
  const userEmail = user?.email ?? undefined;

  const navTitle = (() => {
    const parts = (pathname ?? "").split("/").filter(Boolean);
    const dashIdx = parts.indexOf("dashboard");
    const section = dashIdx >= 0 ? parts[dashIdx + 1] : parts[0];

    if (!section) return "Dashboard";

    const map: Record<string, string> = {
      dashboard: "Dashboard",
      settings: "Settings",
      "user-administration": "User Administration",
    };

    return (
      map[section] ??
      section
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  })();

  const settingsMenuItems = useMemo<SettingsMenuItem[]>(() => {
    if (authLoading) return [];

    return navItems
      .map((item) => {
        const allowed =
          !item.requiredPermissions ||
          hasPermission(item.requiredPermissions);

        if (!allowed) return null;

        const groupLabel =
          item.group === "settings" ? "Settings" : "Main";

        return {
          label: `${groupLabel} · ${item.label}`,
          href: item.href,
        };
      })
      .filter((item): item is SettingsMenuItem => item !== null);
  }, [authLoading, hasPermission]);

  return (
    <SidebarProvider defaultOpen={true}>
      <BranchProvider>
        <Sidebar side="left" collapsible="icon">
          <SidebarHeader>
            <div className="flex h-8 items-center gap-2 px-2">
              <span className="font-semibold text-sidebar-foreground">
                Visyx
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarMenu>
                {navItems
                  .filter((item) => item.group === "main")
                  .map((item): React.ReactNode => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            {Icon ? (
                              <Icon className="size-4" />
                            ) : null}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarMenu>
                {navItems
                  .filter((item) => item.group === "settings")
                  .map((item): React.ReactNode => {
                    const Icon = item.icon;
                    const content = (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            {Icon ? (
                              <Icon className="size-4" />
                            ) : null}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );

                    if (!item.requiredPermissions) {
                      return content;
                    }

                    return (
                      <PermissionGate
                        key={item.id}
                        required={item.requiredPermissions}
                      >
                        {content}
                      </PermissionGate>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex flex-col gap-2 px-2 py-2">
              <BranchSwitcher />
              <div className="text-muted-foreground text-xs">
                Visyx Dashboard
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex min-h-svh flex-col">
          <TopNav
            title={navTitle}
            searchPlaceholder="Find Member"
            user={
              user
                ? { name: displayName, email: userEmail }
                : undefined
            }
            actions={
              <SettingsMenu
                items={settingsMenuItems}
                searchPlaceholder="Search pages and settings"
              />
            }
            className="border-sidebar-border bg-sidebar text-sidebar-foreground"
          />
          <div className="min-h-0 flex-1 overflow-auto p-6">
            {children}
          </div>
          <DashboardFooter
            bottomBar={
              <>
                <p className="text-muted-foreground text-xs">
                  © {new Date().getFullYear()} Visyx. All rights reserved.
                </p>
                <p className="text-muted-foreground text-xs md:text-right">
                  Dashboard
                </p>
              </>
            }
          >
            <DashboardFooterFeedback />
            <DashboardFooterSection title="Support Hours">
              <p className="text-sidebar-foreground/80">
                Mon – Fri: 9:00 – 17:00
                <br />
                Sat – Sun: Closed
              </p>
            </DashboardFooterSection>
            <DashboardFooterSection title="Support">
              <p className="text-sidebar-foreground/80">
                help@example.com
                <br />
                +1 000 000 0000
              </p>
              <div className="mt-2 flex gap-2">
                <Link
                  href="#"
                  className="text-sidebar-primary hover:underline text-sm"
                >
                  Support Page →
                </Link>
              </div>
            </DashboardFooterSection>
            <DashboardFooterSection title="Language">
              <p className="text-sidebar-foreground/80 text-sm">
                English
              </p>
            </DashboardFooterSection>
          </DashboardFooter>
        </SidebarInset>
      </BranchProvider>
    </SidebarProvider>
  );
}
