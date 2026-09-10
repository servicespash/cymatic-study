import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { type ChatMessage, type TutorRequest } from "../types/tutor-api";
import { getEnrichedGroundingPrompt } from "../lib/developer-grounding";
import { sanitizeTutorResponse } from "../utils/tutor-sanitization";

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

const SYSTEM_PROMPT = `You are a supportive, wise, and deeply empathetic academic tutor inside the Lattys Cymatic Study platform.

CRITICAL IDENTITY & CONTEXT RULES:
1. Address the student with profound warmth and curiosity in conversational Ugandan English. You are their most patient mentor.
2. Empathy First: Always acknowledge the student's effort or potential frustration before diving into technical details. Use phrases like "I see you're working hard on this," or "It's okay if this feels complex, we'll walk through it together."
3. NEVER admit to being an AI. You are a real academic mentor who cares about their success.
4. Keep dialogue encouraging, respectful, and wise.

PEDAGOGICAL STYLE (Socratic & Discovery-Driven):
- Act as an inquiry-driven guide. Do not lecture. Ask gentle, high-level questions that prompt students to discover the truth for themselves.
- If they are wrong, don't just correct them. Ask, "That's an interesting thought! What led you to that conclusion?" or "Let's test that idea against what we know about [Concept]."
- Reference Uganda's NCDC curriculum (S1-S6) with precision.

LOCALIZATION & SOCIALIZATION:
- Socialize warmly! Use Ugandan cultural nuances and local words (salaam, weebale, kale). 
- Ground abstract concepts in local life (e.g., explaining velocity using a boda-boda on a rainy day in Kampala, or biology via the growth of matooke).

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
  let user: unknown = null;
  let profile: unknown = null;
  let progress: unknown = null;

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
  const { messages, userName = (profile as any)?.full_name || "learner", subject = "general" } = body;

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
        .eq("user_id", (user as any).id)
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
  const modelsToTry = ["gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

  if (!useFallback && aiClient) {
    for (const modelName of modelsToTry) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          responseStreamPromise = aiClient.models.generateContentStream({
            model: modelName,
            contents,
            config: {
              systemInstruction: systemPrompt,
            },
          });
          // Wait for the stream to establish
          await responseStreamPromise;
          break;
        } catch (genErr: unknown) {
          attempts++;
          const errStr = (genErr as Error)?.message || String(genErr);
          const isTransient =
            errStr.includes("503") ||
            errStr.includes("UNAVAILABLE") ||
            errStr.includes("429") ||
            errStr.includes("high demand") ||
            errStr.includes("Resource exhausted");

          console.warn(`[Tutor Server] Model ${modelName} attempt ${attempts} failed:`, errStr);

          if (isTransient && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          break;
        }
      }

      if (responseStreamPromise) {
        break;
      }
    }

    if (!responseStreamPromise) {
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
            persona: subject === "physics" || subject === "mathematics" ? "Adams" : "Haawa",
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
