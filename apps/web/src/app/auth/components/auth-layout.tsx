"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@visyx/ui/card";
import { cn } from "@visyx/ui/cn";
import { Button } from "@visyx/ui/button";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthLayoutProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[calc(100vh-6rem)] items-center justify-center py-10",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_hsl(var(--accent))_0%,_transparent_55%),radial-gradient(circle_at_bottom,_hsl(var(--primary))_0%,_transparent_60%)] opacity-[0.08]"
      />

      <Card className="relative w-full max-w-md overflow-hidden rounded-xl shadow-sm">
        <CardHeader className="border-b bg-card/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              Batian Optical System
            </span>
            <Button asChild variant="link" className="h-auto p-0 text-xs">
              <Link href="/">Back to site</Link>
            </Button>
          </div>
          <CardTitle className="mt-4">{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </CardHeader>

        <CardContent className="space-y-6">{children}</CardContent>

        {footer ? (
          <CardFooter className="justify-between">{footer}</CardFooter>
        ) : null}
      </Card>
    </section>
  );
}

