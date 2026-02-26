"use client";

import { useRouter } from "next/navigation";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { BranchForm } from "../_components/branch-form";
import { useBranchMutations } from "../_hooks/use-branch-mutations";

export default function NewBranchPage() {
  const router = useRouter();
  const { create } = useBranchMutations();

  const handleSubmit = async (
    values: Parameters<typeof create.mutateAsync>[0],
  ) => {
    const branch = await create.mutateAsync(values);
    router.push(`/dashboard/settings/branches/${branch?.id}`);
  };

  return (
    <RouteGuard required="branches:manage">
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
    </RouteGuard>
  );
}
