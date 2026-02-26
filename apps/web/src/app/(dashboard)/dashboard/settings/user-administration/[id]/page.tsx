"use client";

import { Avatar, AvatarFallback } from "@visyx/ui/avatar";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { Switch } from "@visyx/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { ArrowLeft, Key, Shield, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserAdministrationDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "0";
  const placeholderName = `User ${id}`;
  const placeholderEmail = `user${id}@example.com`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
          <Link href="/dashboard/settings/user-administration">
            <ArrowLeft className="mr-2 size-4" />
            Back to users
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="size-14 rounded-lg">
            <AvatarFallback className="rounded-lg text-lg">
              {placeholderName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {placeholderName}
            </h1>
            <p className="text-muted-foreground text-sm">{placeholderEmail}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto rounded-none">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <User className="mr-2 size-4" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Shield className="mr-2 size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="permissions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Key className="mr-2 size-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update name, contact, and role. Changes are saved when you click
                Save.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    defaultValue={placeholderName}
                    placeholder="Full name"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={placeholderEmail}
                    placeholder="Email"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone number"
                    className="h-9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="member">
                    <SelectTrigger id="role" className="h-9">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="active">
                  <SelectTrigger id="status" className="h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
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
                Not configured. The user can enable 2FA from their account
                settings.
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
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role & permissions</CardTitle>
              <CardDescription>
                Control what this user can access. Permissions are derived from
                the assigned role; override below if needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select defaultValue="member">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label>Permission overrides</Label>
                <div className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dashboard access</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">User management</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reports</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Settings</span>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
