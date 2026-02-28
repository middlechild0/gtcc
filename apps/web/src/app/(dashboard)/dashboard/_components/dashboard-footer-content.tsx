"use client";

import {
  DashboardFooter,
  DashboardFooterFeedback,
  DashboardFooterSection,
} from "@visyx/ui/dashboard-footer";
import Link from "next/link";

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
    >
     
    </DashboardFooter>
  );
}
