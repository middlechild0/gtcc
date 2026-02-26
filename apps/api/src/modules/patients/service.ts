import { RedisCache } from "@visyx/cache/redis-client";
import { db } from "@visyx/db/client";
import { userProfiles } from "@visyx/db/schema";

// Utilizing the optional Redis cache
const patientCache = new RedisCache("patients", 3600); // 1 hour TTL

export class PatientService {
  /**
   * Fetch a test patient list
   * Demonstrates using the cache gracefully
   */
  async getPatients() {
    const CACHE_KEY = "list_all";
    const cached = await patientCache.get<any[]>(CACHE_KEY);

    if (cached) {
      return cached;
    }

    // Since we don't have a patients table yet, we'll just query the userProfiles
    // as a placeholder to demonstrate the architecture.
    // In reality, this would query a patients table.
    const results = await db
      .select({
        id: userProfiles.id,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
      })
      .from(userProfiles)
      .limit(50);

    // Save to cache without blocking
    void patientCache.set(CACHE_KEY, results).catch(console.error);

    return results;
  }
}

export const patientService = new PatientService();
