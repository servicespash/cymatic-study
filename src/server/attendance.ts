import { supabase } from "@/integrations/supabase/client";

export async function handleAttendanceRequest(req: Request) {
  let body;
  const contentType = req.headers.get("content-type");

  try {
    if (contentType?.includes("application/json")) {
      body = await req.json();
    } else {
      // Handle text/plain from sendBeacon
      const text = await req.text();
      body = JSON.parse(text);
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { userId, sessionId, duration } = body;

  const { data, error } = await supabase
    .from("attendance_logs")
    .insert([{ user_id: userId, session_id: sessionId, duration_minutes: duration }]);

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
