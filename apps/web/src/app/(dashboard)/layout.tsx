"use client";

import { createClient } from "@visyx/supabase/client";
import { SettingsMenu } from "@visyx/ui/settings-menu";
import { SidebarInset, SidebarProvider } from "@visyx/ui/sidebar";
import { TopNav } from "@visyx/ui/top-nav";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/app/auth/_hooks/use-session";
import { DashboardBreadcrumb } from "./dashboard/_components/dashboard-breadcrumb";
import { DashboardFooterContent } from "./dashboard/_components/dashboard-footer-content";
import { DashboardSidebar } from "./dashboard/_components/dashboard-sidebar";
import { ZeroPermissionBanner } from "./dashboard/_components/zero-permission-banner";
import { useSettingsMenuItems } from "./dashboard/_hooks/use-settings-menu-items";
import { useQueueSubscription } from "./dashboard/_hooks/use-queue-subscription";
import { useBranch } from "./dashboard/branch-context";
import { searchableRoutes, sidebarRoutes } from "./dashboard/routes.config";

function BranchReadyGate({ children }: { children: ReactNode }) {
  const { isBranchReady } = useBranch();

  if (isBranchReady) {
    return <div className="min-h-0 flex-1 overflow-auto p-6">{children}</div>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <div className="space-y-4">
        <div className="h-5 w-40 rounded-md bg-muted" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-28 rounded-lg bg-muted" />
          <div className="h-28 rounded-lg bg-muted" />
        </div>
        <div className="h-48 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useSession();
  const settingsMenuItems = useSettingsMenuItems(searchableRoutes);

  useQueueSubscription();

  const displayName = user?.user_metadata?.full_name ?? "Account";
  const userEmail = user?.email ?? undefined;

  const handleAccountClick = () => {
    router.push("/dashboard/settings/account");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSidebar mainItems={sidebarRoutes} />
      <SidebarInset className="flex min-h-svh flex-col">
        <TopNav
          title={<DashboardBreadcrumb />}
          searchPlaceholder="Find Member"
          user={user ? { name: displayName, email: userEmail } : undefined}
          onAccountClick={handleAccountClick}
          onLogoutClick={handleLogout}
          actions={
            <SettingsMenu
              items={settingsMenuItems}
              searchPlaceholder="Search pages and settings"
            />
          }
          className="border-sidebar-border bg-sidebar text-sidebar-foreground"
        />
        <ZeroPermissionBanner />
        <BranchReadyGate>{children}</BranchReadyGate>
        <DashboardFooterContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
