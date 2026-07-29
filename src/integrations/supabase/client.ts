// This file is updated to integrate our synchronized system schemas.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function getEnv(name: string): string | undefined {
  // Use a safe way to access environment variables that works in both Vite (import.meta.env)
  // and Node (process.env), and is safe for CommonJS bundling.

  // 1. Try process.env first (Node / Server-side)
  if (typeof process !== "undefined" && process.env) {
    if (process.env[name]) return process.env[name];
    // Also check VITE_ prefixed version if we're looking for a non-prefixed one
    if (!name.startsWith("VITE_") && process.env[`VITE_${name}`])
      return process.env[`VITE_${name}`];
  }

  // 2. Try import.meta.env (Vite / Client-side)
  // We use a safe check to avoid syntax errors in CJS environments
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env[name]) {
      return meta.env[name];
    }
  } catch (e) {
    // Ignore syntax errors or reference errors for import.meta
  }

  // 3. Fallback to window for certain environments
  if (typeof window !== "undefined" && (window as any)[name]) {
    return (window as any)[name];
  }

  return undefined;
}

function createSupabaseClient() {
  const DEFAULT_URL = "https://tffffvbaiccqndydsobg.supabase.co";
  const DEFAULT_KEY = "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";

  const SUPABASE_URL =
    getEnv("VITE_SUPABASE_URL") ||
    getEnv("SUPABASE_URL") ||
    getEnv("PUBLIC_SUPABASE_URL") ||
    DEFAULT_URL;

  // Filter out invalid URL-like strings that are mistakenly populated as key
  const keys = [
    getEnv("VITE_SUPABASE_ANON_KEY"),
    getEnv("VITE_SUPABASE_KEY"),
    getEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
    getEnv("SUPABASE_ANON_KEY"),
    getEnv("SUPABASE_KEY"),
    getEnv("PUBLIC_SUPABASE_ANON_KEY"),
  ];

  const SUPABASE_PUBLISHABLE_KEY =
    keys.find(
      (k) => k && typeof k === "string" && !k.startsWith("http://") && !k.startsWith("https://"),
    ) || DEFAULT_KEY;

  if (SUPABASE_URL === DEFAULT_URL || SUPABASE_PUBLISHABLE_KEY === DEFAULT_KEY) {
    console.log("[Supabase] Using production fallback environment variables.");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
