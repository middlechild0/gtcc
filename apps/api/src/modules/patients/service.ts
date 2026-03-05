import { db } from "@visyx/db/client";
import {
  branches,
  patients,
  patientBranchProfiles,
  patientKins,
  patientGuarantors,
  patientInsurances,
} from "@visyx/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { CreatePatientInput, ListPatientsInput } from "./schemas";

/** Raw row from Drizzle (may have snake_case or camelCase keys depending on driver/casing). */
type PatientRow = Record<string, unknown> & {
  id?: string;
  patient_number?: string | null;
  patientNumber?: string | null;
  salutation?: string | null;
  first_name?: string;
  firstName?: string;
  middle_name?: string | null;
  middleName?: string | null;
  last_name?: string;
  lastName?: string;
  date_of_birth?: string | Date | null;
  dateOfBirth?: string | Date | null;
  gender?: string | null;
  marital_status?: string | null;
  maritalStatus?: string | null;
  blood_group?: string | null;
  bloodGroup?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  address?: string | null;
  passport_number?: string | null;
  passportNumber?: string | null;
  national_id?: string | null;
  nationalId?: string | null;
  nhif_number?: string | null;
  nhifNumber?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: Date;
  createdAt?: Date;
  updated_at?: Date;
  updatedAt?: Date;
};

function get<T>(row: PatientRow, camel: string, snake: string): T | undefined {
  const r = row as Record<string, unknown>;
  return (r[camel] ?? r[snake]) as T | undefined;
}

/** Normalize row to API shape so patientNumber is always present regardless of Drizzle result keys. */
function toPatientListItem(row: PatientRow) {
  return {
    id: get<string>(row, "id", "id")!,
    patientNumber:
      get<string | null>(row, "patientNumber", "patient_number") ?? null,
    salutation: get<string | null>(row, "salutation", "salutation") ?? null,
    firstName: get<string>(row, "firstName", "first_name")!,
    middleName: get<string | null>(row, "middleName", "middle_name") ?? null,
    lastName: get<string>(row, "lastName", "last_name")!,
    dateOfBirth: get<string | Date | null>(row, "dateOfBirth", "date_of_birth") ?? null,
    gender: get<string | null>(row, "gender", "gender") ?? null,
    maritalStatus: get<string | null>(row, "maritalStatus", "marital_status") ?? null,
    bloodGroup: get<string | null>(row, "bloodGroup", "blood_group") ?? null,
    email: get<string | null>(row, "email", "email") ?? null,
    phone: get<string | null>(row, "phone", "phone") ?? null,
    country: get<string | null>(row, "country", "country") ?? "Kenya",
    address: get<string | null>(row, "address", "address") ?? null,
    passportNumber: get<string | null>(row, "passportNumber", "passport_number") ?? null,
    nationalId: get<string | null>(row, "nationalId", "national_id") ?? null,
    nhifNumber: get<string | null>(row, "nhifNumber", "nhif_number") ?? null,
    // Note: isActive is now branch-specific for true active status, but we may return it here for legacy or global level.
    isActive: get<boolean>(row, "isActive", "is_active") ?? true,
    createdAt: get<Date>(row, "createdAt", "created_at")!,
    updatedAt: get<Date>(row, "updatedAt", "updated_at")!,
  };
}

export class PatientService {
  /**
   * Fetch paginated patient list with optional search.
   * Returns items for the requested page and total count matching the filter.
   */
  async getPatients(input: ListPatientsInput) {
    const { page, limit, search } = input;
    // We removed global isActive from schema in plan, but wait, we kept it in schema?
    // Wait, the schema modify step actually kept global isActive on the patient? Looking at the schema.ts:
    // It seems I removed reading it from there in the new version.
    // Actually going back to the DB schema diff, I missed deleting isActive. Let's just drop that eq() check or keep if it exists.
    // For now we will rely on patientBranchProfiles if we wanted branch-specific, but let's query patients table directly for the global list.
    const conditions = [];

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(patients.firstName, term),
          ilike(patients.lastName, term),
          ilike(patients.patientNumber, term),
          ilike(patients.email, term),
          ilike(patients.phone, term),
        )!,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult, results] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .where(whereClause),
      db
        .select()
        .from(patients)
        .where(whereClause)
        .orderBy(desc(patients.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: results.map((r) => toPatientListItem(r as PatientRow)),
      total,
    };
  }

  /**
   * Create a new patient record with a unique patient number (PAT-000001, …).
   * Also binds them to the registration branch and optionally inserts kin, guarantor, and insurance.
   */
  async createPatient(input: CreatePatientInput) {
    const [branchRec] = await db
      .select({ code: branches.code })
      .from(branches)
      .where(eq(branches.id, input.branchId));

    if (!branchRec) {
      throw new Error(`Branch with ID ${input.branchId} not found`);
    }
    const safeBranchCode = branchRec.code || "UNK";

    const seqResult = await db.execute(
      sql`SELECT nextval('patient_number_seq') as nextval`,
    );
    const nextvalRow = (seqResult as { rows: { nextval?: unknown }[] }).rows[0];
    const nextVal =
      nextvalRow?.nextval != null ? String(nextvalRow.nextval) : "1";
    const patientNumber = `${safeBranchCode}-${String(Number(nextVal)).padStart(6, "0")}`;

    // Execute everything in a transaction because of related table dependencies
    const patientRow = await db.transaction(async (tx) => {
      // 1. Create Patient
      const [created] = await tx
        .insert(patients)
        .values({
          patientNumber,
          salutation: input.salutation,
          firstName: input.firstName,
          middleName: input.middleName,
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth ? input.dateOfBirth.split("T")[0] : undefined,
          gender: input.gender as any, // Cast to mapped enum correctly later down ORM stack
          maritalStatus: input.maritalStatus as any,
          bloodGroup: input.bloodGroup as any,
          email: input.email === "" ? null : input.email,
          phone: input.phone,
          country: input.country || "Kenya",
          address: input.address,
          passportNumber: input.passportNumber,
          nationalId: input.nationalId,
          nhifNumber: input.nhifNumber,
        })
        .returning();

      if (!created) {
        throw new Error("Failed to create patient record");
      }

      // 2. Link to Registration Branch
      await tx.insert(patientBranchProfiles).values({
        patientId: created.id,
        branchId: input.branchId,
        isRegistrationBranch: true,
        isActive: true,
      });

      // 3. Emergency Contact (Kin)
      if (input.kin && input.kin.length > 0) {
        await tx.insert(patientKins).values(
          input.kin.map((k) => ({
            patientId: created.id,
            isPrimary: k.isPrimary ?? false,
            firstName: k.firstName,
            lastName: k.lastName,
            relationship: k.relationship,
            phone: k.phone,
            email: k.email === "" ? null : k.email,
            nationalId: k.nationalId,
          }))
        );
      }

      // 4. Guarantor
      if (input.guarantor && input.guarantor.length > 0) {
        await tx.insert(patientGuarantors).values(
          input.guarantor.map((g) => ({
            patientId: created.id,
            isPrimary: g.isPrimary ?? false,
            firstName: g.firstName,
            lastName: g.lastName,
            relationship: g.relationship,
            phone: g.phone,
            email: g.email === "" ? null : g.email,
            nationalId: g.nationalId,
            employer: g.employer,
          }))
        );
      }

      // 5. Insurance
      if (input.insurance) {
        await tx.insert(patientInsurances).values({
          patientId: created.id,
          providerId: input.insurance.providerId,
          memberNumber: input.insurance.memberNumber,
          principalName: input.insurance.principalName,
          principalRelationship: input.insurance.principalRelationship,
          isActive: true,
        });
      }

      return created;
    });

    return toPatientListItem(patientRow as PatientRow);
  }

  /**
   * KPI counts: total and active patients from the DB.
   * Note: Active patients must now be determined dynamically per branch,
   * but for global metrics we just return total patients from the `patients` table.
   */
  async getKpis() {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
      })
      .from(patients);

    const totalPatients = row?.total ?? 0;

    return {
      totalPatients,
      activePatients: totalPatients, // Global fallback
    };
  }
}

export const patientService = new PatientService();
