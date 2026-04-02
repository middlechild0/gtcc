/**
 * Script to create the first user in the system
 * Generates random credentials, creates auth user in Supabase, then creates profile in database
 *
 * Usage:
 *   bun scripts/create-user.ts [firstName] [lastName] [branch-id]
 *
 * Example:
 *   bun scripts/create-user.ts "John" "Doe" 1
 */

import { db } from "@visyx/db/client";
import { branches, userProfiles } from "@visyx/db/schema";
import { eq } from "drizzle-orm";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables",
  );
  process.exit(1);
}

// Get command line arguments
const firstName = process.argv[2] || "Dr";
const lastName = process.argv[3] || "Admin";
const branchId = process.argv[4] ? parseInt(process.argv[4]) : null;

// Generate random credentials
function generatePassword(length: number = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateEmail(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const randomId = Math.random().toString(36).substring(2, 8);
  return `user_${timestamp}_${randomId}@gtcc.local`;
}

async function createUser() {
  try {
    const email = generateEmail();
    const password = generatePassword();

    console.log("📝 User Credentials Generated:");
    console.log(`   Email:         ${email}`);
    console.log(`   Password:      ${password}`);
    console.log(`   First Name:    ${firstName}`);
    console.log(`   Last Name:     ${lastName}`);
    if (branchId) {
      console.log(`   Branch ID:     ${branchId}`);
    }

    // Step 1: Create auth user in Supabase
    console.log("\n🔐 Creating auth user in Supabase...");

    const authResponse = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          apikey: SUPABASE_SERVICE_KEY,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            firstName,
            lastName,
          },
        }),
      },
    );

    if (!authResponse.ok) {
      const error = await authResponse.json();
      console.error("❌ Failed to create auth user:", error);
      process.exit(1);
    }

    const authUser = await authResponse.json();
    const userId = authUser.id;

    console.log(`✅ Auth user created with ID: ${userId}`);

    // Step 2: Create user profile in database
    console.log("\n📊 Creating user profile in database...");

    const [profile] = await db
      .insert(userProfiles)
      .values({
        userId,
        email,
        firstName,
        lastName,
        isActive: true,
        isSuperuser: false,
      })
      .returning();

    if (!profile) {
      console.error("❌ Failed to create user profile");
      process.exit(1);
    }

    console.log(`✅ User profile created with ID: ${profile.id}`);

    // Step 3: Display final credentials
    console.log("\n" + "=".repeat(60));
    console.log("✨ USER CREATED SUCCESSFULLY");
    console.log("=".repeat(60));
    console.log(`Email:      ${email}`);
    console.log(`Password:   ${password}`);
    console.log(`User ID:    ${userId}`);
    console.log(`Profile ID: ${profile.id}`);
    console.log("=".repeat(60));
    console.log("\n📋 Save these credentials securely!");
    console.log("   The user can now login with the email and password above.");
    console.log("\n");
  } catch (error) {
    console.error("❌ Error creating user:", error);
    process.exit(1);
  }
}

// Run the script
createUser();


// 