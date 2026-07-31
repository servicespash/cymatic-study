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
    persistSession: false,
  },
});

async function auditDatabaseSchema() {
  console.log("================================================================");
  console.log(" Supabase Schema & Administrative Access Audit");
  console.log("================================================================");
  console.log(`Target Supabase URL: ${supabaseUrl}`);

  const checks = [
    {
      name: "profiles table",
      query: () => supabase.from("profiles").select("user_id, role").limit(1),
    },
    { name: "user_roles table", query: () => supabase.from("user_roles").select("*").limit(1) },
    { name: "attendance table", query: () => supabase.from("attendance").select("*").limit(1) },
    {
      name: "tutor_sessions table",
      query: () => supabase.from("tutor_sessions").select("*").limit(1),
    },
    {
      name: "institution_registry table",
      query: () => supabase.from("institution_registry").select("*").limit(1),
    },
  ];

  for (const check of checks) {
    try {
      const start = Date.now();
      const { error } = await check.query();
      const duration = Date.now() - start;

      if (error) {
        console.log(`❌ [FAIL] ${check.name} (${duration}ms): ${error.message}`);
        if (error.message.includes("infinite recursion")) {
          console.log(
            `   💡 FIX REQUIRED: Fix recursive RLS policies on ${check.name} using a SECURITY DEFINER helper function.`,
          );
        } else if (error.message.includes("does not exist")) {
          console.log(
            `   💡 FIX REQUIRED: Run migrations to create table or missing columns for ${check.name}.`,
          );
        }
      } else {
        console.log(`✅ [OK]   ${check.name} accessible (${duration}ms).`);
      }
    } catch (err) {
      console.log(`⚠️ [ERROR] ${check.name} query exception:`, err.message);
    }
  }

  console.log("\n----------------------------------------------------------------");
  console.log(" Admin Auth & RLS Recommendations:");
  console.log(" 1. Ensure `user_roles` check uses non-recursive security definer functions.");
  console.log(" 2. Verify Supabase service role key is used for backend administrative overrides.");
  console.log(" 3. Check `all_migrations.sql` in the repository root for full DDL definitions.");
  console.log("================================================================");
}

auditDatabaseSchema().catch(console.error);
