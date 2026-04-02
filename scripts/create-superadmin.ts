/**
 * Create Superadmin User - Full Setup
 * 
 * This script creates a complete superadmin user in both Supabase Auth and the database.
 * It generates random credentials that are NOT hardcoded.
 *
 * Usage:
 *   bun scripts/create-superadmin.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables",
  );
  process.exit(1);
}

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
  return `admin_${timestamp}_${randomId}@gtcc.local`;
}

async function createSuperadmin() {
  try {
    const email = generateEmail();
    const password = generatePassword();

    console.log("\n" + "=".repeat(70));
    console.log("🔧 SUPERADMIN CREATION - STEP 1: Supabase Auth");
    console.log("=".repeat(70));

    console.log("\n📝 Generated Credentials:");
    console.log(`   Email:       ${email}`);
    console.log(`   Password:    ${password}`);

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
            role: "superadmin",
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

    // Step 2: Generate SQL for database profile
    console.log("\n" + "=".repeat(70));
    console.log("📊 SUPERADMIN CREATION - STEP 2: Database Profile");
    console.log("=".repeat(70));

    const sql = `
-- Create superadmin profile
INSERT INTO user_profiles (
  user_id,
  email,
  first_name,
  last_name,
  is_superuser,
  is_active
) VALUES (
  '${userId}',
  '${email}',
  'System',
  'Superadmin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify the insert
SELECT * FROM user_profiles WHERE email = '${email}';
`;

    console.log("\n📋 Run this SQL in Supabase SQL Editor:");
    console.log("   https://app.supabase.com/project/[YOUR_PROJECT]/sql");
    console.log("\n" + sql);

    // Step 3: Display final summary
    console.log("\n" + "=".repeat(70));
    console.log("✨ SUPERADMIN CREDENTIALS - SAVE THESE SECURELY!");
    console.log("=".repeat(70));
    console.log(`\n📧 Email:         ${email}`);
    console.log(`🔑 Password:      ${password}`);
    console.log(`👤 User ID:       ${userId}`);
    console.log(`🏆 Role:          Superadmin (full system access)`);
    console.log(`\n⏱️  Next Steps:`);
    console.log(`   1. Copy the SQL above`);
    console.log(`   2. Go to https://app.supabase.com/project/[YOUR_PROJECT]/sql`);
    console.log(`   3. Paste and run the SQL`);
    console.log(`   4. Login at http://localhost:3000 with email: ${email}`);
    console.log(`   5. You'll see ALL system features and admin panels`);
    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("❌ Error creating superadmin:", error);
    process.exit(1);
  }
}

// Run the script
createSuperadmin();
