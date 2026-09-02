import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
);

async function listColumns() {
  const { data, error } = await supabase.from("user_roles").select("*").limit(5);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns:", data.length > 0 ? Object.keys(data[0]) : "No data in user_roles");
  }
}
listColumns();
