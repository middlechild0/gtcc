"use client";

import { AuthProvider } from "@/app/auth/_hooks/use-auth";
import { TRPCReactProvider } from "@/trpc/client";
import { ThemeProvider } from "next-themes";
import { BranchProvider } from "@/app/(dashboard)/dashboard/branch-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <BranchProvider>{children}</BranchProvider>
        </AuthProvider>
      </ThemeProvider>
    </TRPCReactProvider>
  );
}
