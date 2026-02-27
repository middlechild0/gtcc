"use client";

import { Skeleton } from "@visyx/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { MonitorSmartphone, Shield, User as UserIcon } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { useSession } from "@/app/auth/_hooks/use-session";
import { trpc } from "@/trpc/client";
import { MyAccountProfileForm } from "./_components/my-account-profile-form";
import { MyAccountSecuritySection } from "./_components/my-account-security-section";
import { MyAccountSessionsSection } from "./_components/my-account-sessions-section";

export default function MyAccountPage() {
  const { profile, staff, isLoading: authLoading, hasPermission, isSuperuser, refetch } =
    useAuth();
  const { user, loading: sessionLoading } = useSession();

  const canManageOwnStaffProfile =
    hasPermission("auth:manage_staff") && Boolean(staff?.id);

  const canViewBranches = hasPermission("branches:view");
  const { data: branches } = trpc.branches.list.useQuery(
    { includeInactive: false },
    { enabled: canViewBranches },
  );
  const branchOptions = useMemo(() => branches ?? [], [branches]);

  const updateStaff = trpc.staff.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  if ((authLoading && !profile && !staff) || (sessionLoading && !user)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="h-64 rounded-md bg-muted" />
      </div>
    );
  }

  const email = user?.email ?? null;
  const lastSignInAt = user?.last_sign_in_at ?? null;

  const handleSaveProfile = async (values: {
    firstName: string;
    lastName: string;
    phone?: string;
    jobTitle?: string;
    primaryBranchId: number | null;
  }) => {
    if (!staff?.id || !canManageOwnStaffProfile) return;

    await updateStaff.mutateAsync({
      id: staff.id,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      jobTitle: values.jobTitle,
      primaryBranchId: values.primaryBranchId,
      ...(isSuperuser ? { isAdmin: staff.isAdmin } : {}),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal profile, security, and sessions.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="h-auto w-full justify-start border-b bg-transparent p-0">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <UserIcon className="mr-2 size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Shield className="mr-2 size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <MonitorSmartphone className="mr-2 size-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <MyAccountProfileForm
            profile={profile}
            staff={staff}
            email={email}
            branchOptions={branchOptions}
            canEdit={canManageOwnStaffProfile}
            canViewBranches={canViewBranches}
            saving={updateStaff.isPending}
            onSave={handleSaveProfile}
          />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <MyAccountSecuritySection email={email} />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <MyAccountSessionsSection
            user={user}
            loading={sessionLoading}
            lastSignInAt={lastSignInAt}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

