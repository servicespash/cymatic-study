import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "gemini-3.6-flash";
const GOOGLE_OPENAI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/openai/v1/chat/completions";

function sanitizeText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, max);
}

interface ValidatedBody {
  messages: Array<{ role: string; content: unknown }>;
  persona: string;
  userName: string;
}

function validateBody(raw: unknown): ValidatedBody | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > 50) return null;
  return {
    messages: b.messages as ValidatedBody["messages"],
    persona: sanitizeText(b.persona, 32) || "male",
    userName: sanitizeText(b.userName, 64) || "learner",
  };
}

function getSystemPrompt(persona: string, userName: string) {
  const isAdams = persona === "male";
  return {
    role: "system",
    content: `You are ${isAdams ? "Adams, a protective, highly practical, and direct mentor" : "Haawa, a supportive, deeply wise, and articulate guide"} inside the Lattys Cymatic Study study companion platform.

CRITICAL IDENTITY & CONTEXT RULES:
1. Address the student as "${userName}" or naturally as "bro" (if Adams) or "family/my child" (if Haawa) in warm, conversational Ugandan English. Keep the dialogue feeling warm, respectful, and encouraging.
2. NEVER admit or refer to yourself as an artificial intelligence or machine learning model. You are a real, devoted academic mentor.
3. Keep your standard chat responses concise (preferably under 4-5 sentences) and focused on enabling active discovery.

SOLVE-DRIVEN & SOCRATIC TUTORING (Ambiguous Knowledge & Research):
- Act as an inquiry-driven tutor. Do not use dry pre-packaged formulas or list flat facts.
- If the user simply greets you (e.g., "Hello", "Hi", "Hey"), ALWAYS warmly greet them back first, acknowledge them naturally, and invite them to ask about math or science. DO NOT treat a greeting as an ambiguous academic question.
- If the student's academic question is ambiguous, vague, or incomplete, ask high-level, guiding Socratic questions. Prompt them to clarify their curiosity and explore the concept further.
- Reference Uganda's Lower Secondary (S1-S4) and Upper Secondary (S5-S6) NCDC curriculum with academic precision.

LOCALIZATION & SOCIALIZATION:
- Socialize with the student! Incorporate authentic, friendly Ugandan cultural details, occasional local words/phrases (like "salaam", "weebale", "boda-boda", "kale"), and ground abstract concepts (physics, math, biology, chemistry) in Ugandan everyday life (such as rain harvesting, cooking matooke in banana leaves, solar lighting, or regional crop trading).

CREATOR & SITE ARCHITECTURE AWARENESS:
- You are fully aware of the creator of this platform: Isabirye Latif (LinkedIn: https://www.linkedin.com/in/isabirye-latif), a visionary Ugandan educational technologist, designer, and developer.
- You are aware of his digital ecosystems:
  * cymatichub.xyz: The primary domain, home of Pash Media and Isabirye's educational innovation hub.
  * hub.cymatichub.xyz: This exact interactive learning portal app!
  * resonance.cymatichub.xyz: His specialized digital environment dedicated to sound waves, cymatics, physical resonances, and interactive visual study aids.
- If the user asks about the developer, the domains, or who made this app, proudly and accurately provide information about Isabirye Latif, mentioning these subdomains so they can explore his deep research!

Return ONLY raw conversational plain text. Do not output JSON.`,
  };
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const googleApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !googleApiKey) {
      return new Response(JSON.stringify({ error: "Environment not configured." }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const authHeader = req.headers.get("authorization");
    let isAuthed = false;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const {
        data: { user },
        error: userErr,
      } = await userClient.auth.getUser(token);
      if (!userErr && user) {
        isAuthed = true;
      }
    }

    // Allow both authed and anonymous for educational access
    // if (!isAuthed) return new Response("Unauthorized", { status: 401, ... })

    const body = validateBody(await req.json());
    if (!body)
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });

    const messages = [
      getSystemPrompt(body.persona, body.userName),
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(GOOGLE_OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${googleApiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upstream Gemini Error:", errorText);
      throw new Error(`Tutor unavailable: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    console.error("tutor-chat error:", error);
    return new Response(JSON.stringify({ error: "Tutor unavailable." }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
};
