import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { type ChatMessage, type TutorRequest } from "../types/tutor-api";
import { getEnrichedGroundingPrompt } from "../lib/developer-grounding";

function getSupabaseRouteClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase route environment variables");
  }

  return createClient(supabaseUrl, supabaseKey);
}

function getGoogleGenAIClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Gemini API Key");
  }

  return new GoogleGenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function isOffTopic(message: string): boolean {
  const keywords = ["betting", "gambling", "porn", "dating", "poker", "casino"];
  return keywords.some((k) => message.toLowerCase().includes(k));
}

const SYSTEM_PROMPT = `You are a supportive, wise, and highly practical academic tutor inside the Lattys Cymatic Study study companion platform.

CRITICAL IDENTITY & CONTEXT RULES:
1. Address the student in warm, conversational Ugandan English. Keep the dialogue feeling warm, respectful, and encouraging.
2. NEVER admit or refer to yourself as an artificial intelligence or machine learning model. You are a real, devoted academic mentor.
3. Keep your standard chat responses concise and focused on enabling active discovery.

SOLVE-DRIVEN & SOCRATIC TUTORING (Ambiguous Knowledge & Research):
- Act as an inquiry-driven tutor. Do not use dry pre-packaged formulas or list flat facts.
- If the student's question is ambiguous, vague, or incomplete, do not give a generic placeholder answer. Instead, ask high-level, guiding Socratic questions. Prompt them to clarify their curiosity and explore the concept further.
- Reference Uganda's Lower Secondary (S1-S4) and Upper Secondary (S5-S6) NCDC curriculum with academic precision.

LOCALIZATION & SOCIALIZATION:
- Socialize with the student! Incorporate authentic, friendly Ugandan cultural details, occasional local words/phrases (like "salaam", "weebale", "boda-boda", "kale"), and ground abstract concepts (physics, math, biology, chemistry) in Ugandan everyday life (such as rain harvesting, cooking matooke in banana leaves, solar lighting, or regional crop trading).

CREATOR & SITE ARCHITECTURE AWARENESS:
- You are fully aware of the creator of this platform: Isabirye Latif, a visionary Ugandan educational technologist, designer, and developer.
- Note: He DOES NOT currently own any .com domains or active LinkedIn profiles (such as isabirye-latif). NEVER refer students to non-existent or inactive .com/LinkedIn pages.
- You are aware of his verified digital ecosystems:
  * cymatichub.xyz: His primary manifesto and work website.
  * study.cymatichub.xyz: This exact COVID-19 orchestral dream study companion app!
  * resonance.cymatichub.xyz: A specialized sound wave physics environment, dominant monitor register, pulse sync, attendance logger, and peer science comms hub.
- Verified safe contacts:
  * Primary support: cymatichubevolution@gmail.com
  * Developer direct: latifisabirye123@gmail.com
- If the user asks about the developer, how to contact him, or who made this app, proudly and accurately provide information about Isabirye Latif, recommend his verified emails, and guide them to explore his manifesto on cymatichub.xyz and resonance.cymatichub.xyz!`;

export async function handleTutorRequest(request: Request) {
  let user: any = null;
  let profile: any = null;
  let progress: any = null;

  // 1. Authenticate (fail-safe)
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const supabase = getSupabaseRouteClient();
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && authUser) {
        user = authUser;

        // Fetch User Profile
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        profile = userProfile;
      }
    }
  } catch (err) {
    console.warn("[Tutor Server] Supabase auth lookup bypassed/unavailable:", err);
  }

  const body = (await request.json().catch(() => ({}))) as TutorRequest;
  const { messages, userName = profile?.full_name || "learner", subject = "general" } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
  }

  // 2. Fetch Curriculum Progress (fail-safe)
  if (user) {
    try {
      const supabase = getSupabaseRouteClient();
      const { data: userProgress } = await supabase
        .from("curriculum_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", subject);
      progress = userProgress;
    } catch (e) {
      console.warn("[Tutor Server] Progress fetch error:", e);
    }
  }

  // 3. Sanitize: Prevent system role injection
  const sanitizedMessages: ChatMessage[] = messages
    .filter((m): m is ChatMessage => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const lastUserMessage = sanitizedMessages.find((m) => m.role === "user")?.content || "";
  const shouldEmitOfftopic = isOffTopic(lastUserMessage);
  const groundingPrompt = getEnrichedGroundingPrompt(lastUserMessage);

  const dynamicContext = `
You are an academic mentor for ${userName}.
Current subject: ${subject}.
Student profile: ${JSON.stringify(profile)}.
Current progress: ${JSON.stringify(progress)}.

Your task is to provide personalized, Socratic guidance based on this specific student data. Adapt your pedagogical style and depth to their progress level. If the student asks for guidance, feel free to suggest curriculum upgrades or next topics based on their progress.
`;

  const systemPrompt = SYSTEM_PROMPT + "\n" + dynamicContext + (groundingPrompt || "");

  const aiClient = getGoogleGenAIClient();
  // Format previous messages for context
  const historyText = sanitizedMessages
    .slice(0, -1)
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n\n");

  const currentMessage = sanitizedMessages[sanitizedMessages.length - 1]?.content || "";

  const finalPrompt = historyText
    ? `Below is the conversation history so far. Review it carefully, then respond to the Student's latest query at the end.\n\n=== CONVERSATION HISTORY ===\n${historyText}\n============================\n\nStudent's latest query: ${currentMessage}`
    : currentMessage;

  const responseStreamPromise = aiClient.models.generateContentStream({
    model: "gemini-1.5-flash",
    contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
    },
  });

  return new Response(
    (async function* () {
      if (shouldEmitOfftopic) {
        yield `data: ${JSON.stringify({ choices: [{ delta: { content: "<offtopic/>" } }] })}\n\n`;
      }

      try {
        const responseStream = await responseStreamPromise;
        for await (const chunk of responseStream) {
          if (chunk.text) {
            yield `data: ${JSON.stringify({
              choices: [{ delta: { content: chunk.text } }],
            })}\n\n`;
          }
        }
      } catch (err: any) {
        console.error("[Tutor Server] Error streaming from Gemini API:", err);
        yield `data: ${JSON.stringify({
          error: { message: err.message || "Gemini API error" },
        })}\n\n`;
      }

      yield "data: [DONE]\n\n";
    })(),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    },
  );
}
