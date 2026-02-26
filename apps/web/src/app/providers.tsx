"use client";

import { ThemeProvider } from "next-themes";
import { BranchProvider } from "@/app/(dashboard)/dashboard/branch-context";
import { AuthProvider } from "@/app/auth/_hooks/use-auth";
import { TRPCReactProvider } from "@/trpc/client";

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
