import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@visyx/ui/card";
import Link from "next/link";
import { Button } from "@visyx/ui/button";
import { PermissionGate } from "@/app/auth/components/permission-gate";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Application settings. Logic will be added later.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Placeholder for settings options</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Content coming soon.</p>
          </CardContent>
        </Card>
        <PermissionGate required="branches:view">
          <Card>
            <CardHeader>
              <CardTitle>Branches</CardTitle>
              <CardDescription>
                Manage clinic locations, contact details, and availability.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                View and update your organisation&apos;s branches.
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/settings/branches">Open</Link>
              </Button>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>
    </div>
  );
}
