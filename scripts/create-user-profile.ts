/**
 * Script to create the first user in the system - Step 2 (Database Profile)
 * Use this to manually insert the user profile after the auth user has been created
 *
 * Usage:
 *   Run the SQL below in your Supabase database after getting the user ID from create-user.ts
 */

const userId = process.argv[2];
const email = process.argv[3];
const firstName = process.argv[4];
const lastName = process.argv[5];

if (!userId || !email || !firstName || !lastName) {
  console.error(
    "Usage: bun scripts/create-user-profile.ts <userId> <email> <firstName> <lastName>",
  );
  process.exit(1);
}

const sql = `
-- Insert user profile into database
-- Run this SQL in your Supabase database
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
  '${firstName}',
  '${lastName}',
  false,
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify the insert
SELECT id, user_id, email, first_name, last_name, is_active FROM user_profiles
WHERE email = '${email}';
`;

console.log(sql);
console.log("\n📋 Copy and paste the SQL above into your Supabase SQL editor");
console.log(
  "   (or run it via psql if you have direct database access)\n",
);
