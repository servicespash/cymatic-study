import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  // Use a query that is likely to work if PostgREST is up
  // Or try to use a RPC if one exists to list tables
  // Since we can't easily run raw SQL, we'll try to guess or use a known table to see if it works
  
  console.log("Checking some known tables...");
  const tables = ["profiles", "organizations", "project_submissions", "chat_messages"];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message}`);
    } else {
      console.log(`Table '${table}': EXISTS`);
    }
  }
}

listTables();
