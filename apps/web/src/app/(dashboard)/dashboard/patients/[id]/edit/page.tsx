"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { useBranch } from "@/app/(dashboard)/dashboard/branch-context";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { PatientForm } from "../../_components/patient-form";
import { usePatientMutations } from "../../_hooks/use-patient-mutations";

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { update } = usePatientMutations();
  const { branches, activeBranchId } = useBranch();

  const { data: patient, isLoading } = trpc.patients.get.useQuery({ id });

  const handleSubmit = async (
    values: Omit<Parameters<typeof update.mutateAsync>[0], "id">,
  ) => {
    await update.mutateAsync({ ...values, id });
    router.push("/dashboard/patients");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="h-20 animate-pulse rounded-md bg-muted" />
        <div className="h-[400px] animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <h2 className="text-xl font-semibold">Patient not found</h2>
        <p className="mt-2 text-muted-foreground">
          The requested patient record could not be found.
        </p>
      </div>
    );
  }

  // Pre-fill the form matching the PatientForm defaultValues shape
  const defaultValues = {
    salutation: patient.salutation ?? "",
    firstName: patient.firstName ?? "",
    middleName: patient.middleName ?? "",
    lastName: patient.lastName ?? "",
    dateOfBirth: patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: patient.gender as any,
    maritalStatus: patient.maritalStatus as any,
    bloodGroup: patient.bloodGroup as any,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    country: patient.country ?? "Kenya",
    address: patient.address ?? "",
    passportNumber: patient.passportNumber ?? "",
    nationalId: patient.nationalId ?? "",
    nhifNumber: patient.nhifNumber ?? "",
    branchId: activeBranchId ?? branches[0]?.id ?? 0,
    kin:
      patient.kin?.map((k) => ({
        isPrimary: k.isPrimary ?? false,
        firstName: k.firstName ?? "",
        lastName: k.lastName ?? "",
        relationship: k.relationship ?? "",
        phone: k.phone ?? "",
        email: k.email ?? "",
        nationalId: k.nationalId ?? "",
      })) ?? [],
    guarantor:
      patient.guarantor?.map((g) => ({
        isPrimary: g.isPrimary ?? false,
        firstName: g.firstName ?? "",
        lastName: g.lastName ?? "",
        relationship: g.relationship ?? "",
        phone: g.phone ?? "",
        email: g.email ?? "",
        nationalId: g.nationalId ?? "",
        employer: g.employer ?? "",
      })) ?? [],
    insurance: patient.insurance
      ? {
          providerId: patient.insurance.providerId ?? 0,
          schemeId: patient.insurance.schemeId ?? 0,
          memberNumber: patient.insurance.memberNumber ?? "",
          preAuthNumber: patient.insurance.preAuthNumber ?? "",
          expiresAt: patient.insurance.expiresAt
            ? new Date(patient.insurance.expiresAt).toISOString().split("T")[0]
            : "",
        }
      : undefined,
  };

  return (
    <RouteGuard required="patients:edit">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Patient: {patient.patientNumber}
          </h1>
          <p className="text-muted-foreground">
            Update the patient's personal, contact, and insurance details.
          </p>
        </div>

        <PatientForm
          defaultValues={defaultValues}
          submitting={update.isPending}
          cancelHref="/dashboard/patients"
          onSubmit={handleSubmit}
        />
      </div>
    </RouteGuard>
  );
}
