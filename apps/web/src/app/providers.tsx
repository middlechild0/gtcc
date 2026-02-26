"use client";

import { AuthProvider } from "@/app/auth/_hooks/use-auth";
import { TRPCReactProvider } from "@/trpc/client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </TRPCReactProvider>
  );
}
