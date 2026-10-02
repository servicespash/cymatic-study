import type { TutorPersona } from "./tutor-context";
import { type MoodSnapshot } from "./mood-engine";
import { generateEmpathyResponse, getTimeContext } from "./empathy-engine";

/**
 * buildGreeting is now a dynamic wrapper around the Empathy Engine.
 */
export async function buildGreeting(
  persona: TutorPersona,
  opts?: { name?: string; weather?: string; ad?: string; mood?: MoodSnapshot | null },
): Promise<string> {
  const isOnline = typeof navigator !== "undefined" && navigator.onLine;

  const context = {
    name: opts?.name || "learner",
    mood: opts?.mood?.mood || null,
    time: getTimeContext(),
    district: opts?.weather ? opts.weather.split(" in ")[1] : undefined,
    isOnline: isOnline,
  };

  const greeting = await generateEmpathyResponse(persona, context, "greeting");

  // Append weather or ad if they aren't already integrated by AI
  let extra = "";
  if (opts?.ad) {
    extra +=
      persona.name === "Haawa"
        ? ` Oh, and check the news tab — ${opts.ad}, my dear.`
        : ` Yo, peep the news tab — ${opts.ad}.`;
  }

  return `${greeting}${extra}`;
}

export async function fetchWeatherSummary(): Promise<string | null> {
  try {
    if (typeof navigator === "undefined" || !navigator.onLine) return null;
    const ipRes = await fetch("https://ipapi.co/json/");
    if (!ipRes.ok) return null;
    const ip = await ipRes.json();
    const lat = ip.latitude,
      lon = ip.longitude;
    if (lat == null || lon == null) return null;
    const wRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
    );
    if (!wRes.ok) return null;
    const w = await wRes.json();
    const t = Math.round(w?.current_weather?.temperature ?? 0);
    return `${t} degrees in ${ip.city || "your city"}`;
  } catch {
    return null;
  }
}
