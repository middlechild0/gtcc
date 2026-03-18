"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@visyx/supabase/client";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type MyAccountSessionsSectionProps = {
  user: User | null;
  loading: boolean;
  lastSignInAt: string | null;
};

export function MyAccountSessionsSection({
  user,
  loading,
  lastSignInAt,
}: MyAccountSessionsSectionProps) {
  const [userAgent, setUserAgent] = useState<string | null>(null);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserAgent(window.navigator.userAgent);
    }
  }, []);

  const email = user?.email ?? "Unknown";
  const lastSignInLabel =
    lastSignInAt != null
      ? new Date(lastSignInAt).toISOString().slice(0, 16).replace("T", " ")
      : "Unknown";

  async function handleSignOutOtherSessions() {
    try {
      setSigningOutOthers(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) {
        throw error;
      }
      toast.success("Signed out from your other devices.");
    } catch (err: any) {
      toast.error(
        err?.message ?? "Failed to sign out from your other sessions.",
      );
    } finally {
      setSigningOutOthers(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current session</CardTitle>
          <CardDescription>
            Details of the browser you&apos;re currently signed in with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading session…</p>
          ) : (
            <>
              <p className="text-sm">
                Signed in as <span className="font-medium">{email}</span>
              </p>
              <p className="text-muted-foreground text-xs">
                Device: {userAgent ?? "Detecting device…"}
              </p>
              <p className="text-muted-foreground text-xs">
                Last sign-in: {lastSignInLabel}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Review other devices that are signed in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            You&apos;re currently signed in on this browser. If you&apos;re
            concerned about security, you can sign out of all your other devices
            while keeping this session active.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !user || !user.email || signingOutOthers}
            onClick={() => {
              void handleSignOutOtherSessions();
            }}
          >
            {signingOutOthers
              ? "Signing out of other sessions..."
              : "Sign out of all other sessions"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
