/**
 * Superadmin seed
 *
 * Creates or updates a superuser profile for an existing Supabase auth user.
 *
 * IMPORTANT:
 * - This seed does NOT create the auth user or set their password.
 * - First, create the user in Supabase auth (UI/CLI/API) with:
 *     email:    festusgitahik@gmail.com
 *     password: festus004
 * - Then run this seed to link that auth user to `user_profiles` and mark it as superuser.
 */

import { sql } from "drizzle-orm";
import { db } from "../client";
import { userProfiles } from "../schema";

const SUPERADMIN_EMAIL = "festusgitahik@gmail.com";

export async function seed() {
  console.log("Seeding superadmin user...");

  // 1) Look up the Supabase auth user by email.
  const authResult = await db.execute<{
    id: string;
    email: string;
  }>(
    sql`select id, email from auth.users where email = ${SUPERADMIN_EMAIL} limit 1`,
  );

  const authUser = authResult.rows[0];

  if (!authUser) {
    console.warn(
      `No auth.users row found for email ${SUPERADMIN_EMAIL}. ` +
        "Create the user in Supabase auth first, then rerun this seed.",
    );
    return;
  }

  const [profile] = await db
    .insert(userProfiles)
    .values({
      userId: authUser.id,
      email: authUser.email,
      firstName: "Festus",
      lastName: "Gitahi",
      isSuperuser: true,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: userProfiles.email,
      set: {
        userId: authUser.id,
        isSuperuser: true,
        isActive: true,
      },
    })
    .returning();

  if (!profile) {
    console.warn(
      `Insert/update for superadmin profile completed but no row was returned. ` +
        "Check the user_profiles table manually.",
    );
    return;
  }

  console.log(
    `Superadmin profile ensured for ${SUPERADMIN_EMAIL} with user_profiles.id=${profile.id}`,
  );
}
