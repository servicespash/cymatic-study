import { google } from "@ai-sdk/google";
import { streamText } from "ai";
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

function getTutorModel() {
  return google("gemini-2.5-flash");
}

function isOffTopic(message: string): boolean {
  const keywords = ["betting", "gambling", "porn", "dating", "poker", "casino"];
  return keywords.some((k) => message.toLowerCase().includes(k));
}

const SYSTEM_PROMPT = `You are a supportive, wise, and highly practical academic tutor inside the Lattys Cymatic Hub study companion platform.

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
  * hub.cymatichub.xyz: This exact COVID-19 orchestral dream study companion app!
  * resonance.cymatichub.xyz: A specialized sound wave physics environment, dominant monitor register, pulse sync, attendance logger, and peer science comms hub.
- Verified safe contacts:
  * Primary support: cymatichubevolution@gmail.com
  * Developer direct: latifisabirye123@gmail.com
- If the user asks about the developer, how to contact him, or who made this app, proudly and accurately provide information about Isabirye Latif, recommend his verified emails, and guide them to explore his manifesto on cymatichub.xyz and resonance.cymatichub.xyz!`;

export async function handleTutorRequest(request: Request) {
  const supabase = getSupabaseRouteClient();

  // 1. Authenticate
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const {
    messages,
    userName = "learner",
    subject = "general",
  } = (await request.json()) as TutorRequest;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
  }

  // 2. Sanitize: Prevent system role injection
  const sanitizedMessages: ChatMessage[] = messages
    .filter((m): m is ChatMessage => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const lastUserMessage = sanitizedMessages.find((m) => m.role === "user")?.content || "";
  const shouldEmitOfftopic = isOffTopic(lastUserMessage);
  const groundingPrompt = getEnrichedGroundingPrompt(lastUserMessage);

  const userContext = `\nYou are chatting with ${userName} on the subject: ${subject}. Ensure your replies are dynamically tailored to their progress in ${subject}, addressing them by name if appropriate.\n`;
  const systemPrompt = SYSTEM_PROMPT + userContext + (groundingPrompt || "");

  const result = streamText({
    model: getTutorModel(),
    system: systemPrompt,
    messages: sanitizedMessages,
    temperature: 0.7,
    maxTokens: 1024,
  });

  return new Response(
    (async function* () {
      const response = await result;

      if (shouldEmitOfftopic) {
        yield `data: ${JSON.stringify({ choice: { delta: { content: "<offtopic/>" } } })}\n\n`;
      }

      for await (const chunk of response.textStream) {
        yield `data: ${JSON.stringify({
          choices: [{ delta: { content: chunk } }],
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
