import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tffffvbaiccqndydsobg.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";

async function run() {
  const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const data = await response.json();
  console.log(Object.keys(data.definitions).join("\n"));
}
run();
