// Mood engine: derive the learner's current mood from recent quiz performance
// and engagement, then translate it into messaging style for Adams / Hawa.
import { db } from "@/lib/offline-db";

export type Mood =
  | "soaring" // crushing it (avg ≥ 85%)
  | "steady" // doing fine (70–84%)
  | "wobbling" // slipping (50–69%)
  | "struggling" // 0–49%
  | "rusty" // engaged in last 24h but no quizzes today
  | "absent"; // no engagement in 3+ days / new user

export type Engagement = {
  attemptsToday: number;
  attempts7d: number;
  avgPct7d: number;
  passRate7d: number;
  lastAttemptAt: number | null;
  streakDays: number;
};

export type MoodSnapshot = {
  mood: Mood;
  engagement: Engagement;
};

const DAY = 24 * 60 * 60 * 1000;

function uniqueDays(times: number[]) {
  const set = new Set<string>();
  for (const t of times) set.add(new Date(t).toDateString());
  return set;
}

function streakFrom(days: Set<string>): number {
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * DAY).toDateString();
    if (days.has(d)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export async function computeMood(userId?: string): Promise<MoodSnapshot> {
  const now = Date.now();
  const cutoff = now - 7 * DAY;
  const all = await db.attempts.toArray();
  const mine = userId ? all.filter((a) => a.user_id === userId) : all;
  const recent = mine.filter((a) => new Date(a.created_at).getTime() >= cutoff);
  const todayKey = new Date().toDateString();
  const today = mine.filter((a) => new Date(a.created_at).toDateString() === todayKey);

  const avgPct7d = recent.length
    ? Math.round(recent.reduce((s, a) => s + a.score_pct, 0) / recent.length)
    : 0;
  const passRate7d = recent.length
    ? Math.round((recent.filter((a) => a.passed).length / recent.length) * 100)
    : 0;
  const lastAttemptAt = mine.length
    ? Math.max(...mine.map((a) => new Date(a.created_at).getTime()))
    : null;
  const streakDays = streakFrom(uniqueDays(mine.map((a) => new Date(a.created_at).getTime())));

  const engagement: Engagement = {
    attemptsToday: today.length,
    attempts7d: recent.length,
    avgPct7d,
    passRate7d,
    lastAttemptAt,
    streakDays,
  };

  let mood: Mood;
  if (!lastAttemptAt || now - lastAttemptAt > 3 * DAY) mood = "absent";
  else if (today.length === 0) mood = "rusty";
  else if (avgPct7d >= 85) mood = "soaring";
  else if (avgPct7d >= 70) mood = "steady";
  else if (avgPct7d >= 50) mood = "wobbling";
  else mood = "struggling";

  return { mood, engagement };
}

export const MOOD_LABEL: Record<Mood, string> = {
  soaring: "On fire 🔥",
  steady: "Locked in ✅",
  wobbling: "Shaky 🌊",
  struggling: "Heavy ☔",
  rusty: "Rusty 🛠️",
  absent: "Quiet 🌙",
};

export type Persona = "Adams" | "Haawa";

/**
 * Style instructions injected into the tutor system prompt so chat replies
 * adapt to current mood + engagement. Keep it punchy — no robotic, news, or
 * legal tone.
 */
export function moodStylePrompt(persona: Persona, snap: MoodSnapshot): string {
  const { mood, engagement } = snap;
  const adams = persona === "Adams";
  const base = adams
    ? "You are Adams — the big-brother mentor. Protective, practical, encouraging, and direct. Use warm Ugandan English with light slang ('fam', 'bro', 'sawa', 'secure the bag'). Short, punchy, energetic. Focus on the grind and future success."
    : "You are Haawa — the wise big-sister mentor. Supportive, guiding, and articulate. Soft, lyrical, and brief. Never use weak filler phrases like 'my dear'. Focus on wisdom, growth, and steady progress.";

  const moodLines: Record<Mood, { adams: string; hawa: string }> = {
    soaring: {
      adams:
        "They're crushing it. Hype them up, then push the next challenge. Remind them to keep securing the bag through consistency.",
      hawa: "They are excelling. Acknowledge their growth with wisdom, then plant a deeper question to expand their understanding.",
    },
    steady: {
      adams:
        "They're locked in. Celebrate the rhythm. Give them a practical tip to sharpen their edge.",
      hawa: "They walk a steady path. Honor their discipline and offer a small, articulate refinement.",
    },
    wobbling: {
      adams:
        "They're shaky. Coach mode: no excuses, just practical steps. Break it down so they can win.",
      hawa: "They are finding their footing. Guide them with patience and clarity. One wise step at a time.",
    },
    struggling: {
      adams:
        "They're hitting a wall. Protective mode: lift the care, focus on basics. Remind them you've got their back.",
      hawa: "The path is difficult right now. Speak with calm wisdom. Remind them of their strength and start from the foundational truths.",
    },
    rusty: {
      adams:
        "They've been quiet. Nudge with direct energy: 'One quick win, bro. Secure the future.'",
      hawa: "The mind has been still. Invite them back to the light of learning with a purposeful task.",
    },
    absent: {
      adams:
        "Long time no see. Welcome them back like family. Suggest one immediate, practical win to get back on track.",
      hawa: "They have been away. Welcome them home with warmth and grace. Offer a simple, meaningful starting point.",
    },
  };

  const line = adams ? moodLines[mood].adams : moodLines[mood].hawa;
  const stats = `Recent: ${engagement.attempts7d} attempts/7d, avg ${engagement.avgPct7d}%, streak ${engagement.streakDays}d.`;
  return `${base}\nLearner mood: ${mood.toUpperCase()}. ${line}\n${stats}`;
}

/** Short spoken intro to use before TTS replies / greetings. */
export function moodIntro(persona: Persona, mood: Mood, name?: string): string {
  const who = name ? `, ${name}` : "";
  const adams: Record<Mood, string> = {
    soaring: `Yo${who}, you're cooking! Secure the bag, fam.`,
    steady: `Sawa${who}, you're locked in. Let's move.`,
    wobbling: `Aight${who}, no excuses. We adjust and win.`,
    struggling: `I got you${who}. We start with the basics.`,
    rusty: `Eyy${who}, one quick win — let's wake it up.`,
    absent: `Yo${who}, welcome back. Let's secure the future.`,
  };
  const hawa: Record<Mood, string> = {
    soaring: `The path is clear today${who}. Your growth is evident.`,
    steady: `Walk steadily${who} — your discipline is your strength.`,
    wobbling: `Breathe${who}. Let us find the clarity you need.`,
    struggling: `Be calm${who}. We will rebuild from the truth.`,
    rusty: `Come${who} — a purposeful start awaits us.`,
    absent: `Welcome home${who}. Let us begin with intention.`,
  };
  return persona === "Adams" ? adams[mood] : hawa[mood];
}
