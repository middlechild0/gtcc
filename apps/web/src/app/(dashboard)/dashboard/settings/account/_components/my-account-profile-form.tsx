"use client";

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
import { useEffect, useState } from "react";
import type { AuthContextValue } from "@/app/auth/_hooks/use-auth";

type MyAccountProfileFormProps = {
  profile: AuthContextValue["profile"];
  staff: AuthContextValue["staff"];
  email: string | null;
  branchOptions: { id: number; name: string }[];
  canEdit: boolean;
  canViewBranches: boolean;
  saving: boolean;
  onSave: (values: {
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    primaryBranchId: number | null;
  }) => Promise<void>;
};

export function MyAccountProfileForm({
  profile,
  staff,
  email,
  branchOptions,
  canEdit,
  canViewBranches,
  saving,
  onSave,
}: MyAccountProfileFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("none");

  useEffect(() => {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setPhone(profile?.phone ?? "");
    setJobTitle(staff?.jobTitle ?? "");
    setPrimaryBranchId(
      staff?.primaryBranchId != null ? String(staff.primaryBranchId) : "none",
    );
  }, [profile, staff]);

  const handleSave = () => {
    const branch =
      primaryBranchId === "none" ? null : Number.parseInt(primaryBranchId, 10);
    void onSave({
      firstName,
      lastName,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      primaryBranchId: Number.isFinite(branch as number) ? branch : null,
    });
  };

  const disabled = !canEdit || saving;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal details. Email is managed by Supabase and may be
          read-only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="h-9"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="h-9"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email ?? ""}
              className="h-9"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Phone number"
              className="h-9"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              placeholder="e.g. Optometrist"
              className="h-9"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {canViewBranches && branchOptions.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="primaryBranch">Primary branch</Label>
            <select
              id="primaryBranch"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              value={primaryBranchId}
              onChange={(e) => setPrimaryBranchId(e.target.value)}
              disabled={disabled}
            >
              <option value="none">None</option>
              {branchOptions.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="space-y-3">
          <Button
            type="button"
            disabled={
              disabled ||
              firstName.trim().length === 0 ||
              lastName.trim().length === 0
            }
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {!canEdit ? (
            <p className="text-muted-foreground text-xs">
              Profile editing isn&apos;t available for your account yet. Contact
              an administrator if you need to update these details.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
