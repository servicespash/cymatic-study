import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const getEnv = (name: string) => {
  if (typeof process !== "undefined" && process.env && process.env[name]) return process.env[name];
  try {
    return (import.meta as any).env[name];
  } catch {
    return undefined;
  }
};

const supabaseUrl =
  getEnv("VITE_SUPABASE_URL") || getEnv("SUPABASE_URL") || "https://placeholder.supabase.co";

const keys = [
  getEnv("VITE_SUPABASE_ANON_KEY"),
  getEnv("VITE_SUPABASE_KEY"),
  getEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
  getEnv("SUPABASE_ANON_KEY"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
];

const supabaseKey =
  keys.find(
    (k) => k && typeof k === "string" && !k.startsWith("http://") && !k.startsWith("https://"),
  ) || "placeholder-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
