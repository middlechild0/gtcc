"use client";

export type Patient = {
  id: string;
  patientNumber: string | null;
  salutation: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | Date | null;
  gender: string | null;
  maritalStatus: string | null;
  bloodGroup: string | null;
  email: string | null;
  phone: string | null;
  country: string;
  address: string | null;
  passportNumber: string | null;
  nationalId: string | null;
  nhifNumber: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  isActive: boolean; // Mapped dynamically via BranchProfile
};
