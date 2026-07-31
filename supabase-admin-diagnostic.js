import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase URL or Key in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

async function runAdminLoginDiagnostic() {
  console.log("==================================================");
  console.log(" Supabase Admin Authentication & Session Diagnostic");
  console.log("==================================================");
  console.log(`Target URL: ${supabaseUrl}`);

  // 1. Check current session persistence state
  console.log("\n[1] Checking current auth session state...");
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log("⚠️ Error fetching session:", sessionError.message);
    } else if (sessionData.session) {
      console.log("✅ Active session found for user:", sessionData.session.user.email);
      console.log("   User ID:", sessionData.session.user.id);
      const expiresAt = sessionData.session.expires_at
        ? new Date(sessionData.session.expires_at * 1000).toISOString()
        : "Unknown";
      console.log("   Expires at:", expiresAt);
    } else {
      console.log("ℹ️ No active session currently stored in client context.");
    }
  } catch (err) {
    console.log("⚠️ Exception checking session:", err.message);
  }

  // 2. Test profiles / roles table access & potential RLS recursion issues
  console.log("\n[2] Testing 'profiles' and 'user_roles' table read access & RLS performance...");
  const startTime = Date.now();
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, role, school_id")
      .limit(5);

    const duration = Date.now() - startTime;
    if (profilesError) {
      console.log(`❌ Error querying 'profiles' table (${duration}ms):`, profilesError.message);
      console.log(
        "   💡 Potential cause: RLS policy recursion or missing indexes on user_id / role.",
      );
    } else {
      console.log(
        `✅ Successfully queried 'profiles' table in ${duration}ms. Rows found: ${profiles?.length || 0}`,
      );
    }
  } catch (err) {
    console.log("❌ Exception querying profiles:", err.message);
  }

  // 3. Test user_roles table query
  console.log("\n[3] Testing 'user_roles' table read access...");
  const roleStartTime = Date.now();
  try {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .limit(5);

    const roleDuration = Date.now() - roleStartTime;
    if (rolesError) {
      console.log(`⚠️ Error querying 'user_roles' table (${roleDuration}ms):`, rolesError.message);
      console.log(
        "   💡 Note: 'user_roles' might not exist or may have restricted RLS causing hangs if unauthenticated.",
      );
    } else {
      console.log(
        `✅ Successfully queried 'user_roles' table in ${roleDuration}ms. Rows found: ${roles?.length || 0}`,
      );
    }
  } catch (err) {
    console.log("ℹ️ Exception querying user_roles (table may not exist):", err.message);
  }

  // 4. Admin Dashboard Freeze Root Cause Analysis
  console.log("\n[4] Root Cause Analysis for Admin Dashboard Freezes:");
  console.log("------------------------------------------------------------------");
  console.log("1. RLS Infinite Recursion / Deadlocks:");
  console.log(
    "   - If admin RLS policies on `profiles` or `user_roles` query `user_roles` or `profiles` recursively without `SECURITY DEFINER` helper functions, Postgres enters an infinite loop, causing requests to hang indefinitely.",
  );
  console.log("2. Unhandled Auth State Suspense / Infinite Loading:");
  console.log(
    "   - If `useAuth()` or `RoleGuard` awaits role queries that hang due to RLS blocks or missing rows, the UI component tree suspends indefinitely ('Please wait while your application starts...' or blank freezing screen).",
  );
  console.log("3. Missing Session Persistence / Token Refresh Failures:");
  console.log(
    "   - Browser storage quota or third-party cookie restrictions in iframe environments can prevent localStorage session retrieval, leading to retry loops.",
  );
  console.log("==================================================");
}

runAdminLoginDiagnostic().catch(console.error);
