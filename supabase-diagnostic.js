import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY in environment variables.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function runDiagnostic() {
  console.log("==================================================");
  console.log(" Supabase Remote Database & Privileges Diagnostic ");
  console.log("==================================================");
  console.log(`Target URL: ${supabaseUrl}`);

  // 1. Test basic connectivity via query on profiles table
  console.log("\n[1] Testing connection and 'profiles' table existence...");
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  if (profileError) {
    console.log(
      `⚠️ 'profiles' query error (table might not exist yet or permission denied):`,
      profileError.message,
    );
  } else {
    console.log(
      `✅ Successfully connected to Supabase and queried 'profiles' table. Rows found: ${profileData?.length || 0}`,
    );
  }

  // 2. Test auth admin capabilities or check current user/role if possible
  console.log("\n[2] Testing Auth Admin API access...");
  try {
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (usersError) {
      console.log(`⚠️ Auth Admin API error (requires service_role key):`, usersError.message);
    } else {
      console.log(`✅ Auth Admin API is accessible. Total users listed successfully.`);
    }
  } catch (err) {
    console.log(`⚠️ Exception testing Auth Admin API:`, err.message);
  }

  // 3. Diagnostic Report & Recommendations on Auth Triggers
  console.log("\n[3] Analysis of 'on_auth_user_created' Trigger Failure:");
  console.log("------------------------------------------------------------------");
  console.log("Root Cause:");
  console.log("  - Creating triggers on the managed 'auth.users' table (which resides in the");
  console.log("    Supabase-managed 'auth' schema) often fails during `supabase db push` if");
  console.log(
    "    the migration connection user lacks superuser / table owner privileges on 'auth.users'.",
  );
  console.log("");
  console.log("Recommended Alternative Solutions:");
  console.log("  1. Client-Side / Lazy Profile Upsert (Recommended for robust SPA resilience):");
  console.log("     - Instead of relying solely on a database trigger on `auth.users`, have the");
  console.log(
    "       frontend check for and upsert the user profile upon successful sign-in/auth state change.",
  );
  console.log("  2. Supabase Database Webhook / Edge Function:");
  console.log(
    "     - Configure a Supabase Database Webhook or Edge Function triggered on auth events",
  );
  console.log("       to provision profile records asynchronously.");
  console.log("  3. Conditional Trigger with Exception Handling in Migration:");
  console.log("     - Wrap the trigger creation in a DO block with EXCEPTION handling so that if");
  console.log(
    "       permission is denied on auth.users, the migration logs a warning instead of failing.",
  );
  console.log("==================================================");
}

runDiagnostic().catch(console.error);
