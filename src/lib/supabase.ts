import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";

const keys = [
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  import.meta.env.VITE_SUPABASE_KEY,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
];

const supabaseAnonKey =
  keys.find(
    (k) => k && typeof k === "string" && !k.startsWith("http://") && !k.startsWith("https://"),
  ) || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
