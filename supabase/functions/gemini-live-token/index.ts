// Mints an ephemeral Gemini Live API token for authenticated users only.
// Token is single-use, short-lived, and scoped to the bidi Live model.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...CORS },
    });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: "Supabase environment not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
  const token = auth.slice(7).trim();
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  if (!geminiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  // Mint an ephemeral auth token via the Gemini AuthTokens API.
  // Valid for 30 minutes, single new session, with 2-minute session start window.
  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 2 * 60 * 1000).toISOString();

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uses: 1,
          expire_time: expireTime,
          new_session_expire_time: newSessionExpireTime,
        }),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      console.error("auth_tokens error", res.status, errText);
      return new Response(JSON.stringify({ error: "Token mint failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }
    const j = await res.json();
    return new Response(JSON.stringify({ token: j.name, expires_at: expireTime }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  } catch (e) {
    console.error("mint exception", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
};
