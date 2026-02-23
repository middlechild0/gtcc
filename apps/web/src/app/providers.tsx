"use client";

import { TRPCReactProvider } from "@/trpc/client";
import { ThemeProvider as NextThemesProvider, ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </TRPCReactProvider>
  );
}


