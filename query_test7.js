import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://tffffvbaiccqndydsobg.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Q6c0ZU7hu-Ow6bdzbK5-ig_S74FsIK0";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("directory_roster").select("id").limit(1);
  console.log("directory_roster Error:", error);
}
run();
