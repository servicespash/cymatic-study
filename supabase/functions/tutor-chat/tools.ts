// supabase/functions/tutor-chat/tools.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// Define a strict schema for the tools
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_daily_task",
      description: "Creates a study task for the user.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string" },
          task_type: { type: "string", enum: ["quiz", "notes", "project", "review"] },
        },
        required: ["description", "task_type"],
      },
    },
  },
];

export async function executeTool(name: string, args: any, userId: string, supabaseAdmin: any) {
  switch (name) {
    case "create_daily_task": {
      const { description, task_type } = args;
      const { error } = await supabaseAdmin.from("daily_tasks").insert({
        user_id: userId,
        description,
        task_type,
        task_date: new Date().toISOString().split("T")[0],
      });
      if (error) throw new Error("task_insert_failed");
      return "Task created successfully.";
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
