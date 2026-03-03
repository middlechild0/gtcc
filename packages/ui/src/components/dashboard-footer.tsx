"use client";

import * as React from "react";
import { cn } from "../utils";
import { Button } from "./button";
import { Input } from "./input";

export interface DashboardFooterProps extends React.ComponentProps<"footer"> {
  /** Optional class name for the footer wrapper */
  className?: string;
  /** Content for the bottom bar (copyright, language, etc.) */
  bottomBar?: React.ReactNode;
}

/**
 * Full-width dashboard footer with dark theme to match sidenav/topnav.
 * Use DashboardFooterSection for each column. Content is placeholder-ready for
 * feedback, support hours, support contact, and bottom copyright/language.
 */
const DashboardFooter = React.forwardRef<HTMLElement, DashboardFooterProps>(
  ({ className, children, bottomBar, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          "shrink-0 border-t border-sidebar-border bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {bottomBar != null && (
          <div className="border-t border-sidebar-border">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              {bottomBar}
            </div>
          </div>
        )}
      </footer>
    );
  },
);
DashboardFooter.displayName = "DashboardFooter";

const DashboardFooterSection = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { title?: React.ReactNode }
>(({ title, className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
    {title != null && (
      <h3 className="text-sidebar-foreground text-sm font-semibold">{title}</h3>
    )}
    <div className="text-muted-foreground text-sm">{children}</div>
  </div>
));
DashboardFooterSection.displayName = "DashboardFooterSection";

/**
 * Placeholder block for a feedback form (heading, input, send button).
 * Presentational only; wire onSubmit in the app.
 */
function DashboardFooterFeedback({
  title = "We would love your feedback",
  placeholder = "How are we doing?",
  sendLabel = "Send",
  className,
}: React.ComponentProps<"div"> & {
  title?: string;
  placeholder?: string;
  sendLabel?: string;
}) {
  return (
    <DashboardFooterSection title={title} className={className}>
      <Input
        type="text"
        placeholder={placeholder}
        className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60 h-9"
        readOnly
        aria-label={placeholder}
      />
      <Button
        size="sm"
        className="bg-accent text-accent-foreground hover:bg-accent/90 w-fit"
      >
        {sendLabel}
      </Button>
    </DashboardFooterSection>
  );
}

export { DashboardFooter, DashboardFooterSection, DashboardFooterFeedback };
