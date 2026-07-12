import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_KEY);
async function check() {
  const { error } = await supabase.from("reactions").select("id").limit(1);
  if (error) {
    if (error.code === "42P01") console.log("Table 'reactions' does not exist.");
    else console.log("Error checking table:", error.message);
  } else {
    console.log("Table 'reactions' exists.");
  }
}
check();
