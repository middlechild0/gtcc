"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useBranch } from "@/app/(dashboard)/dashboard/branch-context";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { PatientForm } from "../_components/patient-form";
import { usePatientMutations } from "../_hooks/use-patient-mutations";

export default function NewPatientPage() {
  const router = useRouter();
  const { create } = usePatientMutations();
  const { branches, activeBranchId } = useBranch();

  const initialBranchId = useMemo(
    () => activeBranchId ?? branches[0]?.id ?? 0,
    [activeBranchId, branches],
  );

  const handleSubmit = async (
    values: Parameters<typeof create.mutateAsync>[0],
  ) => {
    await create.mutateAsync(values);
    router.push("/dashboard/patients");
  };

  return (
    <RouteGuard required="patients:create">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Register new patient
          </h1>
          <p className="text-muted-foreground">
            Capture full patient details and branch context in a fast,
            receptionist-friendly flow.
          </p>
        </div>

        <PatientForm
          defaultValues={{
            salutation: "",
            firstName: "",
            middleName: "",
            lastName: "",
            dateOfBirth: "",
            gender: undefined,
            maritalStatus: undefined,
            bloodGroup: undefined,
            email: "",
            phone: "",
            country: "Kenya",
            address: "",
            passportNumber: "",
            nationalId: "",
            nhifNumber: "",
            branchId: initialBranchId,
            kin: [],
            guarantor: [],
            insurance: undefined,
          }}
          submitting={create.isPending}
          cancelHref="/dashboard/patients"
          onSubmit={handleSubmit}
        />
      </div>
    </RouteGuard>
  );
}
