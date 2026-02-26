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
        <p className="text-sidebar-foreground/80 text-sm">English</p>
      </DashboardFooterSection>
    </DashboardFooter>
  );
}
