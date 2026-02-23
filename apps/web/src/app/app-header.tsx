"use client";

import { createClient } from "@visyx/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/app/auth/_hooks/use-session";
import { Button } from "@visyx/ui/button";
import { cn } from "@visyx/ui/cn";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useSession();

  if (pathname.startsWith("/auth") || loading || !user) {
    return null;
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  }

  const displayName = user.user_metadata?.full_name ?? user.email ?? "User";

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      <span className="text-sm text-muted-foreground">
        Welcome, {displayName}
      </span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </header>
  );
}
