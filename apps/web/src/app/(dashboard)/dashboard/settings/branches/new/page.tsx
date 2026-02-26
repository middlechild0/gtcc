"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import { NoPermission } from "@/app/auth/components/no-permission";
import { useBranchMutations } from "../_hooks/use-branch-mutations";
import { BranchForm } from "../_components/branch-form";

export default function NewBranchPage() {
  const router = useRouter();
  const { isLoading: authLoading, hasPermission } = useAuth();
  const { create } = useBranchMutations();

  const canManage = !authLoading && hasPermission("branches:manage");

  if (!authLoading && !canManage) {
    return (
      <NoPermission
        title="You don't have permission to manage branches"
        description="Only users with branch management permissions can create new branches."
      />
    );
  }

  const handleSubmit = async (values: Parameters<typeof create.mutateAsync>[0]) => {
    const branch = await create.mutateAsync(values);
    router.push(`/dashboard/settings/branches/${branch?.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create new branch
        </h1>
        <p className="text-muted-foreground">
          Add a new clinic location and its contact details.
        </p>
      </div>

      <BranchForm
        mode="create"
        defaultValues={{
          name: "",
          address: "",
          phone: "",
          email: "",
        }}
        readOnly={false}
        submitting={create.isPending}
        cancelHref="/dashboard/settings/branches"
        onSubmit={handleSubmit}
      />
    </div>
  );
}

