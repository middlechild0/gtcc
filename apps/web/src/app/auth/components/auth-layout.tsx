"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@visyx/ui/card";
import { cn } from "@visyx/ui/cn";

type AuthLayoutProps = {
  title: string;
  subtitle?: ReactNode;
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
        "flex min-h-[100dvh] items-center justify-center px-4 py-12",
        "bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_40%)]",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-[400px]"
      >
      <Card className="w-full rounded-2xl border border-border/80 bg-card/95 shadow-lg shadow-black/5 backdrop-blur-sm">
        <CardHeader className="space-y-1.5 pb-6 pt-8 text-center sm:pt-10">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Batian Optical
          </p>
          <CardTitle className="font-serif text-2xl font-normal tracking-tight text-foreground">
            {title}
          </CardTitle>
          {subtitle ? (
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </CardDescription>
          ) : null}
        </CardHeader>

        <CardContent className="pb-6">{children}</CardContent>

        {footer ? (
          <CardFooter className="flex flex-col items-center gap-2 border-t border-border/60 py-4 text-center">
            {footer}
            <Link
              href="/"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to site
            </Link>
          </CardFooter>
        ) : (
          <CardFooter className="py-4">
            <Link
              href="/"
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to site
            </Link>
          </CardFooter>
        )}
      </Card>
      </motion.div>
    </section>
  );
}
