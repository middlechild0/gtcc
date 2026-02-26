import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@visyx/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Application settings. Logic will be added later.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Placeholder for settings options</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Content coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
