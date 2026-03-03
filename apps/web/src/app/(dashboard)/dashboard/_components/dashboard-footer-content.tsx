"use client";

import { DashboardFooter } from "@visyx/ui/dashboard-footer";

export function DashboardFooterContent() {
  return (
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
    ></DashboardFooter>
  );
}
