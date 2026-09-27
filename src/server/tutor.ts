import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { type ChatMessage, type TutorRequest } from "../types/tutor-api";
import { getEnrichedGroundingPrompt } from "../lib/developer-grounding";
import { sanitizeTutorResponse } from "../utils/tutor-sanitization";
import { getPersonaPrompt, type Persona } from "../utils/persona-prompts";
import { AIModelGateway } from "../lib/AIModelGateway";
import { getCentralTutorSystemPrompt } from "../config/tutor-prompts";

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
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_KEY;

  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please configure GEMINI_API_KEY in the environment.");
  }

  return new GoogleGenAI({
    apiKey,
  });
}

function isOffTopic(message: string): boolean {
  const keywords = ["betting", "gambling", "porn", "dating", "poker", "casino"];
  return keywords.some((k) => message.toLowerCase().includes(k));
}

function getSystemPrompt(role: string, name: string): string {
  return getCentralTutorSystemPrompt(role, name, "male");
}

const BASE_DYNAMIC_INSTRUCTIONS = `
FORMATTING RULES:
1. IMPORTANT: Do NOT include internal noise characters like //** or //* in your response. Keep it clean and direct.
2. HYPERLINKS & CONTACTS: When mentioning emails, URLs, or phone numbers, you MUST ensure they are surrounded by spaces. NEVER conjoin them with following words (e.g., do NOT write "gmail.comor", instead write "gmail.com or").
3. URLs: Always provide the full absolute URL including "https://". Do NOT include "www.". (e.g. "https://study.cymatichub.xyz").
`;

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
          .eq("user_id", authUser.id)
          .maybeSingle();
        profile = userProfile;
      }
    }
  } catch (err) {
    console.warn("[Tutor Server] Supabase auth lookup bypassed/unavailable:", err);
  }

  const body = (await request.json().catch(() => ({}))) as TutorRequest;
  const {
    messages,
    userName = (profile as any)?.full_name || "learner",
    userRole: requestedRole,
    subject = "general",
    persona: requestedPersona,
    mood = "focused",
  } = body;

  const activePersona: Persona =
    (requestedPersona as Persona) ||
    (subject === "physics" || subject === "mathematics" ? "Adams" : "Haawa");

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

  const lastUserMessage = sanitizedMessages.findLast((m) => m.role === "user")?.content || "";
  const shouldEmitOfftopic = isOffTopic(lastUserMessage);
  const groundingPrompt = getEnrichedGroundingPrompt(lastUserMessage);

  // 4. Handle Meta Generation Mode
  if (body.mode === "generate_meta") {
    const metaPrompt = `You are an academic summarizer for Cymatic Study Hub. 
Analyze the study session history provided and generate:
1. TITLE: A concise, academically relevant title (max 5 words, e.g. "Linear Equations Mastery").
2. SUMMARY: A high-value revision summary highlighting the core educational takeaway or concept explained (max 40 words).

Your goal is to create a "Study Card" that a student can use for quick revision.
Format your response as a strictly valid JSON object: {"title": "...", "summary": "..."}`;

    try {
      const aiClient = getGoogleGenAIClient();
      const result = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ role: "user", parts: [{ text: [metaPrompt, ...sanitizedMessages.map(m => `${m.role}: ${m.content}`)].join("\n\n") }] }],
        config: { responseMimeType: "application/json" }
      });
      const responseText = result.text || "";
      
      // Clean up potential markdown formatting
      const cleanedJson = responseText.replace(/```json|```/g, "").trim();
      return new Response(cleanedJson, { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      console.error("[Tutor Server] Meta generation failed:", e);
      return new Response(JSON.stringify({ title: "Study Session", summary: "Exploring concepts together." }), { status: 500 });
    }
  }

  const dynamicContext = `
IDENTITY: ${getPersonaPrompt(activePersona)}
You are currently mentoring ${userName}.
Current subject: ${subject}.
Learner Mood Context: ${mood}.
Student profile context: ${JSON.stringify(profile)}.
Current progress context: ${JSON.stringify(progress)}.

Your task is to provide personalized, Socratic guidance based on this specific student data. 
Adapt your pedagogical style and depth to their progress level. 
If the student asks for guidance, feel free to suggest curriculum upgrades or next topics based on their progress.
`;

  const userRole = requestedRole || profile?.role || "student";
  const tutorUserName = profile?.display_name || user?.email?.split("@")[0] || "Scholar";
  const systemPrompt = getSystemPrompt(userRole, tutorUserName) + "\n" + dynamicContext + BASE_DYNAMIC_INSTRUCTIONS + (groundingPrompt || "");

  let aiClient;
  let useFallback = false;
  try {
    aiClient = getGoogleGenAIClient();
  } catch (err) {
    console.warn(
      "[Tutor Server] Could not initialize GoogleGenAI client, falling back to Supabase Edge Function:",
      err,
    );
    useFallback = true;
  }

  // Format previous messages for context using native roles
  const contents = sanitizedMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  let responseStreamPromise: Promise<any> | null = null;

  if (!useFallback) {
    try {
      const gatewayResult = await AIModelGateway.generateStreamWithFallback({
        contents,
        systemInstruction: systemPrompt,
      });
      responseStreamPromise = Promise.resolve(gatewayResult.stream);
    } catch (gwErr) {
      console.warn("[Tutor Server] AIModelGateway failed, falling back to Edge function:", gwErr);
      useFallback = true;
    }
  }

  if (useFallback) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey =
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_KEY ||
        process.env.SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const edgeUrl = `${supabaseUrl}/functions/v1/tutor-chat`;
        const token = request.headers.get("Authorization")?.split(" ")[1] || "";
        const res = await fetch(edgeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: supabaseKey,
          },
          body: JSON.stringify({
            messages: sanitizedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            persona: activePersona,
            userName,
            subject,
          }),
        });

        if (res.ok && res.body) {
          return new Response(res.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }
      }
    } catch (fallbackErr) {
      console.error("[Tutor Server] Fallback to Supabase Edge Function failed:", fallbackErr);
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      if (shouldEmitOfftopic) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: "<offtopic/>" } }] })}\n\n`,
          ),
        );
      }

      try {
        if (!responseStreamPromise) {
          throw new Error("Unable to establish Gemini AI stream. Please retry in a moment.");
        }
        const responseStream = await responseStreamPromise;
        for await (const chunk of responseStream) {
          if (chunk.text) {
            // Sanitize response: strip out collateral character sequences like //**
            const sanitizedText = sanitizeTutorResponse(chunk.text);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  choices: [{ delta: { content: sanitizedText } }],
                })}\n\n`,
              ),
            );
          }
        }
      } catch (err: unknown) {
        console.error("[Tutor Server] Error streaming from Gemini API:", err);
        const errStr = (err as Error)?.message || String(err);
        const isQuotaOrDemand =
          errStr.includes("429") ||
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("Resource exhausted") ||
          errStr.includes("UNAVAILABLE") ||
          errStr.includes("Quota");

        const friendlyMsg = isQuotaOrDemand
          ? "Weebale for your patience! The AI mentor network is currently experiencing temporary high traffic. Please try sending your question again in just a few seconds, or review the relevant topic notes above!"
          : errStr || "AI mentor temporary error. Please try again.";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              choices: [{ delta: { content: friendlyMsg } }],
            })}\n\n`,
          ),
        );
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
