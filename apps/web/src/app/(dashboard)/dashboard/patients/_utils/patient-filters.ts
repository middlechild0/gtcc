"use client";

import type { Patient } from "./patient-types";

export function filterPatients(
  patients: Patient[],
  rawSearch: string,
): Patient[] {
  const term = rawSearch.trim().toLowerCase();
  if (!term) return patients;

  return patients.filter((p) => {
    const firstName = p.firstName?.toLowerCase() ?? "";
    const lastName = p.lastName?.toLowerCase() ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    const patientNumber = p.patientNumber?.toLowerCase() ?? "";
    return (
      firstName.includes(term) ||
      lastName.includes(term) ||
      fullName.includes(term) ||
      patientNumber.includes(term)
    );
  });
}
