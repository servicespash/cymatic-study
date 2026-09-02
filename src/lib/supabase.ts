/**
 * ============================================================================
 * SUPABASE ARCHITECTURE & CLIENT UTILITIES
 * ============================================================================
 * Best Practices:
 * 1. Client-Side Security: Frontend only uses Anon/Publishable keys (read/write
 *    governed by Row Level Security policies). Service role secrets MUST NEVER
 *    be exposed in client bundles.
 * 2. Environment Variable Resolution: Gracefully parses Vite `import.meta.env`,
 *    Node/worker `process.env`, and window configuration with resilient fallbacks.
 * 3. Type-Safe Client: Bound to generated `Database` schema types.
 * ============================================================================
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function resolveEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[name]) return process.env[name];
    if (!name.startsWith("VITE_") && process.env[`VITE_${name}`]) {
      return process.env[`VITE_${name}`];
    }
  }

  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[name]) {
      return meta.env[name];
    }
  } catch {
    // ignore
  }

  if (typeof window !== "undefined" && (window as any)[name]) {
    return (window as any)[name];
  }

  return undefined;
}

// Configured credentials
const DEFAULT_SUPABASE_URL = "https://tffffvbaiccqndydsobg.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";

export const SUPABASE_URL =
  resolveEnvVar("VITE_SUPABASE_URL") ||
  resolveEnvVar("SUPABASE_URL") ||
  resolveEnvVar("PUBLIC_SUPABASE_URL") ||
  DEFAULT_SUPABASE_URL;

const potentialKeys = [
  resolveEnvVar("VITE_SUPABASE_ANON_KEY"),
  resolveEnvVar("VITE_SUPABASE_KEY"),
  resolveEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY"),
  resolveEnvVar("SUPABASE_ANON_KEY"),
  resolveEnvVar("SUPABASE_KEY"),
  resolveEnvVar("PUBLIC_SUPABASE_ANON_KEY"),
];

export const SUPABASE_ANON_KEY =
  potentialKeys.find(
    (k) => k && typeof k === "string" && !k.startsWith("http://") && !k.startsWith("https://"),
  ) || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Primary typed Supabase client
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "x-application-name": "lattys-cymatic-study",
      },
    },
  },
);

/**
 * Database Query Helper: Safely executes a Supabase query with error catching
 */
export async function safeSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T | null = null,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn("Supabase query notice:", error.message || error);
      return { data: fallback, error: new Error(error.message || "Query failed") };
    }
    return { data, error: null };
  } catch (err: any) {
    console.error("Supabase query exception:", err);
    return { data: fallback, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Health check helper to verify Supabase connectivity
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
}> {
  const start = performance.now();
  try {
    const { error } = await supabase.from("profiles").select("user_id").limit(1);
    const latencyMs = Math.round(performance.now() - start);
    return { connected: !error || !error.message?.includes("fetch"), latencyMs };
  } catch {
    return { connected: false, latencyMs: -1 };
  }
}

export type { Database };
export default supabase;
