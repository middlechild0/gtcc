"use client";

import { useRouter } from "next/navigation";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { PatientForm } from "../_components/patient-form";
import { usePatientMutations } from "../_hooks/use-patient-mutations";

export default function NewPatientPage() {
  const router = useRouter();
  const { create } = usePatientMutations();

  const handleSubmit = async (
    values: Parameters<typeof create.mutateAsync>[0],
  ) => {
    await create.mutateAsync(values);
    router.push("/dashboard/patients");
  };

  return (
    <RouteGuard required="patients:create">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Register new patient
          </h1>
          <p className="text-muted-foreground">
            Capture basic patient details to create a record.
          </p>
        </div>

        <PatientForm
          defaultValues={{
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          }}
          submitting={create.isPending}
          cancelHref="/dashboard/patients"
          onSubmit={handleSubmit}
        />
      </div>
    </RouteGuard>
  );
}

