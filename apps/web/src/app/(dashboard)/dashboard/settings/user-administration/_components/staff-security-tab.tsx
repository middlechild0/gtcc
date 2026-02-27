"use client";

import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";

export function StaffSecurityTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change the user&apos;s password or send a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Button variant="outline">Change password</Button>
          <Button variant="outline">Send reset link</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security with 2FA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Not configured. The user can enable 2FA from their account settings.
          </p>
          <Button variant="outline" className="mt-4">
            Enable 2FA
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            View and revoke active sessions for this user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No active sessions to display. Logic will be integrated later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
