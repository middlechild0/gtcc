import { db } from "@visyx/db/client";
import { patients } from "@visyx/db/schema";
import { desc, eq } from "drizzle-orm";
import type { CreatePatientInput } from "./schemas";

export class PatientService {
  /**
   * Fetch a real patient list from the patients table.
   */
  async getPatients() {
    const results = await db
      .select()
      .from(patients)
      .where(eq(patients.isActive, true))
      .orderBy(desc(patients.createdAt))
      .limit(50);

    return results;
  }

  /**
   * Create a new patient record.
   */
  async createPatient(input: CreatePatientInput) {
    const [created] = await db
      .insert(patients)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        // Keep the DB clean: empty string → null
        email: input.email === "" ? null : input.email,
        phone: input.phone,
      })
      .returning();

    return created;
  }

  /**
   * Simple KPI-style stats for the placeholder patients list.
   * For now this is derived from userProfiles, limited to the same
   * placeholder dataset as getPatients().
   */
  async getKpis() {
    const patients = await this.getPatients();
    const totalPatients = patients.length;

    // With the current placeholder data we don't distinguish active/inactive,
    // so we treat all returned rows as active.
    const activePatients = totalPatients;

    return {
      totalPatients,
      activePatients,
    };
  }
}

export const patientService = new PatientService();
