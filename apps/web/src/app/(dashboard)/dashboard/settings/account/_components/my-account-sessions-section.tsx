"use client";

import type { User } from "@supabase/supabase-js";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { useEffect, useState } from "react";

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
            We&apos;ll soon show a list of all devices that are logged in to
            your account so you can sign them out remotely.
          </p>
          <Button type="button" variant="outline" disabled>
            Sign out of all other sessions (coming soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

