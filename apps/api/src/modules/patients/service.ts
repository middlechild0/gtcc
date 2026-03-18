import { db } from "@visyx/db/client";
import {
  branches,
  patientBranchProfiles,
  patientGuarantors,
  patientInsurances,
  patientKins,
  patients,
} from "@visyx/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type {
  CreatePatientInput,
  DeactivatePatientInput,
  ListPatientsInput,
  UpdatePatientInput,
} from "./schemas";

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
  age?: number | null;
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

function normalizeOptionalString(
  value?: string | null,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toPatientListItem(row: PatientRow) {
  return {
    id: get<string>(row, "id", "id")!,
    patientNumber:
      get<string | null>(row, "patientNumber", "patient_number") ?? null,
    salutation: get<string | null>(row, "salutation", "salutation") ?? null,
    firstName: get<string>(row, "firstName", "first_name")!,
    middleName: get<string | null>(row, "middleName", "middle_name") ?? null,
    lastName: get<string>(row, "lastName", "last_name")!,
    dateOfBirth:
      get<string | Date | null>(row, "dateOfBirth", "date_of_birth") ?? null,
    age: get<number | null>(row, "age", "age") ?? null,
    gender: get<string | null>(row, "gender", "gender") ?? null,
    maritalStatus:
      get<string | null>(row, "maritalStatus", "marital_status") ?? null,
    bloodGroup: get<string | null>(row, "bloodGroup", "blood_group") ?? null,
    email: get<string | null>(row, "email", "email") ?? null,
    phone: get<string | null>(row, "phone", "phone") ?? null,
    country: get<string | null>(row, "country", "country") ?? "Kenya",
    address: get<string | null>(row, "address", "address") ?? null,
    passportNumber:
      get<string | null>(row, "passportNumber", "passport_number") ?? null,
    nationalId: get<string | null>(row, "nationalId", "national_id") ?? null,
    nhifNumber: get<string | null>(row, "nhifNumber", "nhif_number") ?? null,
    isActive: get<boolean>(row, "isActive", "is_active") ?? true,
    createdAt: get<Date>(row, "createdAt", "created_at")!,
    updatedAt: get<Date>(row, "updatedAt", "updated_at")!,
  };
}

export class PatientService {
  async getPatients(input: ListPatientsInput & { branchId: number }) {
    const { page, limit, search } = input;
    const conditions = [];

    const branchScopeQuery = eq(
      patientBranchProfiles.branchId,
      input.branchId || 0,
    );

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(patients.firstName, term),
          ilike(patients.lastName, term),
          ilike(patients.patientNumber, term),
          ilike(patients.email, term),
          ilike(patients.phone, term),
          ilike(patients.nationalId, term),
        )!,
      );
    }

    const whereClause =
      conditions.length > 0
        ? and(...conditions, branchScopeQuery)
        : branchScopeQuery;

    const [countResult, results] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .innerJoin(
          patientBranchProfiles,
          eq(patients.id, patientBranchProfiles.patientId),
        )
        .where(whereClause),
      db
        .select({
          id: patients.id,
          patientNumber: patients.patientNumber,
          salutation: patients.salutation,
          firstName: patients.firstName,
          middleName: patients.middleName,
          lastName: patients.lastName,
          dateOfBirth: patients.dateOfBirth,
          gender: patients.gender,
          maritalStatus: patients.maritalStatus,
          bloodGroup: patients.bloodGroup,
          email: patients.email,
          phone: patients.phone,
          country: patients.country,
          address: patients.address,
          passportNumber: patients.passportNumber,
          nationalId: patients.nationalId,
          nhifNumber: patients.nhifNumber,
          createdAt: patients.createdAt,
          updatedAt: patients.updatedAt,
          isActive: patientBranchProfiles.isActive,
        })
        .from(patients)
        .innerJoin(
          patientBranchProfiles,
          eq(patients.id, patientBranchProfiles.patientId),
        )
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

  async getPatient(id: string) {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id));

    if (!patient) {
      throw new Error(`Patient with ID ${id} not found`);
    }

    const [kin, guarantors, insurances] = await Promise.all([
      db.select().from(patientKins).where(eq(patientKins.patientId, id)),
      db
        .select()
        .from(patientGuarantors)
        .where(eq(patientGuarantors.patientId, id)),
      db
        .select()
        .from(patientInsurances)
        .where(eq(patientInsurances.patientId, id)),
    ]);

    return {
      ...toPatientListItem(patient as PatientRow),
      kin,
      guarantor: guarantors,
      insurance: insurances[0] || null,
    };
  }

  async createPatient(input: CreatePatientInput) {
    const [branchRec] = await db
      .select({ code: branches.code })
      .from(branches)
      .where(eq(branches.id, input.branchId));

    if (!branchRec) {
      throw new Error(`Branch with ID ${input.branchId} not found`);
    }
    const dupConditions = [];
    if (input.nationalId) {
      dupConditions.push(eq(patients.nationalId, input.nationalId));
    }
    if (input.phone) {
      dupConditions.push(
        and(
          eq(patients.phone, input.phone),
          ilike(patients.lastName, input.lastName),
        )!,
      );
    }

    if (dupConditions.length > 0) {
      const [existing] = await db
        .select({ id: patients.id, patientNumber: patients.patientNumber })
        .from(patients)
        .where(or(...dupConditions));

      if (existing) {
        throw new Error(
          `Potential duplicate found: Patient ${existing.patientNumber} matches these details.`,
        );
      }
    }

    const patientRow = await db.transaction(async (tx) => {
      const seqResult = await tx.execute(
        sql`SELECT nextval('patient_number_seq') as nextval`,
      );
      const nextvalRow = (seqResult as { rows: { nextval?: unknown }[] })
        .rows[0];
      const nextVal =
        nextvalRow?.nextval != null ? String(nextvalRow.nextval) : "1";
      const patientNumber = String(Number(nextVal)).padStart(6, "0");

      const [created] = await tx
        .insert(patients)
        .values({
          patientNumber,
          salutation: normalizeOptionalString(input.salutation),
          firstName: input.firstName,
          middleName: normalizeOptionalString(input.middleName),
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth
            ? input.dateOfBirth.split("T")[0]
            : undefined,
          gender: input.gender as any, // Cast to mapped enum correctly later down ORM stack
          maritalStatus: input.maritalStatus as any,
          bloodGroup: input.bloodGroup as any,
          email: normalizeOptionalString(input.email),
          phone: normalizeOptionalString(input.phone),
          country: normalizeOptionalString(input.country) || "Kenya",
          address: normalizeOptionalString(input.address),
          passportNumber: normalizeOptionalString(input.passportNumber),
          nationalId: normalizeOptionalString(input.nationalId),
          nhifNumber: normalizeOptionalString(input.nhifNumber),
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
            relationship: normalizeOptionalString(k.relationship),
            phone: normalizeOptionalString(k.phone),
            email: normalizeOptionalString(k.email),
            nationalId: normalizeOptionalString(k.nationalId),
          })),
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
            relationship: normalizeOptionalString(g.relationship),
            phone: normalizeOptionalString(g.phone),
            email: normalizeOptionalString(g.email),
            nationalId: normalizeOptionalString(g.nationalId),
            employer: normalizeOptionalString(g.employer),
          })),
        );
      }

      // 5. Insurance
      if (input.insurance?.providerId && input.insurance.memberNumber) {
        await tx.insert(patientInsurances).values({
          patientId: created.id,
          providerId: input.insurance.providerId,
          memberNumber: input.insurance.memberNumber,
          principalName: input.insurance.principalName,
          principalRelationship: input.insurance.principalRelationship,
          expiresAt: input.insurance.expiresAt
            ? input.insurance.expiresAt.split("T")[0]
            : undefined,
          isActive: true,
        });
      }

      return created;
    });

    return toPatientListItem(patientRow as PatientRow);
  }

  /**
   * Update an existing patient record and their relations.
   */
  async updatePatient(input: UpdatePatientInput) {
    if (!input.id) throw new Error("Patient ID is required for update");

    const patientRow = await db.transaction(async (tx) => {
      // 1. Update Core Patient Details
      const [updated] = await tx
        .update(patients)
        .set({
          salutation: normalizeOptionalString(input.salutation),
          firstName: input.firstName,
          middleName: normalizeOptionalString(input.middleName),
          lastName: input.lastName,
          dateOfBirth: input.dateOfBirth
            ? input.dateOfBirth.split("T")[0]
            : undefined,
          gender: input.gender as any,
          maritalStatus: input.maritalStatus as any,
          bloodGroup: input.bloodGroup as any,
          email: normalizeOptionalString(input.email),
          phone: normalizeOptionalString(input.phone),
          country: normalizeOptionalString(input.country) ?? undefined,
          address: normalizeOptionalString(input.address),
          passportNumber: normalizeOptionalString(input.passportNumber),
          nationalId: normalizeOptionalString(input.nationalId),
          nhifNumber: normalizeOptionalString(input.nhifNumber),
          updatedAt: new Date(),
        })
        .where(eq(patients.id, input.id))
        .returning();

      if (!updated) {
        throw new Error("Failed to update patient record");
      }

      // 2. Emergency Contact (Kin) Replace Pattern
      if (input.kin) {
        await tx.delete(patientKins).where(eq(patientKins.patientId, input.id));
        if (input.kin.length > 0) {
          await tx.insert(patientKins).values(
            input.kin.map((k) => ({
              patientId: input.id,
              isPrimary: k.isPrimary ?? false,
              firstName: k.firstName,
              lastName: k.lastName,
              relationship: normalizeOptionalString(k.relationship),
              phone: normalizeOptionalString(k.phone),
              email: normalizeOptionalString(k.email),
              nationalId: normalizeOptionalString(k.nationalId),
            })),
          );
        }
      }

      if (input.guarantor) {
        await tx
          .delete(patientGuarantors)
          .where(eq(patientGuarantors.patientId, input.id));
        if (input.guarantor.length > 0) {
          await tx.insert(patientGuarantors).values(
            input.guarantor.map((g) => ({
              patientId: input.id,
              isPrimary: g.isPrimary ?? false,
              firstName: g.firstName,
              lastName: g.lastName,
              relationship: normalizeOptionalString(g.relationship),
              phone: normalizeOptionalString(g.phone),
              email: normalizeOptionalString(g.email),
              nationalId: normalizeOptionalString(g.nationalId),
              employer: normalizeOptionalString(g.employer),
            })),
          );
        }
      }

      if (input.insurance !== undefined) {
        await tx
          .delete(patientInsurances)
          .where(eq(patientInsurances.patientId, input.id));
        if (input.insurance?.providerId && input.insurance.memberNumber) {
          await tx.insert(patientInsurances).values({
            patientId: input.id,
            providerId: input.insurance.providerId,
            memberNumber: input.insurance.memberNumber,
            principalName: input.insurance.principalName,
            principalRelationship: input.insurance.principalRelationship,
            expiresAt: input.insurance.expiresAt
              ? input.insurance.expiresAt.split("T")[0]
              : undefined,
            isActive: true,
          });
        }
      }

      return updated;
    });

    return toPatientListItem(patientRow as PatientRow);
  }

  async deactivatePatient(input: DeactivatePatientInput) {
    const [updated] = await db
      .update(patientBranchProfiles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(patientBranchProfiles.patientId, input.id),
          eq(patientBranchProfiles.branchId, input.branchId),
        ),
      )
      .returning();

    if (!updated) {
      throw new Error("Failed to deactivate patient in this branch");
    }

    return { success: true };
  }

  async getKpis(branchId: number) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalRow, activeRow, newRow] = await Promise.all([
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(patientBranchProfiles)
        .where(eq(patientBranchProfiles.branchId, branchId)),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(patientBranchProfiles)
        .where(
          and(
            eq(patientBranchProfiles.branchId, branchId),
            eq(patientBranchProfiles.isActive, true),
          ),
        ),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(patientBranchProfiles)
        .innerJoin(patients, eq(patients.id, patientBranchProfiles.patientId))
        .where(
          and(
            eq(patientBranchProfiles.branchId, branchId),
            sql`${patients.createdAt} >= ${firstDayOfMonth.toISOString()}`,
          ),
        ),
    ]);

    return {
      totalPatients: totalRow[0]?.total ?? 0,
      activePatients: activeRow[0]?.total ?? 0,
      newRegistrationsMonth: newRow[0]?.total ?? 0,
    };
  }
}

export const patientService = new PatientService();
