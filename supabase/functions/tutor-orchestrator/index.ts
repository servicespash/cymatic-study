// supabase/functions/tutor-orchestrator/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req: Request) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = async (e) => {
    const data = JSON.parse(e.data);

    // 1. Handle incoming message (ACK / User Input)
    // 2. Query/Update tutor_sessions
    // 3. Orchestrate AI call
    // 4. Stream response back via socket

    console.log("Received message:", data);

    // Placeholder ACK
    if (data.type === "message") {
      socket.send(
        JSON.stringify({
          event_id: crypto.randomUUID(),
          type: "ack",
          payload: { message_id: data.message_id },
          timestamp: Date.now(),
        }),
      );
    }
  };

  socket.onclose = () => console.log("WebSocket connection closed");

  return response;
});
