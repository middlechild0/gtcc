import { db } from "@visyx/db/client";
import { patients } from "@visyx/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { CreatePatientInput, ListPatientsInput } from "./schemas";

/** Raw row from Drizzle (may have snake_case or camelCase keys depending on driver/casing). */
type PatientRow = Record<string, unknown> & {
  id?: string;
  patient_number?: string | null;
  patientNumber?: string | null;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
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
    patientNumber: get<string | null>(row, "patientNumber", "patient_number") ?? null,
    firstName: get<string>(row, "firstName", "first_name")!,
    lastName: get<string>(row, "lastName", "last_name")!,
    email: get<string | null>(row, "email", "email") ?? null,
    phone: get<string | null>(row, "phone", "phone") ?? null,
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
    const conditions = [eq(patients.isActive, true)];

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

    const whereClause = and(...conditions);

    const [countResult, results] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .where(whereClause),
      db
        .select({
          id: patients.id,
          patientNumber: patients.patientNumber,
          firstName: patients.firstName,
          lastName: patients.lastName,
          email: patients.email,
          phone: patients.phone,
          isActive: patients.isActive,
          createdAt: patients.createdAt,
          updatedAt: patients.updatedAt,
        })
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
   */
  async createPatient(input: CreatePatientInput) {
    const seqResult = await db.execute(
      sql`SELECT nextval('patient_number_seq') as nextval`,
    );
    const nextvalRow = (seqResult as { rows: { nextval?: unknown }[] }).rows[0];
    const nextVal = nextvalRow?.nextval != null ? String(nextvalRow.nextval) : "1";
    const patientNumber = `PAT-${String(Number(nextVal)).padStart(6, "0")}`;

    const [created] = await db
      .insert(patients)
      .values({
        patientNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email === "" ? null : input.email,
        phone: input.phone,
      })
      .returning();

    if (!created) return created;

    const rows = await db
      .select({
        id: patients.id,
        patientNumber: patients.patientNumber,
        firstName: patients.firstName,
        lastName: patients.lastName,
        email: patients.email,
        phone: patients.phone,
        isActive: patients.isActive,
        createdAt: patients.createdAt,
        updatedAt: patients.updatedAt,
      })
      .from(patients)
      .where(eq(patients.id, created.id))
      .limit(1);

    const patientRow = rows[0] ?? (created as PatientRow);
    return toPatientListItem(patientRow);
  }

  /**
   * KPI counts: total and active patients from the DB.
   */
  async getKpis() {
    const [row] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${patients.isActive})::int`,
      })
      .from(patients);

    const totalPatients = row?.total ?? 0;
    const activePatients = row?.active ?? totalPatients;

    return {
      totalPatients,
      activePatients,
    };
  }
}

export const patientService = new PatientService();
