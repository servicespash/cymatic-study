/**
 * 🧬 CYMATIC HUB: EMPATHY ENGINE
 * This engine replaces hard-coded strings with dynamic, AI-driven context.
 */

import { supabase } from "@/integrations/supabase/client";
import type { TutorPersona } from "./tutor-context";
import type { UserMood } from "./user-mood-context";
import { EMPATHY_DATA } from "@/config/empathy-data";

export type EmpathyContext = {
  name: string;
  mood: string | null;
  time: string; // E.g., "morning", "afternoon"
  district?: string;
  points?: number;
  isOnline: boolean;
};

/**
 * Generates a dynamic reaction or greeting.
 * If online, it ideally would call a lightweight AI endpoint or use cached AI vibes.
 * For now, it orchestrates the context and fetches from the edge function if needed.
 */
export async function generateEmpathyResponse(
  persona: TutorPersona,
  context: EmpathyContext,
  trigger: "greeting" | "mood_change" | "milestone",
): Promise<string> {
  if (context.isOnline) {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;

      if (accessToken) {
        const response = await fetch(`/api/tutor`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `[INTERNAL_TRIGGER: ${trigger}] Context: Name=${context.name}, Mood=${context.mood}, Time=${context.time}, District=${context.district || "Uganda"}. Generate a short, 1-sentence ${trigger === "greeting" ? "greeting" : "reaction"} in your persona.`,
              },
            ],
            persona: persona.voice,
            mood: context.mood,
            userMood: context.mood, // Using mood as userMood for internal triggers
            userName: context.name,
            user_id: sess.session?.user?.id,
            context: {
              weather: context.district ? `Weather in ${context.district}` : undefined,
              district: context.district,
              points: context.points || 0,
              timeContext: context.time,
              route: "Internal Trigger",
            },
            internal: true,
          }),
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          if (reader) {
            const dec = new TextDecoder();
            let fullText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = dec.decode(value);
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const j = line.slice(6).trim();
                  if (j === "[DONE]") break;
                  try {
                    const p = JSON.parse(j);
                    const c = p.choices?.[0]?.delta?.content;
                    if (c) fullText += c;
                  } catch (err) {
                    console.warn("JSON parsing failed", err);
                  }
                }
              }
            }
            if (fullText.trim()) return fullText.trim();
          }
        }
      }
    } catch (err) {
      console.warn("AI empathy response failed", err);
    }
  }

  // Offline or AI failure: Use "Soul" Template Logic (Not hard-coded strings, but logic-driven)
  return getSoulTemplate(persona, context, trigger);
}

function getSoulTemplate(
  persona: TutorPersona,
  context: EmpathyContext,
  trigger: "greeting" | "mood_change" | "milestone",
): string {
  const { name, mood, time } = context;
  const isAdams = persona.name === "Adams";
  const student = name || (isAdams ? "bro" : "friend");

  // Salutations
  const salutation = isAdams
    ? EMPATHY_DATA.adamsSalutations[Math.floor(Math.random() * EMPATHY_DATA.adamsSalutations.length)]
    : EMPATHY_DATA.haawaSalutations[Math.floor(Math.random() * EMPATHY_DATA.haawaSalutations.length)];

  // Time expressions
  let timeStr = "this moment";
  if (time === "morning") timeStr = "this beautiful morning";
  else if (time === "afternoon") timeStr = "this fine afternoon";
  else if (time === "evening") timeStr = "this peaceful evening";
  else if (time === "night") timeStr = "these late study hours";

  if (trigger === "greeting") {
    // Propose an inquiry-based trigger
    const act = EMPATHY_DATA.activities[Math.floor(Math.random() * EMPATHY_DATA.activities.length)];

    if (isAdams) {
      return `${salutation}, ${student}! Let's make every second of ${timeStr} count. Ready to ${act}?`;
    } else {
      return `${salutation}, my dear ${student}. May focus and clarity guide you in ${timeStr}. Shall we ${act}?`;
    }
  }

  if (trigger === "mood_change") {
    const state = mood || "pensive";
    const responseMap = isAdams ? EMPATHY_DATA.adamsMoodResponses : EMPATHY_DATA.haawaMoodResponses;
    return (
      (responseMap as Record<string, string>)[state] ||
      (isAdams
        ? `Feeling ${state}? I'm right here in your corner, bro. Let's keep it moving.`
        : `I recognize you are feeling ${state}. Take comfort, and let us study with ease.`)
    );
  }

  if (trigger === "milestone") {
    const sub = EMPATHY_DATA.subjects[Math.floor(Math.random() * EMPATHY_DATA.subjects.length)];
    if (isAdams) {
      return `${salutation}, ${student}! Big moves on those achievements! Your compiled termly mark is rising. Let's keep dominating ${sub}!`;
    } else {
      return `Excellence shown, ${student}! I am deeply inspired by your persistence. Every step elevates your competency descriptor. Wonderful pacing!`;
    }
  }

  return isAdams ? "Let's make progress, bro!" : "May your learning journey be blessed.";
}

export function getTimeContext(): string {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}
