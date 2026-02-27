"use client";

import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { useStaffMutations } from "../_hooks/use-staff-mutations";

export default function InviteStaffPage() {
  const router = useRouter();
  const { invite } = useStaffMutations();

  const { data: branches } = trpc.branches.list.useQuery({
    includeInactive: false,
  });
  const { data: groups } = trpc.staff.listGroups.useQuery({
    includeInactive: false,
  });

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("");
  const [startingPermissionGroupId, setStartingPermissionGroupId] =
    useState<string>("");

  const branchOptions = branches ?? [];
  const groupOptions = groups ?? [];

  const hasBranches = branchOptions.length > 0;
  const hasGroups = groupOptions.length > 0;
  const canProceed = hasBranches && hasGroups;

  const canSubmit =
    email.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    primaryBranchId.length > 0 &&
    Number.isFinite(Number(primaryBranchId)) &&
    startingPermissionGroupId.length > 0 &&
    Number.isFinite(Number(startingPermissionGroupId)) &&
    !invite.isPending &&
    canProceed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const branchId = Number(primaryBranchId);
    const groupId = Number(startingPermissionGroupId);

    await invite.mutateAsync({
      email,
      firstName,
      lastName,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      primaryBranchId: branchId,
      startingPermissionGroupId: groupId,
    });

    router.push("/dashboard/settings/user-administration");
  };

  return (
    <RouteGuard required="auth:manage_staff">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" className="w-fit -ml-2" asChild>
            <Link href="/dashboard/settings/user-administration">
              <ArrowLeft className="mr-2 size-4" />
              Back to users
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Invite a new user
            </h1>
            <p className="text-muted-foreground">
              Invite a new user to the system. They will receive an email invite to set their password.
            </p>
          </div>
        </div>

        {!canProceed ? (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="pt-6">
              <p className="text-sm">
                {!hasBranches && !hasGroups
                  ? "Create at least one branch and one permission group before inviting users."
                  : !hasBranches
                    ? "Create at least one branch before inviting users."
                    : "Create at least one permission group before inviting users."}
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/dashboard/settings/user-administration">
                  Back to users
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">User details</CardTitle>
                <CardDescription>
                  Enter the user&apos;s information. They will receive an email
                  invite to set their password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-firstName">First name</Label>
                    <Input
                      id="invite-firstName"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-lastName">Last name</Label>
                    <Input
                      id="invite-lastName"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-9"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-phone">Phone (optional)</Label>
                    <Input
                      id="invite-phone"
                      placeholder="+254..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-jobTitle">
                      Job title (optional)
                    </Label>
                    <Input
                      id="invite-jobTitle"
                      placeholder="e.g. Optometrist"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-primaryBranch">
                    Primary branch <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={primaryBranchId}
                    onValueChange={setPrimaryBranchId}
                    required
                  >
                    <SelectTrigger id="invite-primaryBranch" className="h-9">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    The branch where this user will primarily work.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-group">
                    Starting permission group{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={startingPermissionGroupId}
                    onValueChange={setStartingPermissionGroupId}
                    required
                  >
                    <SelectTrigger id="invite-group" className="h-9">
                      <SelectValue placeholder="Select permission group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Permissions copied to the user on creation. Can be adjusted
                    later.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 border-t pt-6">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/settings/user-administration">
                    Cancel
                  </Link>
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {invite.isPending ? "Inviting..." : "Send invite"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </RouteGuard>
  );
}
