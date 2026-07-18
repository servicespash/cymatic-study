import { createClient } from "@supabase/supabase-js";

const isServer = typeof window === "undefined";

// Secure helper to resolve environment variables on both client and server
const getEnvVar = (name: string): string => {
  if (isServer) {
    return process.env[name] || process.env[`VITE_${name}`] || "";
  } else {
    return (import.meta.env[`VITE_${name}`] as string) || (import.meta.env[name] as string) || "";
  }
};

// Helper to extract the Supabase project ID from a PostgreSQL connection string
function extractProjectIdFromConnectionString(connStr: string): string | null {
  if (!connStr) return null;

  // Pattern 1: postgresql://postgres.[project-id]:[password]@...pooler.supabase.com...
  const pattern1 = /postgres\.([^:]+):/;
  const match1 = connStr.match(pattern1);
  if (match1 && match1[1]) {
    return match1[1];
  }

  // Pattern 2: postgresql://postgres:[password]@db.[project-id].supabase.co...
  const pattern2 = /@db\.([^.]+)\.supabase\.co/;
  const match2 = connStr.match(pattern2);
  if (match2 && match2[1]) {
    return match2[1];
  }

  // Pattern 3: general host check if it contains supabase.co
  const pattern3 = /@([^.]+)\.supabase\.co/;
  const match3 = connStr.match(pattern3);
  if (match3 && match3[1]) {
    return match3[1];
  }

  return null;
}

function getSupabaseConfig() {
  const dbUrl = getEnvVar("DATABASE_URL");
  const extractedProjectId = extractProjectIdFromConnectionString(dbUrl);

  // Default to the provided ID 'tffffvbaiccqndydsobg' if extracted is not available
  const projectId =
    extractedProjectId || getEnvVar("SUPABASE_PROJECT_ID") || "tffffvbaiccqndydsobg";

  const supabaseUrl = getEnvVar("SUPABASE_URL") || `https://${projectId}.supabase.co`;
  const supabaseKey = getEnvVar("SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  return { supabaseUrl, supabaseKey };
}

export function initSupabaseClient() {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "[Supabase] Unable to initialize fully. Missing credentials. " +
        "Make sure DATABASE_URL, SUPABASE_URL, and SUPABASE_ANON_KEY are configured securely.",
    );
    // Return a safe placeholder client to prevent startup crashes
    return createClient("https://placeholder-url.supabase.co", "placeholder-key");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: !isServer,
      autoRefreshToken: !isServer,
    },
  });
}

// Export Supabase client for use across the application
export const supabase = initSupabaseClient();
