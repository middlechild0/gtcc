"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@visyx/ui/alert-dialog";
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
import { useEffect, useState } from "react";
import type { StaffDetail } from "../_utils/staff-types";

type StaffProfileFormProps = {
  staff: StaffDetail;
  branchOptions: { id: number; name: string }[];
  canManage: boolean;
  canViewBranches: boolean;
  isSuperuser: boolean;
  isSelf: boolean;
  onSave: (values: {
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    primaryBranchId: number | null;
    isAdmin?: boolean;
  }) => Promise<void>;
  onDeactivate: () => void;
  onReactivate: () => void;
  saving: boolean;
  deactivating: boolean;
  reactivating: boolean;
};

export function StaffProfileForm({
  staff,
  branchOptions,
  canManage,
  canViewBranches,
  isSuperuser,
  isSelf,
  onSave,
  onDeactivate,
  onReactivate,
  saving,
  deactivating,
  reactivating,
}: StaffProfileFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("none");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setFirstName(staff.firstName ?? "");
    setLastName(staff.lastName ?? "");
    setPhone(staff.phone ?? "");
    setJobTitle(staff.jobTitle ?? "");
    setPrimaryBranchId(
      staff.primaryBranchId != null ? String(staff.primaryBranchId) : "none",
    );
    setIsAdmin(Boolean(staff.isAdmin));
  }, [staff]);

  const handleSave = () => {
    const branch = primaryBranchId === "none" ? null : Number(primaryBranchId);
    void onSave({
      firstName,
      lastName,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      primaryBranchId: Number.isFinite(branch as number) ? branch : null,
      ...(isSuperuser ? { isAdmin } : {}),
    });
  };

  const savingProfile = saving || deactivating || reactivating;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update staff profile fields. Email is managed by Supabase and is
          read-only here.
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
              disabled={!canManage || savingProfile}
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
              disabled={!canManage || savingProfile}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={staff.email ?? ""}
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
              disabled={!canManage || savingProfile}
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
              disabled={!canManage || savingProfile}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {canViewBranches ? (
            <div className="space-y-2">
              <Label>Primary branch</Label>
              <Select
                value={primaryBranchId}
                onValueChange={setPrimaryBranchId}
                disabled={!canManage || savingProfile}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {branchOptions.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs mt-1">
                Setting a primary branch does not remove access to other
                branches. You can manage access in the Permissions tab.
              </p>
            </div>
          ) : null}

          {isSuperuser ? (
            <div className="space-y-2">
              <Label>Staff admin</Label>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Admin access</div>
                  <p className="text-muted-foreground text-xs">
                    Admins bypass explicit permission checks.
                  </p>
                </div>
                <Switch
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
                  disabled={!canManage || savingProfile || isSelf}
                />
              </div>
              {isSelf ? (
                <p className="text-muted-foreground text-xs">
                  You can&apos;t change your own admin status.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={
              !canManage ||
              savingProfile ||
              firstName.trim().length === 0 ||
              lastName.trim().length === 0
            }
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>

          {canManage ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant={staff.isActive ? "destructive" : "default"}
                  disabled={savingProfile || isSelf}
                >
                  {staff.isActive ? "Deactivate user" : "Reactivate user"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {staff.isActive
                      ? "Deactivate this user?"
                      : "Reactivate this user?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {staff.isActive
                      ? "This will disable their login and mark them inactive. You can reactivate them later."
                      : "This will re-enable their login and mark them active again."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={savingProfile}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className={
                      staff.isActive
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : undefined
                    }
                    disabled={savingProfile}
                    onClick={() => {
                      if (staff.isActive) onDeactivate();
                      else onReactivate();
                    }}
                  >
                    {staff.isActive
                      ? deactivating
                        ? "Deactivating..."
                        : "Deactivate"
                      : reactivating
                        ? "Reactivating..."
                        : "Reactivate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
