"use client";

import { Button } from "@visyx/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@visyx/ui/dialog";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { trpc } from "@/trpc/client";
import { useStaffMutations } from "../_hooks/use-staff-mutations";

type InviteStaffDialogProps = {
  onInvited?: () => void;
};

export function InviteStaffDialog(props: InviteStaffDialogProps) {
  const { onInvited } = props;
  const { isLoading: authLoading, hasPermission } = useAuth();

  const canViewBranches = !authLoading && hasPermission("branches:view");
  const canManagePermissionGroups =
    !authLoading && hasPermission("auth:manage_permission_groups");

  const { data: branches } = trpc.branches.list.useQuery(
    { includeInactive: false },
    { enabled: canViewBranches },
  );

  const { data: groups } = trpc.staff.listGroups.useQuery(
    { includeInactive: false },
    { enabled: canManagePermissionGroups },
  );

  const { invite } = useStaffMutations();

  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [primaryBranchId, setPrimaryBranchId] = useState<string>("none");
  const [startingPermissionGroupId, setStartingPermissionGroupId] =
    useState<string>("none");

  const branchOptions = useMemo(() => branches ?? [], [branches]);
  const groupOptions = useMemo(() => groups ?? [], [groups]);

  const reset = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setJobTitle("");
    setPrimaryBranchId("none");
    setStartingPermissionGroupId("none");
  };

  const canSubmit =
    email.trim().length > 0 &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    !invite.isPending;

  const handleSubmit = async () => {
    const branchId =
      primaryBranchId !== "none" ? Number(primaryBranchId) : undefined;
    const groupId =
      startingPermissionGroupId !== "none"
        ? Number(startingPermissionGroupId)
        : undefined;

    await invite.mutateAsync({
      email,
      firstName,
      lastName,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      primaryBranchId: Number.isFinite(branchId as number)
        ? branchId
        : undefined,
      startingPermissionGroupId: Number.isFinite(groupId as number)
        ? groupId
        : undefined,
    });

    reset();
    setOpen(false);
    onInvited?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 size-4" />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent className="p-6">
        <DialogHeader>
          <DialogTitle>Invite a new user</DialogTitle>
          <DialogDescription>
            This sends an email invite via Supabase and creates the staff
            profile in Visyx.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
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
              <Label htmlFor="invite-jobTitle">Job title (optional)</Label>
              <Input
                id="invite-jobTitle"
                placeholder="e.g. Optometrist"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {canViewBranches ? (
            <div className="space-y-2">
              <Label>Primary branch (optional)</Label>
              <Select
                value={primaryBranchId}
                onValueChange={setPrimaryBranchId}
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
            </div>
          ) : null}

          {canManagePermissionGroups ? (
            <div className="space-y-2">
              <Label>Starting permission group (optional)</Label>
              <Select
                value={startingPermissionGroupId}
                onValueChange={setStartingPermissionGroupId}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {groupOptions.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => setOpen(false)}
            disabled={invite.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {invite.isPending ? "Inviting..." : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
