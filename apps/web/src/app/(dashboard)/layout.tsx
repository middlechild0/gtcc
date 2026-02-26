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
import { SettingsMenu } from "@visyx/ui/settings-menu";
import { TopNav } from "@visyx/ui/top-nav";
import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? "User";
  const userEmail = user?.email ?? undefined;

  const navTitle =
    pathname?.includes("user-administration") ? "User Administration" : "Dashboard";

  return (
    <SidebarProvider defaultOpen={true}>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/dashboard/settings">
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="text-muted-foreground px-2 py-1 text-xs">
            Visyx Dashboard
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
          actions={<SettingsMenu />}
          className="border-sidebar-border bg-sidebar text-sidebar-foreground"
        />
        <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>
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
    </SidebarProvider>
  );
}
