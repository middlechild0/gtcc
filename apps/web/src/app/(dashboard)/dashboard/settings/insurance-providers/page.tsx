"use client";

import { useHasPermission } from "@/app/auth/components/permission-gate";
import { DashboardHeader } from "../_components/dashboard-header";
import { ForbiddenBanner } from "../_components/forbidden-banner";
import { InsuranceProvidersTable } from "./_components/insurance-providers-table";

export default function InsuranceProvidersPage() {
  const { allowed } = useHasPermission("billing:manage_insurance_providers");

  if (!allowed) {
    return <ForbiddenBanner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Insurance Providers"
        description="Manage the list of accepted insurance providers for all branches."
      />

      <div className="w-full">
        <InsuranceProvidersTable />
      </div>
    </div>
  );
}
