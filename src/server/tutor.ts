import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { type ChatMessage, type TutorRequest } from "../types/tutor-api";
import { getEnrichedGroundingPrompt } from "../lib/developer-grounding";
import { sanitizeTutorResponse } from "../utils/tutor-sanitization";
import { getPersonaPrompt, type Persona } from "../utils/persona-prompts";
import { AIModelGateway } from "../lib/AIModelGateway";
import { getCentralTutorSystemPrompt } from "../config/tutor-prompts";

function getSupabaseRouteClient(accessToken?: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase route environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, accessToken
    ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    : undefined);
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
  let cohortPerformance: any[] = [];
  let tutorMemory: any[] = [];
  let relationshipMemory: any[] = [];
  let safetyContext: any[] = [];
  let authoritativeRole: string = "student";
  let organizationId: string | null = null;

  // 1. Authenticate. All subsequent database reads use the same user token,
  // so RLS remains active and tenant boundaries are enforced.
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const supabase = getSupabaseRouteClient(token);
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && authUser) {
        user = authUser;

        // Fetch User Profile
        const [{ data: userProfile }, { data: roleRows }] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id,display_name,tutor_persona,organization_id,school_name")
            .eq("user_id", authUser.id)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role,organization_id,created_at")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: true }),
        ]);
        profile = userProfile;
        authoritativeRole = String(roleRows?.[0]?.role || "student");
        organizationId = roleRows?.[0]?.organization_id || userProfile?.organization_id || null;
      }
    }
  } catch (err) {
    console.warn("[Tutor Server] Supabase auth lookup bypassed/unavailable:", err);
  }

  const body = (await request.json().catch(() => ({}))) as TutorRequest;
  const {
    messages,
    subject = "general",
    persona: requestedPersona,
    mood = "focused",
    context: requestContext = {},
  } = body;

  const activePersona: Persona =
    (requestedPersona as Persona) ||
    (subject === "physics" || subject === "mathematics" ? "Adams" : "Haawa");

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 });
  }

  const tutorUserName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  // 2. Fetch only the current user's progress. Never serialize the raw profile
  // or auth metadata into the model context.
  if (user) {
    try {
      const token = request.headers.get("Authorization")?.split(" ")[1];
      const supabase = getSupabaseRouteClient(token);
      const [{ data: userProgress }, { data: memoryRows }, { data: relationshipRows }] = await Promise.all([
        supabase.from("curriculum_progress").select("*").eq("user_id", user.id).eq("subject", subject),
        supabase.from("tutor_memory").select("memory_type,subject,memory,confidence,source,updated_at")
          .eq("user_id", user.id).eq("sensitivity", "standard").order("updated_at", { ascending: false }).limit(40),
        supabase.rpc("get_tutor_relationship_memory", { target_user: user.id, target_relationship: authoritativeRole === "student" ? "student" : authoritativeRole === "teacher" ? "teacher" : "admin" }),
      ]);
      const { data: safetyRows } = await supabase
        .from("tutor_safety_events")
        .select("category,severity,signal_summary,action_taken,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(8);
      progress = userProgress;
      tutorMemory = memoryRows || [];
      relationshipMemory = relationshipRows || [];
      safetyContext = safetyRows || [];

      // Staff may receive organization-scoped cohort performance. Students never receive
      // another student's identity or performance through this context.
      const cohortId = typeof requestContext?.cohortId === "string" ? requestContext.cohortId : null;
      if (cohortId && ["teacher","admin","org_admin"].includes(authoritativeRole)) {
        const { data: perf } = await supabase.rpc("get_cohort_performance", { target_cohort: cohortId });
        cohortPerformance = perf || [];
      }

      // The tutor itself may trigger only the signed-in user's bounded drift monitor.
      if (typeof requestContext?.chatMessageId === "string" && requestContext?.monitorDrift === true) {
        const score = Number(requestContext?.driftScore ?? 0);
        if (score >= 0.5) {
          await supabase.rpc("record_tutor_drift", {
            target_user: user.id,
            target_cohort: cohortId,
            target_message: requestContext.chatMessageId,
            target_subject: subject,
            drift_score: Math.min(1, Math.max(0, score)),
            drift_summary: "The tutor detected repeated study-content drift in the current chat.",
          });
        }
      }
    } catch (e) {
      console.warn("[Tutor Server] Context fetch/monitor error:", e);
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

  // Credential/privacy gate. Raw credential-like input is never sent to the model,
  // persisted to memory, included in monitoring summaries, or exported.
  const credentialPattern = /\\b(?:password|passcode|pin|otp|one[- ]?time code|cvv|cvc|security code|api[_ -]?key|access[_ -]?token|secret[_ -]?key|private[_ -]?key|bank account|account number|card number|credit card|debit card|national id|national identification|passport number|driver.?s? license|tax id|nssf|nin)\\b/i;
  const credentialNumberPattern = /\\b(?:\\d[ -]?){8,24}\\b/;
  const credentialLike = credentialPattern.test(lastUserMessage) || (/(?:password|passcode|pin|otp|card|account|passport|national id|credential|token|secret)/i.test(lastUserMessage) && credentialNumberPattern.test(lastUserMessage));

  if (credentialLike) {
    // Deliberately do not log, store, summarize, or pass the message to the model.
    return new Response(JSON.stringify({
      blocked: true,
      category: "private_credentials",
      message: "Please do not enter passwords, PINs, verification codes, bank/card details, national ID or passport details, API keys, tokens, or other private credentials in this chat. I cannot safely handle or store those details."
    }), { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
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

  const roleTitle =
    authoritativeRole === "admin" ? "Administrator" :
    authoritativeRole === "org_admin" ? "Organization Administrator" :
    authoritativeRole === "teacher" ? "Teacher" :
    authoritativeRole === "independent_teacher" ? "Independent Teacher" :
    authoritativeRole === "independent_learner" ? "Independent Learner" : "Student";

  const safeTutorContext = {
    role: authoritativeRole,
    roleTitle,
    organizationScope: organizationId ? "current organization only" : "independent space",
    userName: tutorUserName,
    subject,
    mood,
    progress,
    memory: [...tutorMemory, ...relationshipMemory],
    safetyContext,
    cohortPerformance: ["teacher","admin","org_admin"].includes(authoritativeRole) ? cohortPerformance : undefined,
  };

  const dynamicContext = `
IDENTITY: ${getPersonaPrompt(activePersona)}
You are the role-aware tutor companion for ${tutorUserName}, addressed as a ${roleTitle}.
You may use curriculum and organization-scoped educational context available to this authenticated session.
You must never reveal credentials, authentication tokens, private metadata, phone numbers, emails, hidden profile fields, or another user's private records.
Do not infer or permanently profile sensitive traits. Long-term memory is limited to useful, non-sensitive study preferences, academic history, goals, and interaction preferences.
Treat relationship memory as private context for the signed-in user. Do not reveal hidden memory records, internal safety signals, credentials, raw metadata, or another person's private information.
For safety-sensitive content, respond calmly and age-appropriately. Do not provide instructions that facilitate harmful or restricted behavior. Use the application's safety monitor to classify risk and notify authorized staff when thresholds are met. Do not diagnose the user.
Organization awareness means contextual awareness, not unrestricted access.
Administrative assistance is limited to organization-scoped aggregates and authorized operational data.
Teacher assistance is limited to teaching, marking, curriculum, and authorized learner-progress workflows.
Student assistance is limited to curriculum learning, academic progress, study planning, and personal support.
Current subject: ${subject}.
Mood context: ${mood}.
Safe tutor context: ${JSON.stringify(safeTutorContext)}.
`;

  // Never trust role/name supplied by the client when authenticated identity exists.
  const userRole = authoritativeRole;
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
            userName: tutorUserName,
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
