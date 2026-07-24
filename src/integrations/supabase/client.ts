// This file is updated to integrate our synchronized system schemas.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function getEnv(name: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  if (typeof process !== "undefined" && process.env && process.env[name]) {
    return process.env[name];
  }
  if (typeof window !== "undefined" && (window as any)[name]) {
    return (window as any)[name];
  }
  return undefined;
}

function createSupabaseClient() {
  const SUPABASE_URL =
    getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL") || getEnv("PUBLIC_SUPABASE_URL");

  // Filter out invalid URL-like strings that are mistakenly populated as key
  const keys = [
    getEnv("VITE_SUPABASE_ANON_KEY"),
    getEnv("VITE_SUPABASE_KEY"),
    getEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
    getEnv("SUPABASE_ANON_KEY"),
    getEnv("SUPABASE_KEY"),
    getEnv("PUBLIC_SUPABASE_ANON_KEY"),
  ];

  const SUPABASE_PUBLISHABLE_KEY = keys.find(
    (k) => k && typeof k === "string" && !k.startsWith("http://") && !k.startsWith("https://"),
  );

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error("[Supabase] Missing environment variables:", {
      URL_PRESENT: !!SUPABASE_URL,
      KEY_PRESENT: !!SUPABASE_PUBLISHABLE_KEY,
    });
    // Return a dummy client to prevent app crash if environment is missing,
    // though auth calls will fail as expected.
    return createClient("https://placeholder.supabase.co", "placeholder-key");
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
