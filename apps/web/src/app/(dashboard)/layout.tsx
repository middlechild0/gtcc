"use client";

import { useSession } from "@/app/auth/_hooks/use-session";
import { SidebarInset, SidebarProvider } from "@visyx/ui/sidebar";
import { SettingsMenu } from "@visyx/ui/settings-menu";
import { TopNav } from "@visyx/ui/top-nav";
import type { ReactNode } from "react";
import { BranchProvider } from "./dashboard/branch-context";
import { DashboardBreadcrumb } from "./dashboard/_components/dashboard-breadcrumb";
import { DashboardFooterContent } from "./dashboard/_components/dashboard-footer-content";
import { DashboardSidebar } from "./dashboard/_components/dashboard-sidebar";
import { useSettingsMenuItems } from "./dashboard/_hooks/use-settings-menu-items";
import {
  searchableRoutes,
  sidebarRoutes,
} from "./dashboard/routes.config";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const settingsMenuItems = useSettingsMenuItems(searchableRoutes);

  const displayName = user?.user_metadata?.full_name ?? "Account";
  const userEmail = user?.email ?? undefined;

  return (
    <SidebarProvider defaultOpen={true}>
      <BranchProvider>
        <DashboardSidebar mainItems={sidebarRoutes} />
        <SidebarInset className="flex min-h-svh flex-col">
          <TopNav
            title={<DashboardBreadcrumb />}
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
          <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
          <DashboardFooterContent />
        </SidebarInset>
      </BranchProvider>
    </SidebarProvider>
  );
}
