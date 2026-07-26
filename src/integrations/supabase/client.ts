// This file is updated to integrate our synchronized system schemas.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function getEnv(name: string): string | undefined {
  // Statically check keys so Vite can replace them at build time
  if (name === "VITE_SUPABASE_URL") return import.meta.env.VITE_SUPABASE_URL;
  if (name === "VITE_SUPABASE_ANON_KEY") return import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (name === "VITE_SUPABASE_KEY") return import.meta.env.VITE_SUPABASE_KEY;
  if (name === "VITE_SUPABASE_PUBLISHABLE_KEY") return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (name === "SUPABASE_URL") return import.meta.env.SUPABASE_URL || (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
  if (name === "SUPABASE_ANON_KEY") return import.meta.env.SUPABASE_ANON_KEY || (typeof process !== "undefined" ? process.env.SUPABASE_ANON_KEY : undefined);

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
  const DEFAULT_URL = "https://tffffvbaiccqndydsobg.supabase.co";
  const DEFAULT_KEY = "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";

  const SUPABASE_URL =
    getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL") || getEnv("PUBLIC_SUPABASE_URL") || DEFAULT_URL;

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
