import "@/styles/globals.css";
import { cn } from "@visyx/ui/cn";
import "@visyx/ui/globals.css";
import { Hedvig_Letters_Sans, Hedvig_Letters_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppHeader } from "./app-header";
import { Providers } from "./providers";


const hedvigSans = Hedvig_Letters_Sans({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-sans",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "arial"],
});

const hedvigSerif = Hedvig_Letters_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "optional",
  variable: "--font-hedvig-serif",
  preload: true,
  adjustFontFallback: true,
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)" },
    { media: "(prefers-color-scheme: dark)" },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.visyx.co.ke" />
        <link rel="dns-prefetch" href="https://cdn.visyx.co.ke" />
      </head>
      <body
        className={cn(
          `${hedvigSans.variable} ${hedvigSerif.variable} font-sans`,
          "bg-background overflow-x-hidden font-sans antialiased",
        )}
      >
        <NuqsAdapter>
            <Providers>
              <AppHeader />
              {children}
              <Toaster />
            </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
