import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log(`Checking table 'project_submissions' at ${supabaseUrl}...`);
  const { data, error } = await supabase
    .from("project_submissions")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error checking table:", JSON.stringify(error, null, 2));
  } else {
    console.log("Table exists! Data:", data);
  }
}

checkTable();
