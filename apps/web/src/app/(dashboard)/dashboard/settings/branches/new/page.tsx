"use client";

import { useRouter } from "next/navigation";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { BranchForm } from "../_components/branch-form";
import { useBranchMutations } from "../_hooks/use-branch-mutations";

export default function NewBranchPage() {
  const router = useRouter();
  const { create } = useBranchMutations();

  const handleSubmit = async (values: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  }) => {
    const branch = await create.mutateAsync({
      name: values.name,
      address: values.address ?? undefined,
      phone: values.phone ?? undefined,
      email: values.email ?? undefined,
      code: values.name.substring(0, 3).toUpperCase(),
    });
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
